const express = require('express');
const router = express.Router();
const ForumTopic = require('../models/forumTopicSchema');
const ForumReply = require('../models/forumReplySchema');
const authenticate = require('../middleware/authenticate');
const { awsuploadMiddleware, awsdeleteMiddleware, generateSignedUrl,uploadImageFromUrl, uploadImageFromBlob } = require('../middleware/awsmiddleware');
const multer = require('multer');
const AWS = require('aws-sdk');
const { modelSelection } = require('../middleware/LLMmiddleware');
const {deleteForumById} = require('../middleware/DeleteMiddleware');
const notifiyUser = require("../middleware/notification");
const { decodeId, encodeId } = require('../utils/hashids');
const upload = multer({
  storage: multer.memoryStorage(),   // keep files in memory buffer
  limits: {
    fileSize: 50 * 1024 * 1024,   // 50 MB max per file
    fieldSize: 100 * 1024 * 1024, // 100 MB max per text field (for base64 strings in req.body)
    fields: 20,                   // max number of non-file fields
    files: 10,                    // max number of files
  }
});


// Configure AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

// Get all topics with optional filtering
router.get('/topics', async (req, res) => {
  try {
    const { sort, userId, search, tag } = req.query;
    let query = {};
    
    // Filter by user ID if provided
    if (userId) {
      query.userId = userId;
    }
    
    // Filter by tag if provided
    if (tag) {
      query.tags = tag;
    }
    
    // Search by title or content if search term provided
    if (search) {
      query.$text = { $search: search };
    }
    
    // Determine sort order
    let sortOption = { createdAt: -1 }; // Default: newest first
    if (sort === 'popular') {
      sortOption = { viewCount: -1, replyCount: -1 };
    } else if (sort === 'oldest') {
      sortOption = { createdAt: 1 };
    }
    
    // Get topics with pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // First get pinned topics (if on first page)
    let topics = [];
    if (page === 1) {
      const pinnedTopics = await ForumTopic.find({ ...query, isPinned: true })
        .sort(sortOption)
        .limit(5);
      topics = [...pinnedTopics];
    }
    
    // Then get regular topics
    const regularTopics = await ForumTopic.find({ ...query, isPinned: false })
      .sort(sortOption)
      .skip(skip)
      .limit(limit);
    
    topics = [...topics, ...regularTopics];
    
    // Process media attachments to generate signed URLs
    
    // Get total count for pagination
    const totalTopics = await ForumTopic.countDocuments(query);
    
    res.status(200).json({
      status: 200,
      topics: topics,
      pagination: {
        total: totalTopics,
        page,
        pages: Math.ceil(totalTopics / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching topics:', error);
    res.status(500).json({ status: 500, error: 'Server error' });
  }
});

// Get a single topic by ID
router.get('/topics/:id', async (req, res) => {
  try {
   
    const realId = decodeId(req.params.id);
   
    if(!realId)  return res.status(400).json({error: 'invalid ID'});
    
    const topic = await ForumTopic.findById(realId);
    if (!topic) {
      return res.status(404).json({ status: 404, error: 'Topic not found' });
    }
    
    // Increment view count
    topic.viewCount += 1;
    await topic.save();

    // const topicObj = topic.toObject();
    // topicObj.id = req.params.id; // keep encoded in response
    //res.json({ topic: topicObj });
    
    // Process media attachments to generate signed URLs
    
    res.status(200).json({ status: 200, topic: topic });

  } catch (error) {
    console.error('Error fetching topic:', error);
    res.status(500).json({ status: 500, error: 'Server error' });
  }
});

// Create a new topic
router.post('/topics', authenticate, upload.array('media', 5), awsuploadMiddleware, async (req, res) => {
  try {
    const { title, content, tags, userId, userName, imageUrl } = req.body;

    let finalImageUrl = imageUrl;
    if (imageUrl) {
      try {
        const uploaded = await uploadImageFromUrl(imageUrl);
        finalImageUrl = uploaded.fileUrl;
      } catch (err) {
        return res.status(400).json({ status: 400, error: 'Failed to upload image from URL' });
      }
    }
    
    if (!title || !content) {
      return res.status(400).json({ status: 400, error: 'Title and content are required' });
    }
    
    // Use the authenticated user ID from the request if available
    const actualUserId = req.userId || userId;
    const actualUserName = req.rootuser?.userName || userName;
    
    if (!actualUserId || !actualUserName) {
      return res.status(400).json({ status: 400, error: 'User information is required' });
    }

    // Handle media attachments if any
    const mediaAttachments = req.uploadedFiles || [];
    
    const newTopic = new ForumTopic({
      title,
      content,
      userId: actualUserId,
      userName: actualUserName,
      tags: tags || [],
      mediaAttachments,
      imageUrl: finalImageUrl,
      likes: [],
      dislikes: [],
      children: []
    });
    
    const savedTopic = await newTopic.save();
    
    res.status(201).json({ status: 201, topic: savedTopic });
  } catch (error) {
    console.error('Error creating topic:', error);
    res.status(500).json({ 
      status: 500, 
      error: 'Server error',
      message: error.message 
    });
  }
});


// Delete a topic
router.delete('/topics/:id', authenticate, async (req, res) => {
  try {
    const topic = await ForumTopic.findById(req.params.id);
    
    if (!topic) {
      return res.status(404).json({ status: 404, error: 'Topic not found' });
    }
    
    // Check if user is the owner of the topic
    if (topic.userId.toString() !== req.userId.toString()) {
      return res.status(403).json({ status: 403, error: 'Not authorized to delete this topic' });
    }

    // Delete media attachments from S3
    if (topic.mediaAttachments && topic.mediaAttachments.length > 0) {
      for (const attachment of topic.mediaAttachments) {
        await awsdeleteMiddleware(attachment.fileName);
      }
    }
    
    // Delete all replies to this topic
    const replies = await ForumReply.find({ topicId: req.params.id });
    for (const reply of replies) {
      if (reply.mediaAttachments && reply.mediaAttachments.length > 0) {
        for (const attachment of reply.mediaAttachments) {
          await awsdeleteMiddleware(attachment.fileName);
        }
      }
    }
    await ForumReply.deleteMany({ topicId: req.params.id });
    
    // Delete the topic
    await ForumTopic.findByIdAndDelete(req.params.id);
    
    res.status(200).json({ status: 200, message: 'Topic deleted successfully' });
  } catch (error) {
    console.error('Error deleting topic:', error);
    res.status(500).json({ status: 500, error: 'Server error' });
  }
});

// Get replies for a topic
router.get('/replies', async (req, res) => {
  try {
    const realId = decodeId(req.query.topicId);

   // const { topicId } = req.query;
    
    if (!realId) {
      return res.status(400).json({ status: 400, error: 'Topic ID is required' });
    }
    
    const replies = await ForumReply.find({ topicId: realId })
      .sort({ isAnswer: -1, createdAt: 1 });
    
    res.status(200).json({ status: 200, replies: replies});

  } catch (error) {
    console.error('Error fetching replies:', error);
    res.status(500).json({ status: 500, error: 'Server error' });
  }
});



// Soft delete a reply
router.delete('/replies/:id', authenticate, async (req, res) => {
  try {
    const {id} = req.params;
    const reply = await ForumReply.findById(req.params.id);
    
    if (!reply) {
      return res.status(404).json({ status: 404, error: 'Reply not found' });
    }
    
    // Check if user is the owner of the reply
    if (reply.userId.toString() !== req.userId.toString()) {
      return res.status(403).json({ status: 403, error: 'Not authorized to delete this reply' });
    }

    // Recursively soft delete all child replies
    const softDeleteChildReplies = async (parentId) => {
      const children = await ForumReply.find({ parentReplyId: parentId });
      for (const child of children) {
        // Soft delete the child reply
        await ForumReply.findByIdAndUpdate(child._id, {
          $set: {
            userId: null,
            userName: 'deleted'
          }
        });
        // Recursively soft delete children of this child
        await softDeleteChildReplies(child._id);
      }
    };

    // Soft delete all child replies first
    await softDeleteChildReplies(id);
    
    // Soft delete the main reply
    await ForumReply.findByIdAndUpdate(id, {
      $set: {
        userId: null,
        userName: 'deleted'
      }
    });

    // Decrement reply count on the topic
    const topic = await ForumTopic.findById(reply.topicId);
    if (topic) {
      topic.replyCount = Math.max(0, topic.replyCount - 1);
      await topic.save();
    }
    
    res.status(200).json({ status: 200, message: 'Reply and its children deleted successfully' });
  } catch (error) {
    console.error('Error deleting reply:', error);
    res.status(500).json({ status: 500, error: 'Server error' });
  }
});

// Like/unlike a topic
router.post('/topics/:id/like', authenticate, async (req, res) => {
  try {
    const topic = await ForumTopic.findById(req.params.id);
    
    if (!topic) {
      return res.status(404).json({ status: 404, error: 'Topic not found' });
    }
    
    const userId = req.userId;
    
    // Check if user already liked this topic
    const alreadyLiked = topic.likes.includes(userId);
    // Check if user already disliked this topic
    const alreadyDisliked = topic.dislikes.includes(userId);

    // If already liked, remove the like (toggle)
    if (alreadyLiked) {
      await ForumTopic.updateOne(
        { _id: req.params.id },
        { $pull: { likes: userId } }
      );
      res.status(200).json({
        status: 200,
        message: "Like removed successfully",
        liked: false
      });
    } 
    // If not liked, add like and remove dislike if exists
    else {
      let updateOperation = { $addToSet: { likes: userId } };
      
      // If already disliked, remove the dislike
      if (alreadyDisliked) {
        updateOperation.$pull = { dislikes: userId };
      }
      
      await ForumTopic.updateOne(
        { _id: req.params.id },
        updateOperation
      );
      notifiyUser({
          parentId: topic?.userId,
          userId,
          topicId : topic?._id,
          desc: "",
          type: "forum",
          action: "like"
        });    
      res.status(200).json({
        status: 200,
        message: "Topic liked successfully",
        liked: true
      });
    }
  } catch (error) {
    console.error('Error liking/unliking topic:', error);
    res.status(500).json({ status: 500, error: 'Server error' });
  }
});

// Dislike/undislike a topic
router.post('/topics/:id/dislike', authenticate, async (req, res) => {
  try {
    const topic = await ForumTopic.findById(req.params.id);
    
    if (!topic) {
      return res.status(404).json({ status: 404, error: 'Topic not found' });
    }
    
    const userId = req.userId;
    
    // Check if user already disliked this topic
    const alreadyDisliked = topic.dislikes.includes(userId);
    // Check if user already liked this topic
    const alreadyLiked = topic.likes.includes(userId);

    // If already disliked, remove the dislike (toggle)
    if (alreadyDisliked) {
      await ForumTopic.updateOne(
        { _id: req.params.id },
        { $pull: { dislikes: userId } }
      );
      res.status(200).json({
        status: 200,
        message: "Dislike removed successfully",
        disliked: false
      });
    } 
    // If not disliked, add dislike and remove like if exists
    else {
      let updateOperation = { $addToSet: { dislikes: userId } };
      
      // If already liked, remove the like
      if (alreadyLiked) {
        updateOperation.$pull = { likes: userId };
      }
      
      await ForumTopic.updateOne(
        { _id: req.params.id },
        updateOperation
      );
      res.status(200).json({
        status: 200,
        message: "Topic disliked successfully",
        disliked: true
      });
    }
  } catch (error) {
    console.error('Error disliking/undisliking topic:', error);
    res.status(500).json({ status: 500, error: 'Server error' });
  }
});

// Like/unlike a reply
router.post('/replies/:id/like', authenticate, async (req, res) => {
  try {
    const reply = await ForumReply.findById(req.params.id);
    
    if (!reply) {
      return res.status(404).json({
        status: 404,
        error: "Reply not found"
      });
    }
    
    const userId = req.userId;
    
    // Check if user already liked this reply
    const alreadyLiked = reply.likes.includes(userId);
    // Check if user already disliked this reply
    const alreadyDisliked = reply.dislikes.includes(userId);

    // If already liked, remove the like (toggle)
    if (alreadyLiked) {
      await ForumReply.updateOne(
        { _id: req.params.id },
        { $pull: { likes: userId } }
      );
      res.status(200).json({
        status: 200,
        message: "Like removed successfully",
        liked: false
      });
    } 
    // If not liked, add like and remove dislike if exists
    else {
      let updateOperation = { $addToSet: { likes: userId } };
      
      // If already disliked, remove the dislike
      if (alreadyDisliked) {
        updateOperation.$pull = { dislikes: userId };
      }
      
      await ForumReply.updateOne(
        { _id: req.params.id },
        updateOperation
      );
      notifiyUser({
        parentId: reply?.userId,
        userId,
        topicId: reply?.topicId,
        commentId: reply?._id,
        desc: reply?.content[0]?.userText,
        type: "forum",
        action: "like"
      }); 
      res.status(200).json({
        status: 200,
        message: "Reply liked successfully",
        liked: true
      });
    }
  } catch (error) {
    console.error('Error liking/unliking reply:', error);
    res.status(500).json({ status: 500, error: 'Server error' });
  }
});

// Dislike/undislike a reply
router.post('/replies/:id/dislike', authenticate, async (req, res) => {
  try {
    const reply = await ForumReply.findById(req.params.id);
    
    if (!reply) {
      return res.status(404).json({
        status: 404,
        error: "Reply not found"
      });
    }
    
    const userId = req.userId;
    
    // Check if user already disliked this reply
    const alreadyDisliked = reply.dislikes.includes(userId);
    // Check if user already liked this reply
    const alreadyLiked = reply.likes.includes(userId);

    // If already disliked, remove the dislike (toggle)
    if (alreadyDisliked) {
      await ForumReply.updateOne(
        { _id: req.params.id },
        { $pull: { dislikes: userId } }
      );
      res.status(200).json({
        status: 200,
        message: "Dislike removed successfully",
        disliked: false
      });
    } 
    // If not disliked, add dislike and remove like if exists
    else {
      let updateOperation = { $addToSet: { dislikes: userId } };
      
      // If already liked, remove the like
      if (alreadyLiked) {
        updateOperation.$pull = { likes: userId };
      }
      
      await ForumReply.updateOne(
        { _id: req.params.id },
        updateOperation
      );
      res.status(200).json({
        status: 200,
        message: "Reply disliked successfully",
        disliked: true
      });
    }
  } catch (error) {
    console.error('Error disliking/undisliking reply:', error);
    res.status(500).json({ status: 500, error: 'Server error' });
  }
});



//pagination withh reply id
router.get('/paginated', async(req, res) => {
    try {
      const parentId = req.query.parentId;
      const topicId = req.query.topicId;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 5;
      const skip = (page - 1) * limit;

      if(!parentId && !topicId){
        return res.status(400).json({
          success: false,
          message: 'Either parentId or topicId is required'
        });
      }

      let query = {};

      if(topicId) {
        query.topicId = topicId;
      } else if(parentId) {
        query.parentReplyId = parentId;
      }

      const immediateChildren = await ForumReply.find(query)
        .sort({createdAt: -1})
        .skip(skip)
        .limit(limit);

      const repliesWithChildren = immediateChildren.map(doc => doc.toObject());

      for (const reply of repliesWithChildren){
        const childReply = await ForumReply.findOne({
          parentReplyId: reply._id
        })
        .sort({ createdAt: -1})
        .lean();

        reply.sampleChild = childReply || null;
      }
      const totalCount = await ForumReply.countDocuments(query);

      res.json({
        success: true,
        data: repliesWithChildren,
        pagination:{
          currentPage: page,
          totalPages: Math.ceil(totalCount/limit),
          totalItems: totalCount,
          hasNextPage: page*limit < totalCount
        }
      });
    }catch (error){
      console.error('Error fetching paginated replies:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch paginated replies',
        error: error.message
      });
    }
});


router.post('/replies',authenticate,upload.array('media', 5),awsuploadMiddleware,async (req, res) => {
    try {
      const { dynamicId, parentReplyId, userId, userName } = req.body;
      console.log("getting dynamci id",dynamicId);
      const realId = dynamicId;
      console.log("real ID",realId);

      // Parse content as array of content blocks
      const contentArray = JSON.parse(req.body.content);
      // Validate content
      if (!Array.isArray(contentArray) || contentArray.length === 0) {
        return res.status(400).json({
          status: 400,
          error: 'Content must be a non-empty array',
        });
      }

      if (!realId) {
        return res.status(400).json({ status: 400, error: 'Topic ID is required' });
      }

      // Check if topic exists and is not locked
      const topic = await ForumTopic.findById(realId);
      if (!topic) {
        return res.status(404).json({ status: 404, error: 'Topic not found' });
      }

      if (topic.isLocked && req.userRole !== 'admin') {
        return res.status(403).json({ status: 403, error: 'This topic is locked' });
      }

      // Use authenticated user info if available, else from request body
      const actualUserId = req.userId || userId;
      const actualUserName = req.rootuser?.userName || userName;
      if (!actualUserId || !actualUserName) {
        return res.status(400).json({ status: 400, error: 'User information is required' });
      }

      // Collect media attachments from uploaded files
      let allMediaAttachments = [...(req.uploadedFiles || [])];
      console.log("going for imabe blob");
      // Process each content block, extract and upload images from URLs
      const processedContent = [];
      for (const block of contentArray) {
        const { imageBlob,imageUrl, ...rest } = block;
      
        if (imageBlob &&  imageBlob.length > 0) {
            const mediaObj = await uploadImageFromBlob(imageBlob);
            rest.imageUrl = mediaObj ;// rest is also object what ever suitable it also get object so it become nested now update regarding this
        }
        else if (imageUrl && imageUrl.length > 0) {
          const mediaObj = await uploadImageFromUrl(imageUrl);
          rest.imageUrl = mediaObj;
        }

          processedContent.push(rest);
      }

      console.log("coming for image blob");

      // Create and save new reply document
      const newReply = new ForumReply({
        content: processedContent,
          topicId: realId,
        userId: actualUserId,
        userName: actualUserName,
        parentReplyId: parentReplyId || null,
        mediaAttachments: allMediaAttachments,
        likes: [],
        dislikes: [],
        children: [],
      });

      const savedReply = await newReply.save();

      let parentCommentId;
      // If this reply is a child reply, update parent reply's children array
      if (parentReplyId) {
        try {
          const updatedParent = await ForumReply.findByIdAndUpdate(
            parentReplyId,
            { $push: { children: savedReply._id } },
            { new: true }
          );
          parentCommentId = updatedParent;

          if (!updatedParent) {
            console.warn(`Parent reply ID ${parentReplyId} not found`);
          }
        } catch (parentUpdateError) {
          console.error('Error updating parent reply:', parentUpdateError);
        }
      }

      console.log("coming at the end");

      // Increment reply count on the topic
      topic.replyCount += 1;
      await topic.save();
      notifiyUser({
        parentId: parentCommentId?.userId || topic?.userId,
        userId,
        topicId: topic?._id,
        commentId: parentReplyId ? parentReplyId : "",
        desc: parentCommentId?.content[0]?.userText,
        type: "forum",
        action: "comment"
      });    

      res.status(201).json({ status: 201, reply: savedReply });
    } catch (error) {
      console.error('Error creating reply:', error);
      res.status(500).json({
        status: 500,
        error: 'Server error',
        message: error.message,
      });
    }
  }
);




module.exports = router; 
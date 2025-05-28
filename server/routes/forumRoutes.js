const express = require('express');
const router = express.Router();
const ForumTopic = require('../models/forumTopicSchema');
const ForumReply = require('../models/forumReplySchema');
const authenticate = require('../middleware/authenticate');
const { awsuploadMiddleware, awsdeleteMiddleware, generateSignedUrl } = require('../middleware/awsmiddleware');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const AWS = require('aws-sdk');
const { modelSelection } = require('../middleware/LLMmiddleware');
const { deleteForumById } = require('../middleware/DeleteMiddleware');

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
    const topic = await ForumTopic.findById(req.params.id);
    
    if (!topic) {
      return res.status(404).json({ status: 404, error: 'Topic not found' });
    }
    
    // Increment view count
    topic.viewCount += 1;
    await topic.save();

    
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
    const { title, content, tags, userId, userName } = req.body;
    
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
    const { topicId } = req.query;
    
    if (!topicId) {
      return res.status(400).json({ status: 400, error: 'Topic ID is required' });
    }
    
    const replies = await ForumReply.find({ topicId })
      .sort({ isAnswer: -1, createdAt: 1 });
    

    
    res.status(200).json({ status: 200, replies: replies});

  } catch (error) {
    console.error('Error fetching replies:', error);
    res.status(500).json({ status: 500, error: 'Server error' });
  }
});



// Delete a reply
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

    // Recursively delete all child replies
    const deleteChildReplies = async (parentId) => {
      const children = await ForumReply.find({ parentReplyId: parentId });
      for (const child of children) {
        // Delete media attachments for child reply
        if (child.mediaAttachments && child.mediaAttachments.length > 0) {
          for (const attachment of child.mediaAttachments) {
            await awsdeleteMiddleware(attachment.fileName);
          }
        }
        // Recursively delete children of this child
        await deleteChildReplies(child._id);
        // Delete the child reply
        await ForumReply.findByIdAndDelete(child._id);
      }
    };

    // Delete media attachments for the main reply
    if (reply.mediaAttachments && reply.mediaAttachments.length > 0) {
      for (const attachment of reply.mediaAttachments) {
        await awsdeleteMiddleware(attachment.fileName);
      }
    }

    // Delete all child replies first
    await deleteChildReplies(id);
    
    // Delete the main reply
    await ForumReply.findByIdAndDelete(id);

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


router.post('/replies', authenticate, upload.array('media', 5), awsuploadMiddleware, modelSelection, async (req, res) => {
  try {
    const { content, topicId, parentReplyId, userId, userName } = req.body;
    console.log('Request body content:', req.body.content);
    
    // Validate content object
    if (!content || typeof content !== 'object') {
      return res.status(400).json({ 
        status: 400, 
        error: 'Content object is required' 
      });
    }
    
    // Check if at least one content field is provided
    const hasUserText = content.userText && content.userText.trim();
    const hasPromptText = content.promptText && content.promptText.trim();
    const hasAiText = content.aiText && content.aiText.trim();
    
    if (!hasUserText && !hasPromptText && !hasAiText) {
      return res.status(400).json({ 
        status: 400, 
        error: 'At least one content field (userText, promptText, or aiText) must be provided' 
      });
    }
    //console.log('Request body content:', req.body.content);
    if (!topicId) {
      return res.status(400).json({ status: 400, error: 'Topic ID is required' });
    }
    
    // Check if topic exists and is not locked
    const topic = await ForumTopic.findById(topicId);
    
    if (!topic) {
      return res.status(404).json({ status: 404, error: 'Topic not found' });
    }
    
    if (topic.isLocked && req.userRole !== 'admin') {
      return res.status(403).json({ status: 403, error: 'This topic is locked' });
    }
    
    // Use the authenticated user ID from the request if available
    const actualUserId = req.userId || userId;
    const actualUserName = req.rootuser?.userName || userName;
    
    if (!actualUserId || !actualUserName) {
      return res.status(400).json({ status: 400, error: 'User information is required' });
    }

    // Handle media attachments
    let mediaAttachments = [];
    
    // Process uploaded files
    if (req.uploadedFiles && req.uploadedFiles.length > 0) {
      mediaAttachments = [...req.uploadedFiles];
    }
    
    // Process S3 URLs if any
    if (req.body.mediaUrls) {
      const mediaUrls = Array.isArray(req.body.mediaUrls) ? req.body.mediaUrls : [req.body.mediaUrls];
      mediaAttachments = [
        ...mediaAttachments,
        ...mediaUrls.map(url => ({
          fileName: url.split('/').pop(),
          fileType: 'image/jpeg', // Default to image/jpeg for S3 URLs
          fileUrl: url,
          fileSize: 0, // Size not available for S3 URLs
          uploadedAt: new Date()
        }))
      ];
    }
    
    // Process content object
    const processedContent = {
      userText: content.userText ? content.userText.trim() : '',
      promptText: content.promptText ? content.promptText.trim() : '',
      aiText: content.aiText ? content.aiText.trim() : '',
      userTimestamp: content.userTimestamp || (content.userText ? new Date() : null),
      promptTimestamp: content.promptTimestamp || (content.promptText ? new Date() : null),
      aiTimestamp: content.aiTimestamp || (content.aiText ? new Date() : null)
    };
    
    console.log("Processed content object:", processedContent);
    
    // Create new reply
    const newReply = new ForumReply({
      content: processedContent,
      topicId,
      userId: actualUserId,
      userName: actualUserName,
      parentReplyId: parentReplyId || null,
      mediaAttachments,
      likes: [],
      dislikes: [],
      children: []
    });
    
    const savedReply = await newReply.save();
    
    if (parentReplyId) {
      try {
        const updatedParent = await ForumReply.findByIdAndUpdate(
          parentReplyId,
          { $push: { children: savedReply._id } },
          { new: true }
        );

        if (!updatedParent) {
          console.warn(`Parent reply ID ${parentReplyId} not found`);
        } else {
          console.log(`Successfully added reply ${savedReply._id} to parent ${parentReplyId}`);
        }
      } catch (parentUpdateError) {
        console.log(`Error updating parent reply:`, parentUpdateError);
      }
    }

    // Increment reply count on the topic
    topic.replyCount += 1;
    await topic.save();
    
    res.status(201).json({ status: 201, reply: savedReply });
  } catch (error) {
    console.error('Error creating reply:', error);
    res.status(500).json({ 
      status: 500, 
      error: 'Server error',
      message: error.message 
    });
  }
});




module.exports = router; 
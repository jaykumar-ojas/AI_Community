const express = require('express');
const router = express.Router();
const Comment = require('../models/commentsModel');
const postdb = require('../models/postSchema');
const multer = require('multer');
const authenticate = require('../middleware/authenticate');
const {deleteCommentById} = require("../middleware/DeleteMiddleware");

// Setup multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: multer.memoryStorage() });

// Import AWS middleware for file uploads
const { awsuploadMiddleware, generateSignedUrl, awsdeleteMiddleware } = require('../middleware/awsmiddleware');

//  get all comments related to topic
router.get('/comments/replies', async (req, res) => {
  try {
    const { postId } = req.query;
    console.log("this is my postId", postId);
    if (!postId) {
      return res.status(400).json({ status: 400, error: 'Topic ID is required' });
    }
    console.log("i m coming here to get reply");
    
    const replies = await Comment.find({ postId })
      .sort({createdAt: 1 });

    console.log("this is my replies array",replies);
    

    // Process media attachments to generate signed URLs
    
    res.status(200).json({ status: 200, comments: replies });

  } catch (error) {
    console.error('Error fetching replies:', error);
    res.status(500).json({ status: 500, error: 'Server error' });
  }
});

// comment a new post
router.post('/comments/post',upload.array('media',5),awsuploadMiddleware,async(req,res)=>{
    try{
        const {content,postId,parentReplyId,userId,userName} = req.body;
        

        if(!content || !postId){
           return res.status(400).json({ status: 400, error: 'Content and post ID are required' });  
        }
        
        const post = await postdb.findById(postId);

        if(!post){
            return res.status(404).json({status: 404, error : "post is not found"});
        }

        const actualUserId = userId;
        const actualUserName = userName;

        if(!actualUserId || !actualUserName){
            return res.status(400).json({status:400, error : "user not found"});
        }

        let mediaAttachments = [];

        if(req.uploadedFiles && req.uploadedFiles.length>0){
            mediaAttachments = [...req.uploadedFiles];
        }

        if(req.body.mediaUrls){
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

        const newComment = new Comment({
            content,
            postId,
            userId: actualUserId,
            userName: actualUserName,
            parentReplyId: parentReplyId || null,
            mediaAttachments,
            likes:[],
            dislikes:[],
            children:[]
        })

        const savedReply = await newComment.save();
        console.log(savedReply);
        if(parentReplyId){
            try{
                const parentComment = await Comment.findByIdAndUpdate(
                    parentReplyId,
                    { $push: {children: savedReply._id}},
                    {new : true}
                );
                if(!updatedParent) {
                    console.warn(`Parent reply Id ${parentReplyId} not found`);
                }else{
                    console.log(`succesecfully added reply ${savedReply._id} to parent ${parentReplyId}`);
                }

            }
            catch(parentUpdateError){
                console.log(`Eror updating parent reply: `, parentUpdateError);
            }
        }
            res.status(201).json({ status: 201, reply: savedReply });
  
            
    }
    catch(error){
        console.error('Error creating reply:', error);
        res.status(500).json({ 
        status: 500, 
        error: 'Server error',
        message: error.message 
        });
    }
});

// delete a reply on post
router.delete('/comments/:id', authenticate, async (req, res) => {
  try {
    const {id} = req.params;
    console.log("i m pringting ",id);
    const reply = await Comment.findById(id);
    
    if (!reply) {
      return res.status(404).json({ status: 404, error: 'Reply not found' });
    }
    
    // Check if user is the owner of the reply
    if (reply.userId.toString() !== req.userId.toString()) {
      return res.status(403).json({ status: 403, error: 'Not authorized to delete this reply' });
    }

    // Delete media attachments from S3
    await deleteCommentById(id);
    
    
    console.log("delete succefully comment associated with id");
    res.status(200).json({ status: 200, message: 'Reply deleted successfully' });
  } catch (error) {
    console.error('Error deleting reply:', error);
    res.status(500).json({ status: 500, error: 'Server error' });
  }
});




// like dislike the comment reply
router.post('/comments/:id/like', authenticate, async (req, res) => {
  try {
    const reply = await Comment.findById(req.params.id);
    
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
      await Comment.updateOne(
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
      
      await Comment.updateOne(
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




// Dislike/undislike a comment reply
router.post('/comments/:id/dislike', authenticate, async (req, res) => {
  try {
    const reply = await Comment.findById(req.params.id);
    
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
      await Comment.updateOne(
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
      
      await Comment.updateOne(
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



module.exports = router;
const express = require("express");
const router = express.Router();
const Comment = require("../models/commentsModel");
const postdb = require("../models/postSchema");
const multer = require("multer");
const authenticate = require("../middleware/authenticate");
const { deleteCommentById } = require("../middleware/DeleteMiddleware");

// Setup multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: multer.memoryStorage(),   // keep files in memory buffer
  limits: {
    fileSize: 50 * 1024 * 1024,   // 50 MB max per file
    fieldSize: 100 * 1024 * 1024, // 100 MB max per text field (for base64 strings in req.body)
    fields: 20,                   // max number of non-file fields
    files: 10,                    // max number of files
  }
});
// Import AWS middleware for file uploads
const {
  awsuploadMiddleware,
  generateSignedUrl,
  awsdeleteMiddleware,
  uploadImageFromUrl,
  uploadImageFromBlob,
} = require("../middleware/awsmiddleware");
const notifiyUser = require("../middleware/notification");

//  get all comments related to topic
router.get("/comments/replies", async (req, res) => {
  try {
    const { postId } = req.query;
    if (!postId) {
      return res
        .status(400)
        .json({ status: 400, error: "Topic ID is required" });
    }

    const replies = await Comment.find({ postId }).sort({ createdAt: 1 });

    res.status(200).json({ status: 200, comments: replies });
  } catch (error) {
    console.error("Error fetching replies:", error);
    res.status(500).json({ status: 500, error: "Server error" });
  }
});

router.post("/comments/post",authenticate,upload.array("media", 5),awsuploadMiddleware,async (req, res) => {
    try {
      const { postId, parentReplyId, userId, userName } = req.body;
      const contentArray = JSON.parse(req.body.content);

      console.log("i m coming here1");

      // Validate content
      if (!Array.isArray(contentArray) || contentArray.length === 0) {
        return res.status(400).json({status: 400,error: "Content must be a non-empty array"});
      }

      if (!postId) {
        return res.status(400).json({ status: 400, error: "Post ID is required" });
      }

      // Check if post exists
      const post = await postdb.findById(postId);
      if (!post) {
        return res.status(404).json({ status: 404, error: "Post not found" });
      }

      // Use authenticated user info if available, else from request body
      const actualUserId = req.userId || userId;
      const actualUserName = req.rootuser?.userName || userName;

      if (!actualUserId || !actualUserName) {
        return res.status(400).json({ status: 400, error: "User information is required" });
      }

      // Collect media attachments from uploaded files
      let allMediaAttachments = [...(req.uploadedFiles || [])];

      // Process each content block, extract and upload images from URLs
      const processedContent = [];
      for (const block of contentArray) {
        const { imageUrl, imageBlob, ...rest } = block;

        if (imageBlob && imageBlob.length > 0) {
          console.log("i m coming here to upload");
          const mediaObj = await uploadImageFromBlob(imageBlob);
          rest.imageUrl = mediaObj; // rest is also object what ever suitable it also get object so it become nested now update regarding this
        } else if (imageUrl && imageUrl.length > 0) {
          const mediaObj = await uploadImageFromUrl(imageUrl);
          rest.imageUrl = mediaObj;
        }

        processedContent.push(rest);
      }

      // Create and save new comment document
      const newComment = new Comment({
        content: processedContent,
        postId,
        userId: actualUserId,
        userName: actualUserName,
        parentReplyId: parentReplyId || null,
        mediaAttachments: allMediaAttachments,
        likes: [],
        dislikes: [],
        children: [],
      });

      const savedReply = await newComment.save();

      let parentCommentId;
      // If this comment is a child reply, update parent comment's children array
      if (parentReplyId) {
        try {
          const updatedParent = await Comment.findByIdAndUpdate(parentReplyId,{ $push: { children: savedReply._id } },{ new: true });
          parentCommentId = updatedParent;

          if (!updatedParent) {
            console.warn(`Parent comment ID ${parentReplyId} not found`);
          } 
        } catch (parentUpdateError) {
          console.error("Error updating parent comment:", parentUpdateError);
        }
      }

      // Increment comment count on the post (if your post schema has commentCount field)
      // Uncomment and modify if needed:
      // post.commentCount = (post.commentCount || 0) + 1;
      // await post.save();

      // Send notification
      notifiyUser({
        parentId: parentCommentId?.userId || post?.userId,
        userId: actualUserId,
        postId: postId,
        commentId: parentReplyId ? parentReplyId : "",
        desc: parentCommentId?.content[0]?.userText,
        type: "comment",
        action: "comment",
      });

      res.status(201).json({ status: 201, reply: savedReply });
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({status: 500,error: "Server error",message: error.message,});
    }
  }
);

// delete a reply on post
router.delete("/comments/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const reply = await Comment.findById(id);

    if (!reply) {
      return res.status(404).json({ status: 404, error: "Reply not found" });
    }

    // Check if user is the owner of the reply
    if (reply.userId.toString() !== req.userId.toString()) {
      return res
        .status(403)
        .json({ status: 403, error: "Not authorized to delete this reply" });
    }

    // Delete media attachments from S3
    await deleteCommentById(id);

    res
      .status(200)
      .json({ status: 200, message: "Reply deleted successfully" });
  } catch (error) {
    console.error("Error deleting reply:", error);
    res.status(500).json({ status: 500, error: "Server error" });
  }
});

// like dislike the comment reply
router.post("/comments/:id/like", authenticate, async (req, res) => {
  try {
    const commentId = req.params.id;
    const reply = await Comment.findById(req.params.id);

    if (!reply) {
      return res.status(404).json({
        status: 404,
        error: "Reply not found",
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
        liked: false,
      });
    }
    // If not liked, add like and remove dislike if exists
    else {
      let updateOperation = { $addToSet: { likes: userId } };

      // If already disliked, remove the dislike
      if (alreadyDisliked) {
        updateOperation.$pull = { dislikes: userId };
      }

      await Comment.updateOne({ _id: req.params.id }, updateOperation);
      res.status(200).json({
        status: 200,
        message: "Reply liked successfully",
        liked: true,
      });
      if (!alreadyLiked) {
        notifiyUser({
          parentId: reply?.userId,
          userId,
          postId: reply?.postId,
          commentId,
          desc: reply?.content[0]?.userText,
          type: "comment",
          action: "like",
        });
      }
    }
  } catch (error) {
    console.error("Error liking/unliking reply:", error);
    res.status(500).json({ status: 500, error: "Server error" });
  }
});

// Dislike/undislike a comment reply
router.post("/comments/:id/dislike", authenticate, async (req, res) => {
  try {
    const reply = await Comment.findById(req.params.id);

    if (!reply) {
      return res.status(404).json({
        status: 404,
        error: "Reply not found",
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
        disliked: false,
      });
    }
    // If not disliked, add dislike and remove like if exists
    else {
      let updateOperation = { $addToSet: { dislikes: userId } };

      // If already liked, remove the like
      if (alreadyLiked) {
        updateOperation.$pull = { likes: userId };
      }

      await Comment.updateOne({ _id: req.params.id }, updateOperation);
      res.status(200).json({
        status: 200,
        message: "Reply disliked successfully",
        disliked: true,
      });
    }
  } catch (error) {
    console.error("Error disliking/undisliking reply:", error);
    res.status(500).json({ status: 500, error: "Server error" });
  }
});

module.exports = router;

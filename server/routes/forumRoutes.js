const express = require('express');
const router = express.Router();
const ForumTopic = require('../models/forumTopicSchema');
const ForumReply = require('../models/forumReplySchema');
const authenticate = require('../middleware/authenticate');

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
    
    // Get total count for pagination
    const totalTopics = await ForumTopic.countDocuments(query);
    
    res.status(200).json({
      status: 200,
      topics,
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
    
    res.status(200).json({ status: 200, topic });
  } catch (error) {
    console.error('Error fetching topic:', error);
    res.status(500).json({ status: 500, error: 'Server error' });
  }
});

// Create a new topic
router.post('/topics', authenticate, async (req, res) => {
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
    
    const newTopic = new ForumTopic({
      title,
      content,
      userId: actualUserId,
      userName: actualUserName,
      tags: tags || [],
      likes: [],
      dislikes: []
    });
    
    const savedTopic = await newTopic.save();
    
    res.status(201).json({ status: 201, topic: savedTopic });
  } catch (error) {
    console.error('Error creating topic:', error);
    res.status(500).json({ status: 500, error: 'Server error' });
  }
});

// Update a topic
router.put('/topics/:id', authenticate, async (req, res) => {
  try {
    const { title, content, tags, isPinned, isLocked } = req.body;
    const topic = await ForumTopic.findById(req.params.id);
    
    if (!topic) {
      return res.status(404).json({ status: 404, error: 'Topic not found' });
    }
    
    // Check if user is the owner of the topic
    if (topic.userId.toString() !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({ status: 403, error: 'Not authorized to update this topic' });
    }
    
    // Update fields
    if (title) topic.title = title;
    if (content) topic.content = content;
    if (tags) topic.tags = tags;
    
    // Admin-only fields
    if (req.userRole === 'admin') {
      if (typeof isPinned !== 'undefined') topic.isPinned = isPinned;
      if (typeof isLocked !== 'undefined') topic.isLocked = isLocked;
    }
    
    const updatedTopic = await topic.save();
    
    res.status(200).json({ status: 200, topic: updatedTopic });
  } catch (error) {
    console.error('Error updating topic:', error);
    res.status(500).json({ status: 500, error: 'Server error' });
  }
});

// Delete a topic
router.delete('/topics/:id', authenticate ,  async (req, res) => {
  try {
    console.log(req.params.id);
    const topic = await ForumTopic.findById(req.params.id);
    console.log(topic);
    if (!topic) {
      return res.status(404).json({ status: 404, error: 'Topic not found' });
    }
    
    // Check if user is the owner of the topic
    console.log(topic.userId);
    console.log(req.userId);
    if (topic.userId.toString() !== req.userId.toString() ) {
      console.log("Not authorized to delete this topic");
      return res.status(403).json({ status: 403, error: 'Not authorized to delete this topic' });
    }
    console.log("---------------------------");
    // Delete all replies to this topic
   // await ForumReply.deleteMany({ topicId: req.params.id });
    
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
    
    res.status(200).json({ status: 200, replies });
  } catch (error) {
    console.error('Error fetching replies:', error);
    res.status(500).json({ status: 500, error: 'Server error' });
  }
});

// Create a new reply
router.post('/replies', authenticate, async (req, res) => {
  try {
    const { content, topicId, parentReplyId, userId, userName } = req.body;
    
    if (!content || !topicId) {
      return res.status(400).json({ status: 400, error: 'Content and topic ID are required' });
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
    
    // Create new reply
    const newReply = new ForumReply({
      content,
      topicId,
      userId: actualUserId,
      userName: actualUserName,
      parentReplyId: parentReplyId || null,
      likes: [],
      dislikes: []
    });
    
    const savedReply = await newReply.save();
    
    // Increment reply count on the topic
    topic.replyCount += 1;
    await topic.save();
    
    res.status(201).json({ status: 201, reply: savedReply });
  } catch (error) {
    console.error('Error creating reply:', error);
    res.status(500).json({ status: 500, error: 'Server error' });
  }
});

// Update a reply
router.put('/replies/:id', authenticate, async (req, res) => {
  try {
    const { content, isAnswer } = req.body;
    const reply = await ForumReply.findById(req.params.id);
    
    if (!reply) {
      return res.status(404).json({ status: 404, error: 'Reply not found' });
    }
    
    // Check if user is the owner of the reply
    if (reply.userId.toString() !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({ status: 403, error: 'Not authorized to update this reply' });
    }
    
    // Update fields
    if (content) reply.content = content;
    
    // Admin or topic owner can mark as answer
    if (typeof isAnswer !== 'undefined') {
      const topic = await ForumTopic.findById(reply.topicId);
      if (topic && (req.userRole === 'admin' || topic.userId.toString() === req.userId)) {
        reply.isAnswer = isAnswer;
      }
    }
    
    const updatedReply = await reply.save();
    
    res.status(200).json({ status: 200, reply: updatedReply });
  } catch (error) {
    console.error('Error updating reply:', error);
    res.status(500).json({ status: 500, error: 'Server error' });
  }
});

// Delete a reply
router.delete('/replies/:id', authenticate, async (req, res) => {
  try {
    const reply = await ForumReply.findById(req.params.id);
    
    if (!reply) {
      return res.status(404).json({ status: 404, error: 'Reply not found' });
    }
    
    // Check if user is the owner of the reply
    console.log(reply.userId);
    console.log(req.userId);
    if (reply.userId.toString() !== req.userId.toString()) {
      return res.status(403).json({ status: 403, error: 'Not authorized to delete this reply' });
    }
    console.log("---------------------------");
    // Delete the reply
    await ForumReply.findByIdAndDelete(req.params.id);
    
    // Decrement reply count on the topic
    const topic = await ForumTopic.findById(reply.topicId);
    if (topic) {
      topic.replyCount = Math.max(0, topic.replyCount - 1);
      await topic.save();
    }
    
    res.status(200).json({ status: 200, message: 'Reply deleted successfully' });
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

module.exports = router; 
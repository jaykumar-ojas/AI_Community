const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const authenticate = require('../middleware/authenticate');
const { upload, processUpload } = require('../middleware/fileUpload');
const path = require('path');
const fs = require('fs');

// Message Schema
const messageSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    trim: true
  },
  topicId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'ForumTopic'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'users'
  },
  userName: {
    type: String,
    required: true
  },
  parentMessageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ForumMessage',
    default: null
  },
  mediaAttachments: [{
    fileName: String,
    fileType: String,
    fileUrl: String,
    fileSize: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, { timestamps: true });

const ForumMessage = mongoose.model('ForumMessage', messageSchema);

// Get messages for a topic
router.get('/', async (req, res) => {
  try {
    const { topicId } = req.query;
    
    if (!topicId) {
      return res.status(400).json({ status: 400, error: 'Topic ID is required' });
    }
    
    const messages = await ForumMessage.find({ topicId })
      .sort({ createdAt: 1 });
    
    res.status(200).json({ status: 200, messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ status: 500, error: 'Server error' });
  }
});

// Create a new message
router.post('/', authenticate, upload.array('media', 5), processUpload, async (req, res) => {
  try {
    const { content, topicId, parentMessageId } = req.body;
    
    if (!content || !topicId) {
      return res.status(400).json({ status: 400, error: 'Content and topic ID are required' });
    }
    
    // Check if topic exists
    const topic = await mongoose.model('ForumTopic').findById(topicId);
    
    if (!topic) {
      return res.status(404).json({ status: 404, error: 'Topic not found' });
    }

    // Create new message
    const newMessage = new ForumMessage({
      content,
      topicId,
      userId: req.userId,
      userName: req.rootuser.userName,
      parentMessageId: parentMessageId || null,
      mediaAttachments: req.uploadedFiles || []
    });
    
    const savedMessage = await newMessage.save();
    
    res.status(201).json({ status: 201, message: savedMessage });
  } catch (error) {
    console.error('Error creating message:', error);
    res.status(500).json({ status: 500, error: 'Server error' });
  }
});

// Delete a message
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const message = await ForumMessage.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({ status: 404, error: 'Message not found' });
    }
    
    // Check if user is the owner of the message
    if (message.userId.toString() !== req.userId.toString()) {
      return res.status(403).json({ status: 403, error: 'Not authorized to delete this message' });
    }

    // Delete associated files
    if (message.mediaAttachments && message.mediaAttachments.length > 0) {
      message.mediaAttachments.forEach(file => {
        const filePath = path.join(__dirname, '..', file.fileUrl);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }
    
    // Delete the message
    await ForumMessage.findByIdAndDelete(req.params.id);
    
    res.status(200).json({ status: 200, message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ status: 500, error: 'Server error' });
  }
});

module.exports = router; 
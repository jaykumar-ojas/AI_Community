const mongoose = require('mongoose');

const forumTopicSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true,
    trim: true
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
  viewCount: {
    type: Number,
    default: 0
  },
  replyCount: {
    type: Number,
    default: 0
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  imageUrl: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  mediaAttachments: [{
    fileName: String,
    fileType: String,
    fileUrl: String,
    fileSize: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users'
  }],
  dislikes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users'
  }],
  children: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ForumReply',
  }]
}, { timestamps: true });

// Create a text index for search functionality
forumTopicSchema.index({ title: 'text', content: 'text' });

const ForumTopic = mongoose.model('ForumTopic', forumTopicSchema);

module.exports = ForumTopic; 
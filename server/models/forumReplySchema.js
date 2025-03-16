const mongoose = require('mongoose');

const forumReplySchema = new mongoose.Schema({
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
  isAnswer: {
    type: Boolean,
    default: false
  },
  parentReplyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ForumReply',
    default: null
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users'
  }],
  dislikes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users'
  }]
}, { timestamps: true });

const ForumReply = mongoose.model('ForumReply', forumReplySchema);

module.exports = ForumReply;
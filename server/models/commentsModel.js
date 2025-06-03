var mongoose = require('mongoose');
var commentSchema = mongoose.Schema({
    content: [
      {
        userText: {
          type: String,
          trim: true,
          default: "",
        },
        prompt: {
          type: String,
          trim: true,
          default: "",
        },
        aiText: {
          type: String,
          trim: true,
          default: "",
        },
        imageUrl: {
          fileName: String,
          fileType: String,
          fileUrl: String,
          fileSize: Number,
          uploadedAt: {
            type: Date,
            default: Date.now,
          },
        },
      },
    ],
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref : 'userposts'
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
    parentReplyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PostComments',
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
    }],
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    dislikes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    children: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PostComments',
      }],
}, {timestamps: true});

module.exports = mongoose.model('PostComments', commentSchema);
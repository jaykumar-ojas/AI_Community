const mongoose = require('mongoose');

const WeeklyChallangeSchema = new mongoose.Schema({
    challangeId:{
        type: 'String',
        required: true
    },
    userId:{
        type:'String',
        required:true,
    },
    text:{
        type:'String',
        default : "",
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
    aiModel: {
      type: String,
      trim: true,
    },
    aiProvider: {
      type: String,
      trim: true,
    },
    aiPrompt: {
      type: String,
      trim: true,
    },
    aiGeneratedAt: {
      type: Date,
    },
    videoUrl: {
        fileName: String,
        fileType: String,
        fileUrl: String,
        fileSize: Number,
        uploadedAt: {
        type: Date,
        default: Date.now,
        },
    },
    likes:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "users",
        },
    ],
    completedBy: [
        {
        userId: mongoose.Schema.Types.ObjectId,
        completedAt: Date,
        },
    ],
},
 { timestamps: true }
);

const weeklyChallangeDb = mongoose.model("weeklyChallangeData",WeeklyChallangeSchema);

module.exports =  weeklyChallangeDb;
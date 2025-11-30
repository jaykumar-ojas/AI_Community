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
    ]
},
 { timestamps: true }
);

const weeklyChallangeDb = mongoose.model("weeklyChallangeData",WeeklyChallangeSchema);

module.exports =  weeklyChallangeDb;
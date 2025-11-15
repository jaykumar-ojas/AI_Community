const mongoose = require('mongoose');


const notificationSchema = new mongoose.Schema(
    {
        userId : {type: String, required:true},
        replierId : {type: String,required:true},
        postId : {type:String},
        topicId : {type: String},
        commentId : {type:String},
        desc : {type:String},
        field :{type:String},
        read: { type: Boolean, default: false },
    },
    { timestamps: true }
)


const notificationDb = new mongoose.model("notification",notificationSchema);


module.exports = notificationDb;
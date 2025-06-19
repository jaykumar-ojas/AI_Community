const notificationDb = require('../models/notificationSchema');


// {
//         userId : {type: String, required:true},
//         postId : {type:String,required:true},
//         topicId : {type: String},
//         commentId : {type:String},
//         field :{type:String},
//     },
//     { timestamps: true }

const notifiyUser = async ({parentId, userId, postId = "", commentId = "", topicId = "", desc = "", type, action}) => {
    try {
        if (action === "like") {
            if (type === "forum") {
                desc = `Liked your topic created by you${desc ? '\n' + desc : ''}`;
            } else if (type === "comment") {
                desc = `Liked your comment${desc ? '\n' + desc : ''}`;
            } else if (type === "post") {
                desc = `Liked your post${desc ? '\n' + desc : ''}`;
            }
        } else if (action === "dislike") {
            if (type === "forum") {
                desc = `Disliked your topic created by you${desc ? '\n' + desc : ''}`;
            } else if (type === "comment") {
                desc = `Disliked your comment${desc ? '\n' + desc : ''}`;
            } else if (type === "post") {
                desc = `Disliked your post${desc ? '\n' + desc : ''}`;
            }
        } else if (action === "comment") {
            if (type === "forum") {
                desc = `Commented on your topic${desc ? '\n' + desc : ''}`;
            } else if (type === "comment") {
                desc = `Commented on your reply${desc ? '\n' + desc : ''}`;
            } else if (type === "post") {
                desc = `Commented on your post${desc ? '\n' + desc : ''}`;
            }
        }

        const notificationData = new notificationDb({
            userId: parentId,
            replierId: userId,
            postId,
            topicId,
            commentId,
            desc,
            field: type,
        });

        await notificationData.save();
        console.log("Notification successful");
    } catch (error) {
        console.error("Notification failed:", error);
    }
}

module.exports = notifiyUser;

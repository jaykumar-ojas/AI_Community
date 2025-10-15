const notificationDb = require('../models/notificationSchema');
const { sendReplyNotificationEmail } = require('./emailNotification');


// {
//         userId : {type: String, required:true},
//         postId : {type:String,required:true},
//         topicId : {type: String},
//         commentId : {type:String},
//         field :{type:String},
//     },
//     { timestamps: true }

const notifiyUser = async ({parentId, userId, postId = "", commentId = "", topicId = "", desc = "", type, action, replierUserName = "", replyTypeOverride = ""}) => {
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
                desc = `Commented on topic${desc ? '\n' + desc : ''}`;
            } else if (type === "comment") {
                desc = `Commented on your reply${desc ? '\n' + desc : ''}`;
            } else if (type === "post") {
                desc = `Commented on post${desc ? '\n' + desc : ''}`;
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

        // Send email notification for comment actions
        if (action === "comment" && replierUserName) {
            // Avoid emailing the actor themselves
            if (String(parentId) === String(userId)) {
                return;
            }

            let replyType = replyTypeOverride || "";
            if (!replyType) {
                if (type === "forum") {
                    replyType = topicId ? "topic" : "forum_reply";
                } else if (type === "comment") {
                    replyType = postId ? "post" : "comment";
                } else if (type === "post") {
                    replyType = "post";
                }
            }
            console.log(commentId, "comment id for email");
            // Send email notification asynchronously (don't wait for it)
            sendReplyNotificationEmail({
                recipientUserId: parentId,
                replierUserId: userId,
                replierUserName: replierUserName,
                postId: postId,
                topicId: topicId,
                commentId: commentId,
                replyType: replyType,
                replyContent: desc
            }).catch(emailError => {
                console.error("Email notification failed:", emailError);
            });
        }
    } catch (error) {
        console.error("Notification failed:", error);
    }
}

module.exports = notifiyUser;

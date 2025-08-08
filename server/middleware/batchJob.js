const postDb = require("../models/postSchema");
const forumRepliesDb = require("../models/forumReplySchema");
const forumTopicDb = require("../models/forumTopicSchema");
const commentDb = require("../models/commentsModel");
const {generateSignedUrl} = require('../middleware/awsmiddleware');


const updateUrlFromUserPost = async () => {
    try {
        const postData = await postDb.find();

        if (!postData || postData.length === 0) {
            console.log("No user posts found.");
            return;
        }

        for (const post of postData) {

            //const isOld = isOlderThan6Days(post.imgUrlCreatedAt);
            const isOld = true;
            if (isOld || post.imgUrl==="") {
                const newImgUrl = await generateSignedUrl(post.imgKey); // await needed
                post.imgUrl = newImgUrl; // triggers pre-save hook
                await post.save();
            }
        }

        console.log("Signed URLs updated successfully for post.");
    } catch (error) {
        console.error("Error updating signed URLs for post:", error);
    }
};


const updateUrlFromReplies = async () => {
    try {
        const replyData = await forumRepliesDb.find();

        if (!replyData || replyData.length === 0) {
            console.log("No forum replies found.");
            return;
        }

        for (const reply of replyData) {
            let hasUpdates = false;

            for (const attachment of reply.mediaAttachments) {
               // const isOld = isOlderThan6Days(attachment.uploadedAt);
                const isOld = true;
                if (isOld) {
                    const newSignedUrl = await generateSignedUrl(attachment.fileName); // Assuming fileName is the S3 key
                    attachment.fileUrl = newSignedUrl;
                    attachment.uploadedAt = new Date(); // update the date
                    hasUpdates = true;
                }
            }

            if(Array.isArray(reply.content))
            {
              //  console.log(reply.content);
            for(const content of reply.content){
                const imageUrl = content.imageUrl;
                //const isOld = isOlderThan6Days(imageUrl.uploadedAt);
                const isOld = true
                if(isOld){
                    const newSignedUrl = await generateSignedUrl(content.imageUrl.fileName);
                    content.imageUrl.fileName = newSignedUrl;
                    content.imageUrl.uploadedAt = new Date();
                    hasUpdates = true;
                }
            }
        }
            

            if (hasUpdates) {
                await reply.save();
            }
        }

        

        console.log("Media attachment URLs updated successfully for replies.");
    } catch (error) {
        console.error("Error updating media attachment URLs for replies:", error);
    }
};


const updateUrlFromTopic = async () =>{
    try {
        const topicData = await forumTopicDb.find();

        if (!topicData || topicData.length === 0) {
            console.log("No forum replies found.");
            return;
        }

        for (const topic of topicData) {
            let hasUpdates = false;

            for (const attachment of topic.mediaAttachments) {
                // const isOld = isOlderThan6Days(attachment.uploadedAt);
                const isOld = true;
                if (isOld) {
                    const newSignedUrl = await generateSignedUrl(attachment.fileName); // Assuming fileName is the S3 key
                    attachment.fileUrl = newSignedUrl;
                    attachment.uploadedAt = new Date(); // update the date
                    hasUpdates = true;
                }
            }

            if (hasUpdates) {
                await topic.save();
            }
        }

        console.log("Media attachment URLs updated successfully for topic.");
    } catch (error) {
        console.error("Error updating media attachment URLs for topic:", error);
    }
}

const updateUrlFromComment = async () => {
    try {
        const commentData = await commentDb.find();

        if (!commentData || commentData.length === 0) {
            console.log("No forum replies found.");
            return;
        }

        for (const comment of commentData) {
            let hasUpdates = false;

            for (const attachment of comment.mediaAttachments) {
                // const isOld = isOlderThan6Days(attachment.uploadedAt);
                const isOld = true;
                if (isOld) {
                    const newSignedUrl = await generateSignedUrl(attachment.fileName); // Assuming fileName is the S3 key
                    attachment.fileUrl = newSignedUrl;
                    attachment.uploadedAt = new Date(); // update the date
                    hasUpdates = true;
                }
            }
            if(Array.isArray(comment.content)){
                
            for(const content of comment.content){
                const imageUrl = content.imageUrl;
                const isOld = isOlderThan6Days(content.imageUrl.uploadedAt);
                if(isOld){
                    const newSignedUrl = await generateSignedUrl(content.imageUrl.fileName);
                    content.imageUrl.fileUrl= newSignedUrl;
                    content.imageUrl.uploadedAt = new Date();
                    hasUpdates = true;
                }
            }
        }

            if (hasUpdates) {
                await comment.save();
            }
        }

        console.log("Media attachment URLs updated successfully for Comment.");
    } catch (error) {
        console.error("Error updating media attachment URLs for comment:", error);
    }
};

const isOlderThan6Days = (date) => {
    return true;
    if (!date) return true; // If date is missing, consider it old
    const sixDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
    return new Date(date) < sixDaysAgo;
};

module.exports = {
    updateUrlFromUserPost,
    updateUrlFromReplies,
    updateUrlFromComment,
    updateUrlFromTopic
};








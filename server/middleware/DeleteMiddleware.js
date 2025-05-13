const commentDb = require("../models/commentsModel");
const repliesDb = require("../models/forumReplySchema");

const {awsdeleteMiddleware} = require("./awsmiddleware");



const deleteCommentById = async(commentId) =>{
    try{
        await deleteWithChildById(commentId,commentDb);
    }
    catch(error){
        console.log("error in deleting all the comment");
    }
}

const deleteForumById = async(forumReplyId) =>{
    try{
        await deleteWithChildById(forumReplyId,repliesDb);
    }
    catch(error){
        console.log("error in deleting all the replies");
    }
}


const deleteWithChildById = async(id,modelName) => {
    try{
        const data = await modelName.findOne({"_id":id});

        const allChild = await modelName.find({"parentReplyId":id});

        for( const child of allChild) {
            await deleteWithChildById(child._id,modelName);
        }

        await deleteById(data,modelName);
        return;
    }
    catch(error){
        console.log("error in deleting comment :",error);
    }
}

const deleteById = async(data,modelName) => {
    try{
        if (data.mediaAttachments && data.mediaAttachments.length > 0) {
            for (const attachment of data.mediaAttachments) {
            await awsdeleteMiddleware(attachment.fileName);
            }
        }
          
        await modelName.findByIdAndDelete(data._id);
        console.log("delete succefully");
        console.log(`Comment ${data._id} deleted successfully`);
    }
    catch(error){
        console.log("error in deleting comment system :",error);
    }
}

module.exports = {
    deleteCommentById,
    deleteForumById
}


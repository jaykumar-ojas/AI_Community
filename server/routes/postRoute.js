const express = require("express");
const router = new express.Router();
const mongoose = require("mongoose");
const multer = require('multer');
const postdb = require("../models/postSchema");
const userdb = require("../models/userSchema");
const googledb = require("../models/googleSchema");
const commentdb = require("../models/commentsModel");
const embeddingdb = require("../models/embeding");
const notifiyUser = require("../middleware/notification");
const { awsuploadMiddleware, generateSignedUrl, awsdeleteMiddleware } = require("../middleware/awsmiddleware");
const axios = require('axios');
const { decodeId, encodeId } = require('../utils/hashids');

const storage = multer.memoryStorage();

// Define allowed file types
const fileFilter = (req, file, cb) => {
    // Accept images, videos, and audio files
    if (
        file.mimetype.startsWith('image/') ||
        file.mimetype.startsWith('video/') ||
        file.mimetype.startsWith('audio/')
    ) {
        cb(null, true);
    } else {
        cb(new Error('Unsupported file type. Only images, videos, and audio files are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
    }
});

// for uploading the file from user when login
router.post('/upload', upload.single('file'), awsuploadMiddleware, async (req, res) => {
    try {
        const { userId, desc } = req.body;

        if (!userId) {
            throw new Error("User not logged in");
        }

        if (!req.uploadedFiles || req.uploadedFiles.length === 0) {
            throw new Error("No file uploaded");
        }

        const uploadedFile = req.uploadedFiles[0];

        if (!uploadedFile.fileName) {
            throw new Error("File processing failed - no file name generated");
        }

        const fileType = uploadedFile.fileType.split('/')[0]; // 'image', 'video', or 'audio'

        console.log("Saving post with data:", {
            userId,
            desc,
            imgKey: uploadedFile.fileName,
            fileType
        });

        const finalpost = new postdb({
            userId: userId,
            desc: desc,
            imgKey: uploadedFile.fileName,
            imgUrl: uploadedFile.fileUrl,
            fileType: fileType,
            likes: [],
            dislikes: []
        });

        const storePost = await finalpost.save();

        // Fire and forget - no await
        if (fileType === 'image') {
            axios.post(
                `http://localhost:8000/index/update-single?image_id=${storePost._id}&collection=posts`
            ).then(() => {
                console.log('✅ Embedding generated successfully for post:', storePost._id);
            }).catch((embeddingError) => {
                console.error('❌ Failed to generate embedding for post:', storePost._id, embeddingError.message);
            });
        }
        
        res.status(201).json({ status: 201, storePost });

    } catch (error) {
        console.error("Error in upload route:", error);
        res.status(422).json({
            status: 422,
            error: error.message || "Unknown error"
        });
    }
});

// for uploading AI-generated content
router.post('/upload-ai', upload.single('file'), awsuploadMiddleware, async (req, res) => {
    try {
        const { userId, desc, aiModel, aiProvider, aiPrompt } = req.body;

        if (!userId) {
            throw new Error("User not logged in");
        }

        if (!req.uploadedFiles || req.uploadedFiles.length === 0) {
            throw new Error("No file uploaded");
        }

        const uploadedFile = req.uploadedFiles[0];

        if (!uploadedFile.fileName) {
            throw new Error("File processing failed - no file name generated");
        }

        const fileType = uploadedFile.fileType.split('/')[0]; // 'image', 'video', or 'audio'

        console.log("Saving AI-generated post with data:", {
            userId,
            desc,
            imgKey: uploadedFile.fileName,
            fileType,
            aiModel,
            aiProvider,
            aiPrompt
        });

        const finalpost = new postdb({
            userId: userId,
            desc: desc,
            imgKey: uploadedFile.fileName,
            imgUrl: uploadedFile.fileUrl,
            fileType: fileType,
            // AI Generation Metadata
            isAIGenerated: true,
            aiModel: aiModel,
            aiProvider: aiProvider,
            aiPrompt: aiPrompt,
            aiGeneratedAt: new Date(),
            likes: [],
            dislikes: []
        });

        const storePost = await finalpost.save();
        res.status(201).json({ status: 201, storePost });

    } catch (error) {
        console.error("Error in AI upload route:", error);
        res.status(422).json({
            status: 422,
            error: error.message || "Unknown error"
        });
    }
});


// get all the post of specific users by their user id
router.post('/get', async (req, res) => {
    const { userId } = req.body;
    try {
        if (!userId) {
            throw new Error("user not logged in");
        }
        const realUserId = decodeId(userId);
        if (!realUserId) {
            return res.status(400).json({ status: 400, error: "Invalid user ID" });
        }
        const userposts = await postdb.find({ userId: realUserId });
        const user = await userdb.findById(realUserId) || await googledb.findById(realUserId);
        if (!userposts || userposts.length === 0) {
            return res.status(200).json({ status: 200, userposts: [] });
        }

        res.status(200).json({ status: 200, userposts: userposts, community:user.joined });
    }
    catch (error) {
        console.error("Error retrieving user posts:", error);
        res.status(422).json({ status: 422, error });
    }
})


// delete the image by user
// router.delete('/delete/:id', async (req, res) => {
//     try {
//         const { imgKey } = req.body;
//         const { id } = req.params;

//         // First check if the post exists
//         const post = await postdb.findOne({ _id: id });
//         if (!post) {
//             console.error("Post not found:", id);
//             return res.status(404).json({ status: 404, error: "Post not found" });
//         }

//         // Delete all comments associated with this post
//         const deletedComments = await commentdb.deleteMany({ postId: id });
//         console.log(`Deleted ${deletedComments.deletedCount} comments for post ${id}`);

//         // Delete the file from S3
//         const check = await awsdeleteMiddleware(imgKey);
//         if (check) {
//             // Delete the post from MongoDB
//             const deletedPost = await postdb.findOneAndDelete({ _id: id });

//             return res.status(200).json({
//                 status: 200,
//                 message: "Post and associated comments deleted successfully",
//                 deletedPost: {
//                     _id: deletedPost._id,
//                     fileType: deletedPost.fileType || 'image',
//                     imgKey: deletedPost.imgKey
//                 },
//                 deletedComments: deletedComments.deletedCount
//             });
//         } else {
//             console.error("Failed to delete file from S3:", imgKey);
//             return res.status(500).json({ status: 500, error: "Failed to delete file from storage" });
//         }
//     } catch (error) {
//         console.error("Error in delete route:", error);
//         res.status(500).json({
//             status: 500,
//             error: error.message || "An error occurred while deleting the post"
//         });
//     }
// });

router.delete('/delete/:id', async (req, res) => {
    try {
        const { imgKey } = req.body;
        const { id } = req.params;

        // First check if the post exists
        const post = await postdb.findOne({ _id: id });
        if (!post) {
            console.error("Post not found:", id);
            return res.status(404).json({ status: 404, error: "Post not found" });
        }

        // Delete all comments associated with this post
        const deletedComments = await commentdb.deleteMany({ postId: id });
        console.log(`Deleted ${deletedComments.deletedCount} comments for post ${id}`);

        // Delete image embeddings associated with this post
        const deletedEmbeddings = await embeddingdb.deleteMany({ image_id: id });
        console.log(`Deleted ${deletedEmbeddings.deletedCount} image embeddings for post ${id}`);

        // Delete the file from S3
        const check = await awsdeleteMiddleware(imgKey);
        if (check) {
            // Delete the post from MongoDB
            const deletedPost = await postdb.findOneAndDelete({ _id: id });

            return res.status(200).json({
                status: 200,
                message: "Post, associated comments, and image embeddings deleted successfully",
                deletedPost: {
                    _id: deletedPost._id,
                    fileType: deletedPost.fileType || 'image',
                    imgKey: deletedPost.imgKey
                },
                deletedComments: deletedComments.deletedCount,
                deletedEmbeddings: deletedEmbeddings.deletedCount
            });
        } else {
            console.error("Failed to delete file from S3:", imgKey);
            return res.status(500).json({ status: 500, error: "Failed to delete file from storage" });
        }
    } catch (error) {
        console.error("Error in delete route:", error);
        res.status(500).json({
            status: 500,
            error: error.message || "An error occurred while deleting the post"
        });
    }
});



// getting all the post user login or not
// router.get('/allget', async (req, res) => {
//     try {
//         // Get page and limit from query parameters
//         const page = parseInt(req.query.page) || 1;
//         const limit = parseInt(req.query.limit) || 9;
//         const skip = (page - 1) * limit;
//         console.log("page no for post", page);

//         // Find posts with pagination - only fetch the posts for the requested page
//         const userposts = await postdb.find()
//             .skip(skip)  // Skip the posts from previous pages
//             .limit(limit + 1); // Request one extra item to check if more exist

//         // Check if there are more posts
//         const hasMore = userposts.length > limit;
//         // Remove the extra item if it exists
//         const postsToReturn = hasMore ? userposts.slice(0, limit) : userposts;


//         res.status(200).json({
//             status: 200,
//             userposts: postsToReturn,
//             hasMore, // Just return whether there are more posts
//             page: page // Return the current page for client reference
//         });
//     }
//     catch (error) {
//         console.error("Error retrieving all posts:", error);
//         res.status(422).json({ status: 422, error });
//     }
// });

router.get('/allget', async (req, res) => {
    try {
        // Get page and limit from query parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 9;
        const skip = (page - 1) * limit;
        console.log("page no for post", page);

        // Find posts with pagination - sorted by latest createdAt first
        const userposts = await postdb.find()
            .sort({ createdAt: -1 })  // 🔥 latest first
            .skip(skip)  
            .limit(limit + 1); // Request one extra item to check if more exist

        // Check if there are more posts
        const hasMore = userposts.length > limit;
        const postsToReturn = hasMore ? userposts.slice(0, limit) : userposts;

        res.status(200).json({
            status: 200,
            userposts: postsToReturn,
            hasMore,
            page
        });
    }
    catch (error) {
        console.error("Error retrieving all posts:", error);
        res.status(422).json({ status: 422, error });
    }
});


// getting post from post id 
router.post('/getPostById', async (req, res) => {
    const { postId } = req.body;
    try {
        if (!postId) {
            throw new Error("post didn't exist");
        }
        const post = await postdb.findOne({ _id: postId });
        if (!post) {
            return res.status(404).json({ status: 404, error: "Post not found" });
        }


        res.status(201).json({ status: 201, postdata: post });
    }
    catch (error) {
        console.error("Error retrieving post:", error);
        res.status(422).json({ status: 422, error: error.message });
    }
})

// Like a post
router.post('/:id/like', async (req, res) => {
    const postId = req.params.id;
    const userId = req.body.userId;

    try {
        if (!userId) {
            return res.status(400).json({
                error: "User ID is required"
            });
        }

        const post = await postdb.findById(postId);
        if (!post) {
            return res.status(404).json({
                error: "Post not found"
            });
        }

        // Check if user already liked this post
        const alreadyLiked = post.likes.includes(userId);
        // Check if user already disliked this post
        const alreadyDisliked = post.dislikes.includes(userId);

        // If already liked, remove the like (toggle)
        if (alreadyLiked) {
            await postdb.updateOne(
                { _id: postId },
                { $pull: { likes: userId } }
            );
            res.status(200).json({
                message: "Like removed successfully"
            });
        }
        // If not liked, add like and remove dislike if exists
        else {
            console.log("i m going too like");
            let updateOperation = { $addToSet: { likes: userId } };

            // If already disliked, remove the dislike
            if (alreadyDisliked) {
                updateOperation.$pull = { dislikes: userId };
            }

            await postdb.updateOne(
                { _id: postId },
                updateOperation
            );
                notifiyUser({
                    parentId: postId,
                    userId,
                    postId: postId,
                    desc: "",
                    type: "post",
                    action: "like"
                });
            res.status(200).json({
                message: "Post liked successfully"
            });
        }
    } catch (error) {
        console.error("Error liking post:", error);
        res.status(500).json({
            error: error.message || "An error occurred while liking the post"
        });
    }
});

// Dislike a post
router.post('/:id/dislike', async (req, res) => {
    const postId = req.params.id;
    const userId = req.body.userId;

    try {
        if (!userId) {
            return res.status(400).json({
                error: "User ID is required"
            });
        }

        const post = await postdb.findById(postId);
        if (!post) {
            return res.status(404).json({
                error: "Post not found"
            });
        }

        // Check if user already disliked this post
        const alreadyDisliked = post.dislikes.includes(userId);
        // Check if user already liked this post
        const alreadyLiked = post.likes.includes(userId);

        // If already disliked, remove the dislike (toggle)
        if (alreadyDisliked) {
            await postdb.updateOne(
                { _id: postId },
                { $pull: { dislikes: userId } }
            );
            res.status(200).json({
                message: "Dislike removed successfully"
            });
        }
        // If not disliked, add dislike and remove like if exists
        else {
            let updateOperation = { $addToSet: { dislikes: userId } };

            // If already liked, remove the like
            if (alreadyLiked) {
                updateOperation.$pull = { likes: userId };
            }

            await postdb.updateOne(
                { _id: postId },
                updateOperation
            );
            res.status(200).json({
                message: "Post disliked successfully"
            });
        }
    } catch (error) {
        console.error("Error disliking post:", error);
        res.status(500).json({
            error: error.message || "An error occurred while disliking the post"
        });
    }
});


// router.get("/update-likes", async (req, res) => {
//   try {
//     const docs = await postdb.find({});

//     for (const doc of docs) {
//       // Generate random number between 1 and 100
//       const likeCount = Math.floor(Math.random() * 100) + 1;

//       // Create array of random ObjectIds
//       const likesArray = Array.from({ length: likeCount }, () => new mongoose.Types.ObjectId());

//       await postdb.updateOne(
//         { _id: doc._id },
//         { $set: { likes: likesArray } }
//       );
//     }

//     res.status(200).json({ message: "✅ Random ObjectId likes updated for all documents" });
//   } catch (error) {
//     console.error("❌ Error updating likes:", error);
//     res.status(500).json({ message: "Server error", error });
//   }
// });




module.exports = router;
const express = require("express");
const router = new express.Router();
const multer = require('multer')
const postdb = require("../models/postSchema");
const userdb = require("../models/userSchema");
const googledb = require("../models/googleSchema");

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

const {awsuploadMiddleware,generateSignedUrl,awsdeleteMiddleware} = require("../middleware/awsmiddleware");

// for uploading the file from user when login
router.post('/upload', upload.single('file'), awsuploadMiddleware, async(req, res) => {
   try{
    const {userId,desc}=req.body;
    if(!userId){
        throw new Error("user not login");
    }
    
    console.log("File upload request received:");
    console.log("- File:", req.file ? req.file.originalname : "No file");
    console.log("- MIME type:", req.file ? req.file.mimetype : "No file");
    
    // Get the file type from the mimetype
    const fileType = req.file.mimetype.split('/')[0]; // 'image', 'video', or 'audio'
    console.log("- Extracted file type:", fileType);
    console.log("- File name from middleware:", req.fileName);
    
    const finalpost = new postdb({
        userId: userId,
        desc: desc,
        imgKey: req.fileName,
        fileType: fileType, // Store the file type
        likes: [],
        dislikes: []
    });

    console.log("Saving post with data:", {
        userId,
        desc,
        imgKey: req.fileName,
        fileType
    });

    const storePost = await finalpost.save();
    console.log("Post saved successfully:", storePost);
    res.status(201).json({status:201,storePost});
   }catch(error){
    console.error("Error in upload route:", error);
    res.status(422).json({status:422,error: error.message || "Unknown error"});
   }
});


// get all the post of specific users by their user id
router.post('/get',async(req,res)=>{
    const {userId}= req.body;
    try{
        if(!userId){
            throw new Error("user not logged in");
        }
        const userposts = await postdb.find({userId:userId});
        const userpostsWithUrls = await Promise.all(
            userposts.map(async (post) => {
                console.log(post.imgKey,"this is key");
                if(!post.imgKey){
                    return null;
                }
                
                const signedUrl = await generateSignedUrl(post.imgKey);
                return {
                    ...post.toObject(), 
                    signedUrl,
                    fileType: post.fileType || 'image' // Include fileType, default to 'image' for backward compatibility
                };
            })
        );
        res.status(200).json({ status: 200, userposts:userpostsWithUrls});
    }
    catch(error){
        console.error("Error retrieving user posts:", error);
        res.status(422).json({status:422,error});
    }
})


// delete the image by user
router.delete('/delete/:id',async(req,res)=>{
    try{
        const {imgKey} = req.body;
        const {id} = req.params;
        
        console.log("Delete request received for post:", id, "with imgKey:", imgKey);
        
        // First check if the post exists
        const post = await postdb.findOne({_id: id});
        if (!post) {
            console.error("Post not found:", id);
            return res.status(404).json({status: 404, error: "Post not found"});
        }
        
        console.log("Found post to delete:", post);
        
        // Delete the file from S3
        const check = await awsdeleteMiddleware(imgKey);
        if(check){
            // Delete the post from MongoDB
            const deletedPost = await postdb.findOneAndDelete({_id: id});
            console.log("Post deleted successfully:", deletedPost);
            
            return res.status(200).json({
                status: 200, 
                message: "Post deleted successfully",
                deletedPost: {
                    _id: deletedPost._id,
                    fileType: deletedPost.fileType || 'image',
                    imgKey: deletedPost.imgKey
                }
            });
        } else {
            console.error("Failed to delete file from S3:", imgKey);
            return res.status(500).json({status: 500, error: "Failed to delete file from storage"});
        }
    } catch(error) {
        console.error("Error in delete route:", error);
        res.status(500).json({
            status: 500, 
            error: error.message || "An error occurred while deleting the post"
        });
    }
});

// getting all the post user login or not
router.get('/allget', async(req, res) => {
    console.log("i am coming here for getting data");
    try {
        // Get page and limit from query parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 9;
        const skip = (page - 1) * limit;
        console.log("page:",page,"limit:",limit,"skip:",skip);
        
        // Find posts with pagination - only fetch the posts for the requested page
        const userposts = await postdb.find()
            .skip(skip)  // Skip the posts from previous pages
            .limit(limit + 1); // Request one extra item to check if more exist
            
        // Check if there are more posts
        const hasMore = userposts.length > limit;
        // Remove the extra item if it exists
        const postsToReturn = hasMore ? userposts.slice(0, limit) : userposts;
        
        const userpostsWithUrls = await Promise.all(
            postsToReturn.map(async (post) => {
                console.log("this is my imagKey", post.imgKey); 
                const signedUrl = await generateSignedUrl(post.imgKey);
                const userData = await userdb.findOne({_id: post.userId}) || await googledb.findOne({_id: post.userId});
                const userName = userData.userName;
                const image = userData.image;
                console.log("i am coming to fetch the url");
                return {
                    ...post.toObject(), 
                    signedUrl,
                    userName,
                    image,
                    fileType: post.fileType || 'image'
                };
            })
        );
        
        res.status(200).json({ 
            status: 200, 
            userposts: userpostsWithUrls,
            hasMore, // Just return whether there are more posts
            page: page // Return the current page for client reference
        });
    }
    catch(error) {
        console.error("Error retrieving all posts:", error);
        res.status(422).json({status: 422, error});
    }
});

// getting post from post id 
router.post('/getPostById',async(req,res)=>{
    const {postId}= req.body;
    try{
        if(!postId){
            throw new Error("post didn't exist");
        }
        const post = await postdb.findOne({_id:postId});
        const signedUrl = await generateSignedUrl(post.imgKey);
        const userData = await userdb.findOne({_id:post.userId}) || await googledb.findOne({_id:post.userId});
        const userName = userData.userName;
        const image = userData.image;
        const updatedPost = {
            ...post.toObject(), // Ensure mutability by converting to a plain object
            signedUrl,
            userName,
            image,
            fileType: post.fileType || 'image' // Include fileType, default to 'image' for backward compatibility
          };
          console.log("Post data retrieved successfully:", updatedPost);
        res.status(201).json({status:201,postdata:updatedPost});
    }
    catch(error){
        console.error("Error retrieving post:", error);
        res.status(422).json({status:422,error:error});
    }
})

// Like a post
router.post('/:id/like', async(req, res) => {
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
            let updateOperation = { $addToSet: { likes: userId } };
            
            // If already disliked, remove the dislike
            if (alreadyDisliked) {
                updateOperation.$pull = { dislikes: userId };
            }
            
            await postdb.updateOne(
                { _id: postId },
                updateOperation
            );
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
router.post('/:id/dislike', async(req, res) => {
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

module.exports = router;
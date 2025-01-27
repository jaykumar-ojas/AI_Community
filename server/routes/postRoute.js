const express = require("express");
const router = new express.Router();
const multer = require('multer')
const postdb = require("../models/postSchema");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const {awsuploadMiddleware,generateSignedUrl,awsdeleteMiddleware} = require("../middleware/awsmiddleware");

// for uploading the file from user when login
router.post('/upload', upload.single('file'), awsuploadMiddleware, async(req, res) => {
   try{
    const {userId,desc}=req.body;
    if(!userId){
        throw error("user not login");
    }
    const finalpost = new postdb({
        userId:userId,
        desc:desc,
        imgKey:req.fileName
    });

    const storePost = await finalpost.save();
    res.status(201).json({status:201,storePost});
   }catch(error){
    res.status(422).json({status:422,error});
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
                const signedUrl = await generateSignedUrl(post.imgKey);
                return {
                    ...post.toObject(), 
                    signedUrl,
                };
            })
        );
        res.status(200).json({ status: 200, userposts:userpostsWithUrls});
    }
    catch(error){
        res.status(422).json({status:422,error});
    }
})


// delete the image by user
router.delete('/delete/:id',async(req,res)=>{
    try{
        const {imgKey} = req.body;
        const {id } = req.params;
        const check= await awsdeleteMiddleware(imgKey);
        if(check){
            const getPost = await postdb.findOneAndDelete({_id:id});
            res.status(201).json({status:201,getPost});
        }
        else{
            res.status(422).json({status:422,error:"in delete data from mongodb"});
        }

    }catch(error){
        res.status(422).json({status:422,message:"not deleted"});
    }
})

// getting all the post user login or not
router.get('/allget',async(req,res)=>{
    try{
        const userposts = await postdb.find();
        const userpostsWithUrls = await Promise.all(
            userposts.map(async (post) => {
                const signedUrl = await generateSignedUrl(post.imgKey);
                return {
                    ...post.toObject(), 
                    signedUrl,
                };
            })
        );
        res.status(200).json({ status: 200, userposts:userpostsWithUrls});
    }
    catch(error){
        res.status(422).json({status:422,error});
    }
})

// getting post from post id 
router.post('/getPostById',async(req,res)=>{
    const {postId}= req.body;
    try{
        if(!postId){
            throw new Error("post didn't exist");
        }
        const post = await postdb.findOne({_id:postId});
        const signedUrl = await generateSignedUrl(post.imgKey);
        const updatedPost = {
            ...post.toObject(), // Ensure mutability by converting to a plain object
            signedUrl,
          };
          console.log("i am succesffully",post);
        res.status(201).json({status:201,postdata:updatedPost});
    }
    catch(error){
        res.status(422).json({status:422,error:error});
    }
})


module.exports = router;
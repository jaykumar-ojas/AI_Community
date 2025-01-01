const express = require("express");
const router = new express.Router();
const multer = require('multer')
const postdb = require("../models/postSchema");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const {awsuploadMiddleware,awsgetMiddleware,awsdeleteMiddleware} = require("../middleware/awsmiddleware");


router.post('/upload', upload.single('image'), awsuploadMiddleware, async(req, res) => {
   try{
    const {userId,desc}=req.body;
    if(!userId){
        throw error("user not login");
    }
    const finalpost = new postdb({
        userId:userId,
        desc:desc,
        imgKey:req.imageName
    });

    const storePost = await finalpost.save();
    res.status(201).json({status:201,storePost});
   }catch(error){
    res.status(422).json({status:422,error});
   }
});

router.get('/get/:id',awsgetMiddleware,(req,res)=>{
    res.status(200).json({ status: 200, signedUrl: req.url });
})

router.get('/delete/:id',awsdeleteMiddleware,(req,res)=>{
    try{
        res.status(200).json({status:200,message:"successfully delete"});
    }catch(error){
        res.status(422).json({status:422,message:"not deleted"});
    }
})


module.exports = router;
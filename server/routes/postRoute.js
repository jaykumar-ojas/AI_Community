const express = require("express");
const router = new express.Router();
const multer = require('multer')

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const {awsuploadMiddleware,awsgetMiddleware,awsdeleteMiddleware} = require("../middleware/awsmiddleware");


router.post('/upload', upload.single('image'), awsuploadMiddleware, (req, res) => {
    console.log("i am here also");
    res.status(201).json({ status: 201, imageName: req.imageName });
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
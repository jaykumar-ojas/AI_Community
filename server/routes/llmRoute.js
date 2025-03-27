const express = require("express");
const router = new express.Router();
const {imageToText,promptEnhancer} = require('../middleware/LLMmiddleware');


// for uploading image 
const multer = require('multer');
const storage = multer.memoryStorage();

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


// there no uploading feature
router.post('/enhancedPrompt',upload.single("image"),imageToText,promptEnhancer,async(req,res)=>{
 try{
    if(!req.file){
        throw new Error("file is not found");
    }
    res.status(200).json({status:200,updatedPrompt:req.updatedPrompt})
 }
 catch(error){
    res.status(422).json({status: 422 ,message:"this is message",error :error});
 }
});


module.exports = router;


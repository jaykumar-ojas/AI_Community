const express = require("express");
const router = new express.Router();
const {imageToText,promptEnhancer,imageGenerator,promptEnhancerAI} = require('../middleware/LLMmiddleware');


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
// for prompt check promptEnhancer
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

router.post("/aitest",async (req, res) => {
  try {
    let {prompt} = req.body;
    prompt = await promptEnhancerAI(prompt);
    console.log(prompt);
    const url =await imageGenerator(prompt);
    res.status(200).json({ status: 200, updatedPrompt: url });
  } catch (error) {
    console.error("Error in route handler:", error);
    res.status(500).json({ status: 500, error: "Internal server error" });
  }
});



module.exports = router;


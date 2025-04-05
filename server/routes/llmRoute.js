const express = require("express");
const router = new express.Router();
const {imageToText,promptEnhancer,imageGenerator,promptEnhancerAI,textSuggestion} = require('../middleware/LLMmiddleware');
const { OpenAI } = require('openai');
const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_KEY,
});
const AWS = require('aws-sdk');
const axios = require('axios');
const crypto = require('crypto');

// Configure AWS
AWS.config.update({
  accessKeyId: process.env.S3_ACCESS_KEY,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  region: process.env.REGION
});

const s3 = new AWS.S3();

// Function to download image from URL
const downloadImage = async (url) => {
  try {
    const response = await axios({
      url,
      responseType: 'arraybuffer'
    });
    return response.data;
  } catch (error) {
    console.error('Error downloading image:', error);
    throw new Error('Failed to download image from OpenAI');
  }
};

// Function to upload to S3
const uploadToS3 = async (imageBuffer) => {
  try {
    const fileName = `ai-generated-${crypto.randomBytes(16).toString('hex')}.png`;
    const params = {
      Bucket: process.env.BUCKET,
      Key: fileName,
      Body: imageBuffer,
      ContentType: 'image/png'
    };

    console.log('Uploading to S3 with params:', {
      Bucket: process.env.BUCKET,
      Key: fileName,
      ContentType: 'image/png'
    });

    const result = await s3.upload(params).promise();
    console.log('S3 upload result:', result);
    return result.Location;
  } catch (error) {
    console.error('Detailed S3 upload error:', {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      requestId: error.requestId
    });
    throw new Error(`Failed to upload image to S3: ${error.message}`);
  }
};

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
  console.log("Request body: outside try", req.body);
  try {
    console.log("Request body:", req.body);
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

// New route for generating forum topic content
router.post("/generateTopicContent", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ status: 400, error: "Prompt is required" });
    }

    // Use the existing AI enhancement function
    const enhancedPrompt = await promptEnhancerAI(
      `Create a detailed forum post about: ${prompt}. Include a title and detailed content.`
    );

    // For demonstration, we'll return the enhanced prompt
    // In a real implementation, you might want to structure this differently
    res.status(200).json({ 
      status: 200, 
      content: {
        title: prompt.split('.')[0] || "AI Generated Topic",
        body: enhancedPrompt
      }
    });
  } catch (error) {
    console.error("Error generating topic content:", error);
    res.status(500).json({ status: 500, error: "Failed to generate topic content" });
  }
});

// New route for generating AI responses to forum topics
router.post("/generateTopicResponse", async (req, res) => {
  try {
    const { topicContent, userMessages } = req.body;
    
    if (!topicContent) {
      return res.status(400).json({ status: 400, error: "Topic content is required" });
    }

    // Combine topic content with user messages for context
    const contextPrompt = `
      Topic: ${topicContent}
      ${userMessages ? `User's question/comment: ${userMessages}` : ''}
      Please provide a helpful and engaging response that adds value to this discussion.
    `;

    // Use the text suggestion function for generating responses
    const aiResponse = await textSuggestion(contextPrompt);
    
    if (!aiResponse) {
      throw new Error("Failed to generate AI response");
    }
    
    res.status(200).json({ 
      status: 200, 
      response: aiResponse
    });
  } catch (error) {
    console.error("Error generating AI response:", error);
    res.status(500).json({ 
      status: 500, 
      error: error.message || "Failed to generate AI response. Please try again."
    });
  }
});

// Update the generateReplyImage route
router.post("/generateReplyImage", async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ status: 400, error: "Image prompt is required" });
    }

    console.log("Starting image generation process for prompt:", prompt);
    
    try {
      // First enhance the prompt for better image generation
      const enhancedPrompt = await promptEnhancerAI(prompt);
      console.log("Enhanced prompt:", enhancedPrompt);
      
      // Generate the image using OpenAI
      const imageUrl = await imageGenerator(enhancedPrompt);
      console.log("Generated image URL:", imageUrl);
      
      if (!imageUrl) {
        throw new Error("Image generation failed - no URL returned");
      }

      // Download the image from OpenAI
      console.log("Downloading image from OpenAI...");
      const imageBuffer = await downloadImage(imageUrl);
      console.log("Image downloaded successfully, size:", imageBuffer.length);
      
      // Upload to S3
      console.log("Starting S3 upload...");
      const s3Url = await uploadToS3(imageBuffer);
      console.log("Successfully uploaded to S3:", s3Url);
      
      // Return the successful response with S3 URL
      return res.status(200).json({ 
        status: 200, 
        imageUrl: s3Url,
        prompt: enhancedPrompt
      });
    } catch (innerError) {
      console.error("Detailed error in image generation process:", {
        message: innerError.message,
        stack: innerError.stack,
        code: innerError.code
      });
      
      return res.status(500).json({ 
        status: 500, 
        error: innerError.message || "Failed to process image. Please try again.",
        details: process.env.NODE_ENV === 'development' ? innerError.stack : undefined
      });
    }
  } catch (error) {
    console.error("Error in route handler:", {
      message: error.message,
      stack: error.stack
    });
    return res.status(500).json({ 
      status: 500, 
      error: "Server error while processing image generation request",
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// we can delete
router.post("/generate-image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Image file is required" });
    }

    const imagePath = req.file.path; // This is the file path
    console.log("Uploaded file path:", imagePath);
    
    // Read the image file
    const imageBuffer = fs.readFileSync(imagePath);

    // Process the image with OpenAI
    // ...

    // Delete the file after processing
    fs.unlinkSync(imagePath);

    res.json({ message: "Image processed successfully" });
  } catch (error) {
    console.error("Error processing image:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;

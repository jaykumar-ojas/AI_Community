const express = require("express");
const router = new express.Router();
const {model, describeImage, imageToText,promptEnhancer,imageGenerator,promptEnhancerAI, textSuggestion, fetchAncestorContext, processContextAwareRequest} = require('../middleware/LLMmiddleware');
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

router.post("/aitest", promptEnhancer, async (req, res) => {
  console.log("Request body: outside try in after middleware", req.body);
  try {
    const prompt = req.updatedPrompt;

    if(!prompt){
      console.error("Middleware 'promptEnhancer' failed to add ''updatedprompt");
      if(!res.headersSent){
        return res.status(500).json({status: 500, error: "promptenhancement step failed"});
      }

      return;
    }

    console.log("recived enhanced prompt ", prompt);
    const url =await imageGenerator(prompt);
    res.status(200).json({ 
      status: 200, 
      prompt: prompt,
      url: url
    });
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

    final_Prompt = `Generate a forum topic based on the folowing idea: "${prompt}" .
    
    Please provide the output in this format:
    Title: [Generated Title Here]
    
    [Generated detailed forum post content here]`;

    console.log("sending prompt to AI for the topic gneration: ", final_Prompt);

    const result = await model.generateContent(final_Prompt);
    const generatedText = result.response.text();
    console.log("Recived raw responce from AI: ", generatedText);

    let title = `AI TOPIC: ${prompt.substring(0, 40)} ...`;
    let body  = generatedText;

    const lines = generatedText.split('\n');
    const titleLineIndex = lines.findIndex(line => line.toLowerCase().startsWith('title:'));

    if(titleLineIndex !== -1){
      title = lines[titleLineIndex].substring(6).trim();

      //Findstart
      let bodyStartIndex = titleLineIndex + 1;
      while(bodyStartIndex < lines.length && lines[bodyStartIndex].trim()===''){
        bodyStartIndex++;
      }
      body = lines.slice(bodyStartIndex).join('\n').trim();
    }else{
      console.warn("AI response format might not contains 'Title:: useing default")
    }
    // For demonstration, we'll return the enhanced prompt
    // In a real implementation, you might want to structure this differently
    res.status(200).json({ 
      status: 200, 
      content: {
        title: title,
        body: body
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
router.post("/generateReplyImage/:id", fetchAncestorContext, async (req, res, next) => {
  try {

    console.log('Route handler - Request params:', req.params);
    console.log('Route handler - Request body:', req.body);
    
    const { userQuery } = req.body;
    const { contextType } = req.body;
    const { ancestorContext } = req;
    
    console.log('Route handler - Extracted values:', {
      userQuery,
      contextType,
      ancestorContext
    });
    
    if (!userQuery) {
      return res.status(400).json({ status: 400, error: "User query is required" });
    }

    const llmPrompt = `
Context Type: ${contextType}
Ancestor Context (P1 is the most recent parent):
${ancestorContext}

User Query (replying to item with ID ${req.params.id}): ${userQuery}

Generate the response content:
    `;

    console.log('Generated LLM prompt:', llmPrompt);

      return res.status(200).json({ 
               status: 200, 
               LLmprommpt: llmPrompt
          });
    
   // req.body.prompt = llmPrompt;
    
    // Call promptEnhancer middleware
    // promptEnhancer(req, res, async () => {
    //   try {
    //     const prompt = req.updatedPrompt;
    //     console.log("Enhanced prompt from middleware:", prompt);
    //     console.log("Starting image generation process for prompt:", prompt);

        
    //     // Generate the image using OpenAI
    //     // const imageUrl = await imageGenerator(prompt);
    //     console.log("Generated image URL:", imageUrl);
        
    //     if (!imageUrl) {
    //       throw new Error("Image generation failed - no URL returned");
    //     }

    //     // Download the image from OpenAI
    //     console.log("Downloading image from OpenAI...");
    //     const imageBuffer = await downloadImage(imageUrl);
    //     console.log("Image downloaded successfully, size:", imageBuffer.length);
        
    //     console.log("About to call describeImage function...");
    //     const description = await describeImage(imageBuffer);
    //     console.log("describeImage function returned:", description);
        
    //     // Upload to S3
    //     console.log("Starting S3 upload...");
    //     const s3Url = await uploadToS3(imageBuffer);
    //     console.log("Successfully uploaded to S3:", s3Url);
        
    //     // Return the successful response with S3 URL
    //     return res.status(200).json({ 
    //       status: 200, 
    //       imageUrl: s3Url,
    //       prompt: prompt,
    //       description: description
    //     });
    //   } catch (innerError) {
    //     console.error("Detailed error in image generation process:", {
    //       message: innerError.message,
    //       stack: innerError.stack,
    //       code: innerError.code
    //     });
        
    //     return res.status(500).json({ 
    //       status: 500, 
    //       error: innerError.message || "Failed to process image. Please try again.",
    //       details: process.env.NODE_ENV === 'development' ? innerError.stack : undefined
    //     });
    //   }
    // });
  } catch (error) {
    console.error("Error in route handler:", error);
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

// New route for context-aware requests
/**
 * Context-Aware LLM Request Handler
 * 
 * This endpoint processes requests with conversation context awareness. It can handle both
 * text responses and image generation based on the context of the conversation.
 * 
 * URL: POST /api/llm/contextAwareRequest/:id
 * 
 * Path Parameters:
 * - id: The ID of the starting node (forum reply or comment) to build context from
 * 
 * Request Body:
 * {
 *   "contextType": "forumReply" or "comment", // Type of the context to retrieve
 *   "prompt": "Your question or request" // User's prompt/question
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "result": {
 *     "type": "text" or "image",
 *     // For text responses:
 *     "content": "AI-generated response text",
 *     // For image responses:
 *     "imageUrl": "URL to generated image",
 *     "description": "Description used to generate the image"
 *   }
 * }
 * 
 * The system automatically detects if the user is requesting an image based on the prompt 
 * and responds accordingly with either text or an image.
 */
router.post("/contextAwareRequest/:id", fetchAncestorContext, processContextAwareRequest);

// global router for model selection 
// here we have to select model
// router.post("/global-route",async(req,res)=>{



// });

module.exports = router;

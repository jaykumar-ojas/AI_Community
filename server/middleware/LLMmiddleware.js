const {GoogleGenerativeAI} = require("@google/generative-ai");
const { OpenAI } = require("openai");
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const ForumReply = require('../models/forumReplySchema');
const Comment = require('../models/commentsModel');

dotenv.config();


// model defined
const genAI = new GoogleGenerativeAI("AIzaSyCrBM4stDGV58k4Kywt-xoZafjzveW6ZSA");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_KEY, // Replace with your OpenAI API key
});

function fileToGenerativePart(fileBuffer, mimeType) {
    return {
      inlineData: {
        data: fileBuffer.toString("base64"),
        mimeType,
      },
    };
  }

const promptEnhancer =async(req,res,next)=>{
    try {

        // when call from frontend make sure prompt send 
        // in this format :- prompt : "iahgajdg";
        
        const userPrompt = req.body.prompt;
      //  const  description  = req.description || " ";
        // if (!description) {
        //   return res.status(400).json({ error: "Prompt is required" });
        // }
        const CONSTANT_PROMPT = "As a professional prompt engineer give prompt to generate image by this descirption and strict limit of 100 words: ";
        const final_prompt = CONSTANT_PROMPT +  userPrompt;
    
        const result = await model.generateContent(final_prompt);
        const responseText = result.response.text();
        
        req.updatedPrompt = responseText;
        next();
        // res.json({ response: responseText });
      } catch (error) {
        console.error("Error generating text:", error);
        res.status(500).json({ error: "Failed to generate text" });
      }
};

const imageToText = async(req,res,next)=>{
    try {
        if (!req.file) {
          return res.status(400).json({ error: "No image file provided" });
        }
    
        const prompt = "Describe the contents of this image.";
        const imagePart = fileToGenerativePart(req.file.buffer, req.file.mimetype);
    
        const result = await model.generateContent([prompt, imagePart]);
        const responseText = result.response.text();
        req.description = responseText;
        next();
      } catch (error) {
        console.error("Error generating text:", error);
        res.status(500).json({ error: "Failed to process the image" });
      }
};




const textSuggestion = async(text) => {
  try {
    if (!text) {
      throw new Error("Text field is required");
    }

    const userPrompt = "Analyze the given text and provide a helpful, engaging response that adds value to the discussion. The response should be informative and maintain a conversational tone:";
    const final_prompt = userPrompt + "\n\n" + text;

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4", // Using GPT-4 for better responses
      messages: [{ role: "user", content: final_prompt }],
      temperature: 0.7,
      max_tokens: 500
    });

    // Return the AI response
    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error generating text:", error);
    throw error; // Let the route handler deal with the error
  }
};

const imageGenerator = async(text)=>{
  try{
    if(!text){
      console.error("No text provided for image generation");
      return null;
    }

    console.log("Generating image with prompt:", text);

    // Create a new OpenAI instance with the API key
   
    // Call the OpenAI API to generate an image
    const response = await openai.images.generate({
      model: "dall-e-3", // Using dall-e-2 which has fewer content restrictions
      prompt: text,
      n: 1,
      size: "1024x1024",
    });
  
    // Extract the image URL from the response
    if (response && response.data && response.data[0] && response.data[0].url) {
      const imageUrl = response.data[0].url;
      console.log("Successfully generated image URL");
      return imageUrl;
    } else {
      console.error("Invalid response structure from OpenAI");
      return null;
    }
  }
  catch(error){
    console.error("Error in imageGenerator function:", error);
    return null;
  }
}

const describeImage = async (imageBuffer) => {
    console.log("is this describe image function even calling or not");
  try {
    if(!imageBuffer || !Buffer.isBuffer(imageBuffer) || imageBuffer.length === 0){
      console.error("No valid image buffer provided for description");
      return null;
    }
    console.log("describing image buffer, size: ", imageBuffer.length);

    const base64Image = imageBuffer.toString('base64');
    
    // Detect mime type from buffer magic numbers
    const mimeType = 'image/png'; // Default to PNG, you might want to add proper mime type detection

    console.log("sending image to OPENAI for description..");

    const response = await openai.chat.completions.create({
      model: "gpt-4o",  // Updated to use the vision model
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "describe this image in detail. what is happening? what objects are present?",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 300,
    });

    if(response && response.choices && response.choices[0] && response.choices[0].message && response.choices[0].message.content){
      const description = response.choices[0].message.content;  // Fixed typo in 'choices'
      console.log("success received image description");
      return description;
    }else{
      console.error("invalid response structure");
      return null;
    }

  }catch(error){
    console.error("error in describe image function: ", error);
    if(error.response){
      console.error("OpenAI error details: ", error.response);
    }

    return null;
  }
}


async function extractImageDescription(context, userPrompt) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are an assistant that extracts detailed image descriptions from conversation contexts. 
                   Given a conversation and a request like "image of that" or "show me a picture", 
                   determine exactly what "that" refers to and create a detailed description for image generation.`
        },
        {
          role: "user",
          content: `${context}\n\nThe user has requested: "${userPrompt}"\n\nExtract a detailed description of what the image should show, based on the conversation context.`
        }
      ],
      max_tokens: 1000
    });
    
    return response.choices[0].message.content;
=======
const modelSelection = async(req,res,next)=>{
    try{
      console.log("i m jay");
    let content = req.body.content;
    const model = req.body.model || "";
    console.log("htis is my model name",model);
    if(model===""){
      console.log("i m returning from hree");
      return next();
    }
    if (model === "DALL-E") {
      req.body.content = await responseFromDalle(content);
    } else if (model === "GPT-4") {
      req.body.content = await responseFromGpt4(content);
    } else if (model === "Claude") {
      console.log("Before model transformation:", req.body.content);
      req.body.content = await responseFromClaude(req.body.content);
      console.log("After model transformation:", req.body.content);
    } else if (model === "Stable Diffusion") {
      req.body.content = await responseFromStableDiffusion(content);
    } else if (model === "Mid Journey") {
      req.body.content = await responseFromMidJourney(content);
    }

    next();
  } catch (error) {
    console.error("Error extracting image description:", error);
    return null;
  }
}

async function generateTextResponse(context, userPrompt) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant in a forum discussion. 
                   Use the provided conversation context to understand the discussion 
                   and give a relevant, thoughtful response.`
        },
        {
          role: "user",
          content: `${context}\n\nThe user has asked: "${userPrompt}"\n\nPlease provide a helpful response that takes the conversation context into account.`
        }
      ],
      max_tokens: 1000
    });
    
    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error generating text response:", error);
    return null;
  }
}

function getFirstNWords(text, n){
  if(!text || typeof text !== 'string')
  {
    return ' ';
  }

  const words = text.split(/\s+/).filter(words => words.length > 0);

  return words.slice(0, n).join(' ');
}

async function fetchAncestorContext(req, res, next) {
  try {
    const startId = req.params.id;
    const contextType = req.body.contextType;

    console.log('fetchAncestorContext - Input:', { startId, contextType });

    const maxDepth = 10;
    const maxWords = 50;

    if(!startId || !mongoose.Types.ObjectId.isValid(startId)){
      console.log('Invalid ID:', startId);
      return res.status(400).json({
        success: false,
        message: 'invalid or missing ID for context fetching'
      })
    }
    if(!contextType || (contextType !== 'forumReply' && contextType !== 'comment')){
      console.log('Invalid context type:', contextType);
      return res.status(400).json({
        success: false,
        message: "Missing or invalid context type"
      });
    }
    let SelectedModel;
    let parentId;
    let contentField;

    if(contextType === 'forumReply') {
      SelectedModel = ForumReply;
      parentId = 'parentReplyId';
      contentField = 'content';
    }else if(contextType === 'comment') {
      SelectedModel = Comment;
      parentId = 'parentId';
      contentField = 'commentText';
    }

    console.log('Selected model configuration:', { 
      modelName: SelectedModel.modelName,
      parentId,
      contentField 
    });

    const ancestorDescriptions = [];
    let currentId = startId;
    
    // First, include the start node itself
    const startNode = await SelectedModel.findById(startId)
      .select(`${contentField} description _id ${parentId}`)
      .lean();
      
    if (startNode) {
      const textToUse = startNode.description || startNode[contentField];
      const description = getFirstNWords(textToUse, maxWords);
      
      ancestorDescriptions.push({
        priority: 10,
        description: description
      });
      
      console.log('Added start node:', {
        priority: 10,
        description: description
      });
    }

    for(let i = 0; i<maxDepth; i++){
      console.log(`Fetching ancestor level ${i}, currentId:`, currentId);
      
      const currentNode = await SelectedModel.findById(currentId).select(parentId).lean();
      console.log('Current node:', currentNode);
      
      if(!currentNode || !currentNode[parentId]){
        console.log('No more ancestors found at level', i);
        break;
      }

      const parentNode = await SelectedModel.findById(currentNode[parentId])
        .select(`${contentField} description _id ${parentId}`)
        .lean();
      console.log('Parent node:', parentNode);

      if(!parentNode){
        console.log('Parent node not found');
        break;
      }

      // Use content field based on context type
      const textToUse = parentNode.description || parentNode[contentField];
      const description = getFirstNWords(textToUse, maxWords);

      console.log('Adding ancestor:', {
        priority: 9-i, // Reduced priority for ancestors (since start node has priority 10)
        description: description
      });

      ancestorDescriptions.push({
        priority: 9-i, // Reduced priority for ancestors
        description: description
      });

      currentId = parentNode._id;

      if(!parentNode[parentId]){
        console.log('No more parent IDs found');
        break;
      }
    }



    ancestorDescriptions.sort((a,b) => a.priority - b.priority);

    const contextString = ancestorDescriptions.map(item => `P${item.priority}: ${item.description}`).join(', ');

    console.log('Final context string:', contextString);
    
    req.ancestorContext = contextString;
    next();
  }catch (error){
    console.error('Error in fetchAncestorContext:', error);
    next(error);
  }
}


function formatContextForAI(ancestorContext) {
  if (!ancestorContext) return "";
  
  const contextItems = ancestorContext.split(', P').map(item => {
    if (!item.startsWith('P')) {
      item = 'P' + item;
    }
    return item;
  });
  
  let formattedContext = "CONVERSATION CONTEXT (from earliest to latest):\n\n";
  
  contextItems.forEach((item, index) => {
    // Extract priority and description
    const matches = item.match(/P(\d+):\s*(.*)/);
    if (matches && matches.length >= 3) {
      const priority = matches[1];
      const description = matches[2];
      
      // Calculate indentation based on reversed priority
      // Higher priority (more recent) gets more indentation
      const indentation = "  ".repeat(index);
      
      // Format each message
      formattedContext += `${indentation}[Message ${index + 1}] A user wrote:\n`;
      formattedContext += `${indentation}${description}\n\n`;
    }
  });
  
  return formattedContext;
}

function analyzeRequestType(userPrompt) {
  const prompt = userPrompt.toLowerCase();
  
  // Check for image generation requests
  if (
    prompt.includes('image of') || 
    prompt.includes('picture of') || 
    prompt.includes('show me') || 
    (prompt.includes('generate') && (prompt.includes('image') || prompt.includes('picture')))
  ) {
    return 'IMAGE_REQUEST';
  }
  
  // Default to text response
  return 'TEXT_REQUEST';
}
const processContextAwareRequest = async (req, res) => {
  try {
    // Get ancestor context from the middleware
    const ancestorContext = req.ancestorContext;
    if (!ancestorContext) {
      return res.status(400).json({
        success: false,
        message: "Context information is missing"
      });
    }

    // Get user prompt
    const userPrompt = req.body.prompt;
    if (!userPrompt) {
      return res.status(400).json({
        success: false,
        message: "User prompt is required"
      });
    }

    console.log('Processing context-aware request with context:', ancestorContext);
    console.log('User prompt:', userPrompt);

    // Format context for AI consumption
    const formattedContext = formatContextForAI(ancestorContext);
    
    // Analyze request type
    const requestType = analyzeRequestType(userPrompt);
    
    let result;
    
    if (requestType === 'IMAGE_REQUEST') {
      // Extract what the image should be of
      const imageDescription = await extractImageDescription(formattedContext, userPrompt);
      if (!imageDescription) {
        return res.status(500).json({
          success: false,
          message: "Failed to extract image description"
        });
      }
      
      // Use existing imageGenerator function to generate the image
      const imageUrl = await imageGenerator(imageDescription);
      if (!imageUrl) {
        return res.status(500).json({
          success: false,
          message: "Failed to generate image"
        });
      }
      
      result = {
        type: "image",
        imageUrl: imageUrl,
        description: imageDescription
      };
    } else {
      // Generate text response
      const textResponse = await generateTextResponse(formattedContext, userPrompt);
      if (!textResponse) {
        return res.status(500).json({
          success: false,
          message: "Failed to generate text response"
        });
      }
      
      result = {
        type: "text",
        content: textResponse
      };
    }
    
    return res.status(200).json({
      success: true,
      result: result
    });
  } catch (error) {
    console.error("Error processing context-aware request:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to process request",
      details: error.message
    });
  }
};

const promptEnhancerAI = async (prompt) => {
  try {
    if (!prompt) {
      throw new Error("Prompt is required");
    }

    const userPrompt = "Improve this image generation prompt to create a more detailed, vivid, and artistic description:";
    const final_prompt = userPrompt + "\n\n" + prompt;

    const response = await openai.chat.completions.create({
      model: "gpt-4", 
      messages: [{ role: "user", content: final_prompt }],
      temperature: 0.7,
      max_tokens: 500
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error enhancing prompt:", error);
    throw error;
  }
};

module.exports ={
    modelSelection,
    model,
    describeImage,
    promptEnhancer,
    promptEnhancerAI,
    imageToText,
    textSuggestion,
    imageGenerator,
    fetchAncestorContext,
    processContextAwareRequest,
    formatContextForAI,
    analyzeRequestType,
    extractImageDescription,
    generateTextResponse
};

// amazon nova
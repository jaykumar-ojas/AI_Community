const {GoogleGenerativeAI} = require("@google/generative-ai");
const { OpenAI } = require("openai");
const dotenv = require('dotenv');
const mongoose = require('mongoose');

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

        console.log("is user is comming");
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

    const maxDepth = 10;
    const maxWords=  50;

    if(!startId || !mongoose.Type.ObjectId.isValid(startId)){
      return res.status(400).json({
        sucess: false,
        message: 'invalid or missing ID for context fetching'
      })
    }
    if(!contextType || (contextType !== 'forumReply' && contextType !== 'comment')){
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

    const ancestorDescriptions = [];
    let currentId = startId;

    for(let i = 0; i<maxDepth; i++){
      const currentNode = await SelectedModel.findById(currentId).select(parentId).lean();
      if(!currentNode || !currentNode[parentId]){
        break;
      }

      const parentNode = await SelectedModel.findById(currentNode[parentId]).select(`${contentField} description _id ${parentId}`).lean();

      if(!parentNode){
        break;
      }

      // Use content field based on context type
      const textToUse = parentNode.description || parentNode[contentField];
      const description = getFirstNWords(textToUse, maxWords);

      ancestorDescriptions.push({
        priority: i+1,
        description: description
      });

      currentId = parentNode._id;

      if(!parentNode[parentId]){
        break;
      }
    }

    ancestorDescriptions.sort((a,b) => a.priority - b.priority);
    const contextString = ancestorDescriptions.map(item => `P${item.priority}: ${item.description}`).join(', ');

    req.ancestorContext = contextString;
    next();
  }catch (error){
    console.error('Error in fetch ancestor');
    next(error);
  }
}


module.exports ={
    model,
    describeImage,
    promptEnhancer,
    imageToText,
    textSuggestion,
    imageGenerator
};

// amazon nova
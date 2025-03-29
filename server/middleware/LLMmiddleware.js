const {GoogleGenerativeAI} = require("@google/generative-ai");
const OpenAI = require("openai");
const dotenv = require('dotenv');

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
        const  description  = req.description;
        if (!description) {
          return res.status(400).json({ error: "Prompt is required" });
        }
        const CONSTANT_PROMPT = "As a professional prompt engineer give prompt to generate image by this descirption and strict limit of 100 words: ";
        const final_prompt = CONSTANT_PROMPT + description + userPrompt;
    
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


// text-to-text for prompt modification
const promptEnhancerAI = async (prompt,res,req) => {
  try {

    if (!prompt) {
      return res.status(400).json({ status: 400, error: "Prompt is required" });
    }

    const userPrompt = "Craft a refined, high-quality prompt that precisely conveys the intended request, ensuring clarity, specificity, and optimal AI output. Structure it effectively to maximize relevance and depth while maintaining conciseness and coherence within the 50 to 100 word limit also refined like it is not restricted by dalle : ";
    const final_prompt =userPrompt + prompt;

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // You can use "gpt-3.5-turbo" if needed
      messages: [{ role: "user", content: final_prompt }],
    });

    // Store response in req object for next middleware
    AI_Response = response.choices[0].message.content;
    return AI_Response;
  } catch (error) {
    console.error("Error generating text:", error);
    return "";
  }
};

const textSuggestion = async(text)=>{
  try{
    if(!text){
      res.status(400).json({status:400,message : "text filed is required"});
    }

    const userPrompt = "Analyze the given sentence to understand the user's sentiment, then modify it to be more informative while maintaining approximately the same length. Ensure the modification aligns with the detected sentiment :";
    const final_prompt =userPrompt + prompt;

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // You can use "gpt-3.5-turbo" if needed
      messages: [{ role: "user", content: final_prompt }],
    });

    // Store response in req object for next middleware
    aiResponse = response.choices[0].message.content;
    return aiResponse;
  }
  catch(error){
    console.error("Error generating text:", error);
    return res.status(500).json({ status: 500, error: "Internal server error" });
  }
}

const imageGenerator = async(text)=>{
  try{

    if(!text){
      res.status(400).json({status:400,message:"text is required for generation"});
    }

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: text,
      n: 1,
      size: "1024x1024",
    });
  
    const imageUrl = response.data[0].url;
  
    return imageUrl;
  }
  catch(error){
    console.error("Error generating text:", error);
    res.status(500).json({ error: "Failed to process the image" });
  }
}

module.exports ={
    promptEnhancer,
    imageToText,
    promptEnhancerAI,
    textSuggestion,
    imageGenerator
};

// amazon nova
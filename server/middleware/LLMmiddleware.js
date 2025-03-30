const {GoogleGenerativeAI} = require("@google/generative-ai");
const { OpenAI } = require("openai");
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
const promptEnhancerAI = async (prompt) => {
  try {
    if (!prompt) {
      console.error("No prompt provided for enhancement");
      return prompt; // Return the original prompt if empty
    }

    console.log("Enhancing prompt:", prompt);

    // Check if OpenAI API key is available
    if (!process.env.OPEN_AI_KEY) {
      console.error("OpenAI API key is not configured");
      return prompt; // Return the original prompt if API key is missing
    }

    // For image generation, add specific instructions to avoid copyright issues
    let userPrompt = "Craft a refined, high-quality prompt that precisely conveys the intended request, ensuring clarity, specificity, and optimal AI output. ";
    
    // Add specific instructions for DALL-E image generation
    if (prompt.toLowerCase().includes("harry potter") || 
        prompt.toLowerCase().includes("voldemort") || 
        prompt.toLowerCase().includes("woldomort")) {
      userPrompt += "Create a fantasy-inspired magical scene with a young wizard facing a dark sorcerer in an epic battle. Avoid using any copyrighted character names or specific franchise references. ";
      console.log("Detected potential copyright content, adding safeguards to prompt");
    }
    
    userPrompt += "Structure it effectively to maximize relevance and depth while maintaining conciseness and coherence within the 50 to 100 word limit: ";
    const final_prompt = userPrompt + prompt;

    try {
      // Call OpenAI API
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // You can use "gpt-3.5-turbo" if needed
        messages: [{ role: "user", content: final_prompt }],
      });

      // Store response in req object for next middleware
      const AI_Response = response.choices[0].message.content;
      console.log("Enhanced prompt result:", AI_Response);
      return AI_Response;
    } catch (apiError) {
      console.error("OpenAI API error during prompt enhancement:", apiError.message);
      
      // If we're in development mode or there's an API error, return a modified version of the original prompt
      if (prompt.toLowerCase().includes("harry potter") || 
          prompt.toLowerCase().includes("voldemort") || 
          prompt.toLowerCase().includes("woldomort")) {
        return "A fantasy-inspired magical scene with a young wizard facing a dark sorcerer in an epic battle with dramatic lighting and magical effects.";
      }
      
      return prompt; // Return the original prompt if API call fails
    }
  } catch (error) {
    console.error("Error in promptEnhancerAI function:", error);
    return prompt; // Return the original prompt if any error occurs
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
    const openai = new OpenAI({
      apiKey: process.env.OPEN_AI_KEY,
    });

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

module.exports ={
    promptEnhancer,
    imageToText,
    promptEnhancerAI,
    textSuggestion,
    imageGenerator
};

// amazon nova
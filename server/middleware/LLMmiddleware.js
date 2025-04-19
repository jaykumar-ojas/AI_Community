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

const modelSelection = async(req,res,next)=>{
    try{
      console.log("i m jay");
    let content = req.body.content;
    const model = req.body.model || "";
      if(model===""){
        return;
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
    console.log("Error in model selection middleware in llmRoutes", error);
    res.status(400).json({ status: 422, error: "Causing some error" });
  }
};


const responseFromDalle =async (prompt)=>{
  try{
    if(!prompt){
      console.log("i m jay");
    }

    return "this is reponse from dalle";

  }
  catch(error){
    console.log("error in response from Dalle");
    res.status(400).json({status:422,error:"causing some error"});
  }
}

const responseFromGpt4 =async (prompt)=>{
  try{
    if(!prompt){
      console.log("i m jay");
    }

    return "this is reponse from response from gpt4";

  }
  catch(error){
    console.log("error in response from gpt4");
    res.status(400).json({status:422,error:"causing some error"});
  }
}

const responseFromClaude  = async (prompt)=>{
  try{
    if(!prompt){
      console.log("i m jay");
    }

    return "this is reponse from response from claude";

  }
  catch(error){
    console.log("error in response from gpt4");
    res.status(400).json({status:422,error:"causing some error"});
  }
}


const responseFromStableDiffusion  = async (prompt)=>{
  try{
    if(!prompt){
      console.log("i m jay");
    }

    return "this is reponse from response from stableDiffusion";

  }
  catch(error){
    console.log("error in response from stableDiffusion");
    res.status(400).json({status:422,error:"causing some error"});
  }
}

const responseFromMidJourney  = async (prompt)=>{
  try{
    if(!prompt){
      console.log("i m jay");
    }

    return "this is reponse from response from midJourney";

  }
  catch(error){
    console.log("error in response from midjjourney");
    res.status(400).json({status:422,error:"causing some error"});
  }
}


module.exports ={
    modelSelection,
    model,
    describeImage,
    promptEnhancer,
    imageToText,
    textSuggestion,
    imageGenerator
};

// amazon nova
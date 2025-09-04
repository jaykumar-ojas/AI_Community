const {Modality} = require("@google/genai");
const dotenv = require('dotenv');
const {fs} =  require("node:fs");

dotenv.config();

async function getGemini() {
  const { GoogleGenerativeAI,  Modality } = await import("@google/generative-ai");
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}
// const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function getImagen() {
  const { GoogleGenAI } = await import("@google/genai");
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}


async function googletext(prompt, model) {
  const ai = await getGemini();
  const response = await ai.models.generateContent({
    model: model,
    contents: prompt,
  });
  console.log(response.text);
  return response.text;
}

async function google_imagen(prompt, model) {
  const ai = await getImagen();

const response = await ai.models.generateImages({
    model: model,
    prompt: prompt,
    config: {
      numberOfImages: 1,
    },
  });
  const generatedImage = response.generatedImages[0]; 
      const imgBytes = generatedImage.image.imageBytes;
     return  Buffer.from(imgBytes, "base64");
}

async function generateGeminibanana(prompt, model) {
  const ai = await getImagen();

  const response = await ai.models.generateContent({
    model: model,
    contents: prompt,
     config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.text) {
      console.log(part.text);
    } else if (part.inlineData) {
      const imageData = part.inlineData.data;
      const buffer = Buffer.from(imageData, "base64");
      // fs.writeFileSync("gemini-native-image.png", buffer);
      // console.log("Image saved as gemini-native-image.png");

      return buffer; // Return the image buffer
    }
  }
}

module.exports = {
  googletext,
  google_imagen,
  generateGeminibanana,
};

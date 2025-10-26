const {Modality} = require("@google/genai");
const dotenv = require('dotenv');
const {fs} =  require("node:fs");

dotenv.config();

async function getGemini() {
  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}
// const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function getImagen() {
  const { GoogleGenAI } = await import("@google/genai");
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}


async function googletext(prompt, model, aspectRatio) {
  const ai = await getGemini();
  const genModel = ai.getGenerativeModel({ model });
  const response = await genModel.generateContent(prompt);
  
  const text = response.response.candidates[0].content.parts
    .map(p => p.text)
    .join(" ");

   console.log(text);
  return { text: text };
}

async function* googletextStream(prompt, model, aspectRatio) {
  const ai = await getGemini();
  const genModel = ai.getGenerativeModel({ model });
  
  const result = await genModel.generateContentStream(prompt);
  
  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) {
      yield { content: text };
    }
  }
}

async function google_imagen(prompt, model, aspectRatio) {
 const ai = await getImagen();
console.log("i am in imagen");
const response = await ai.models.generateImages({
    model: model,
    prompt: prompt,
    config: {
      numberOfImages: 1,
      aspectRatio: aspectRatio || "1:1",
    },
  });
  const generatedImage = response.generatedImages[0]; 
  const imgBytes = generatedImage.image.imageBytes;
     return  {imageData:imgBytes};
}

// async function google_imagen(prompt, model, aspectRatio) {
//   try {
//     const ai = await getImagen();
//     console.log("i am in imagen");

//     // Truncate prompt to 40 words max
//     const maxWords = 400;
//     const words = prompt.split(/\s+/).slice(0, maxWords);
//     const truncatedPrompt = words.join(" ");

//     const response = await ai.models.generateImages({
//       model: model,
//       prompt: truncatedPrompt,
//       config: {
//         numberOfImages: 1,
//         aspectRatio: aspectRatio || "1:1",
//       },
//     });

//     if (!response.generatedImages || response.generatedImages.length === 0) {
//       throw new Error("No image generated. Either your prompt is too long or flagged by Google.");
//     }

//     const generatedImage = response.generatedImages[0];
//     const imgBytes = generatedImage.image.imageBytes;

//     return { imageData: imgBytes };
//   } catch (err) {
//     console.error("Image generation failed:", err.message || err);
//     throw new Error("Failed to generate image: Either your prompt is too long or has flagged issues with Google.");
//   }
// }



async function generateGeminibanana(prompt, model, aspectRatio) {
  const ai = await getImagen();
  const response = await ai.models.generateContent({
    model: model,
    contents: prompt,
     config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
        aspectRatio: aspectRatio || "1:1",
      },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.text) {
      console.log(part.text);
    } else if (part.inlineData) {
      const imageData = part.inlineData.data;
      const buffer = imageData;
      // fs.writeFileSync("gemini-native-image.png", buffer);
      // console.log("Image saved as gemini-native-image.png");

      return {imageData:buffer}; // Return the image buffer
    }
  }
}

module.exports = {
  googletext,
  googletextStream,
  google_imagen,
  generateGeminibanana,
};

const { GoogleGenerativeAI } = require("@google/genai");

const dotenv = require('dotenv');
const {fs} =  require("node:fs");

dotenv.config();

// Use dynamic import since @google/genai is ESM-only
async function getAI() {
  const { GoogleGenerativeAI } = await import("@google/genai");
  return new GoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY,
  });
}

async function googletext(prompt, model) {
  const ai = await getAI();
  const genModel = ai.getGenerativeModel({ model });
  const response = await genModel.generateContent(prompt);
  return response.response.text();
}

async function google_imagen(prompt, model) {
  const ai = await getAI();
  const genModel = ai.getGenerativeModel({ model });
  const response = await genModel.generateContent(prompt);

  // extract inlineData (image)
  const parts = response.response.candidates?.[0]?.content?.parts || [];
  const inlinePart = parts.find((part) => part.inlineData?.data);

  if (!inlinePart) {
    throw new Error("No image data found in response.");
  }

  return Buffer.from(inlinePart.inlineData.data, "base64");
}

async function generateGeminibanana(prompt, model) {
  const ai = await getAI();
  const genModel = ai.getGenerativeModel({ model });
  const response = await genModel.generateContent(prompt);

  const parts = response.response.candidates?.[0]?.content?.parts || [];
  const inlinePart = parts.find((part) => part.inlineData?.data);

  if (!inlinePart) {
    throw new Error("No image data found in response.");
  }

  return Buffer.from(inlinePart.inlineData.data, "base64");
}

module.exports = {
  googletext,
  google_imagen,
  generateGeminibanana,
};

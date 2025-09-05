const { OpenAI } = require("openai");
const dotenv = require('dotenv');
dotenv.config();

const client = new OpenAI({
  apiKey: process.env.XAI_API_KEY, 
  baseURL: "https://api.x.ai/v1",
  timeout: 360000,
});


async function getGrokResponse( prompt, model) {
  const completion = await client.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content: "You are a highly intelligent AI assistant.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  return {text: completion.choices[0]?.message?.content || ""};
}


async function generateGrokImage(prompt, model, asBuffer = false) {
    const response = await client.images.generate({
      model,
      prompt,
      response_format: "b64_json",
    });
  
    const b64 = response.data[0]?.b64_json;
    if (!b64) throw new Error("No image data returned.");
  
    return asBuffer ? Buffer.from(b64, "base64") : b64;
  }

  module.exports = {
    getGrokResponse,
    generateGrokImage
  }
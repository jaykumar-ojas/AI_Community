const { OpenAI } = require('openai');
const dotenv = require('dotenv');

dotenv.config();

async function getOpenAI() {
  const OpenAI = (await import("openai")).default;
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

async function generateTextopenai(prompt, model) {

  console.log("Generating text with OpenAI model:", model);
  const openai = await getOpenAI();
  const response = await openai.chat.completions.create({
    model,
    messages: [{ role: "user", content: prompt }],
  });
  console.log("OpenAI response:", response);
  return response.choices[0].message.content;
}

async function generateImageBase64openai(prompt, model) {
  const openai = await getOpenAI();
  const response = await openai.images.generate({
    model,
    prompt,

  });

  if (!response.data[0]?.b64_json) {
    throw new Error("No image was generated.");
  }

  return Buffer.from(response.data[0].b64_json, "base64");
}

module.exports = {
  generateTextopenai,
  generateImageBase64openai,
};

const { OpenAI } = require('openai');
const dotenv = require('dotenv');

dotenv.config();

async function getOpenAI() {
  const OpenAI = (await import("openai")).default;
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

async function generateTextopenai(prompt, model, aspectRatio) {

  console.log("Generating text with OpenAI model:", model);
  const openai = await getOpenAI();
  const response = await openai.chat.completions.create({
    model,
    messages: [{ role: "user", content: prompt }],
  });
  console.log("OpenAI response:", response);
  return { text: response.choices[0].message.content };
}

async function* generateTextopenaiStream(prompt, model, aspectRatio) {
  console.log("Generating text with streaming OpenAI model:", model);
  const openai = await getOpenAI();

  const stream = await openai.chat.completions.create({
    model,
    messages: [{ role: "user", content: prompt }],
    stream: true,
  });

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta;
    if (delta?.content) {
      yield { delta };
    }
  }
}

async function generateImageBase64openai(prompt, model, aspectRatio) {
  try {
    console.log("i  coming here");
    const openai = await getOpenAI();
    console.log(" im here");
    const response = await openai.images.generate({
      model,
      prompt,
      size: aspectRatio || "1024x1024",
      response_format: "b64_json"
    });
    console.log("i come backg rom calling ,", response);
    if (!response.data[0]?.b64_json) {
      throw new Error("No image was generated.");
    }
    console.log("i alos get data");

    return { imageData: response.data[0].b64_json };
  }
  catch (error) {
    console.log("i got error", error);
  }

}

// async function generateImageBase64(prompt, model, aspectRatio) {

//   console.log("Generating image with OpenAI model:", model);
//   const openai = await getOpenAI();
//   const response = await openai.responses.create({
//     model:model,
//     input: prompt,
//     size: aspectRatio ||"1024x1024",
//     //tools: [{ type: "image_generation" }],
//   });

//   const imageData = response.output
//     .filter((output) => output.type === "image_generation_call")
//     .map((output) => output.result);

//   if (!imageData.length) {
//     throw new Error("No image was generated.");
//   }

//   return {imageData:imageData[0]}; // base64 string
// }

async function generateImageBase64(prompt, model = "gpt-image-1", aspectRatio = "1024x1024") {
  try {
    console.log("Generating image with model:", model);
    const openai = await getOpenAI();
    const result = await openai.images.generate({
      model,
      prompt,
      size: aspectRatio,
      //  background: "transparent",
      quality: "high",
    });

    if (!result.data?.length) {
      throw new Error("No image was generated.");
    }

    const image_base64 = result.data[0].b64_json;
    return { imageData: image_base64 }; // base64 string
  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
}



// async function generateImageBase64(prompt, model) {
//   const openai = await getOpenAI();

//   if (model === "gpt-5") {
//     // Use Responses API for GPT-5
//     const response = await openai.responses.create({
//       model,
//       input: prompt,
//       tools: [{ type: "image_generation" }],
//     });

//     const imageData = response.output
//       .filter((output) => output.type === "image_generation_call")
//       .map((output) => output.result);

//     if (!imageData.length) {
//       throw new Error("No image was generated.");
//     }

//     return imageData[0]; // base64 string
//   } else {
//     // Use Images API for dalle-3 / gpt-image-1
//     const response = await openai.images.generate({
//       model,
//       prompt,
//       response_format: "b64_json",
//     });

//     if (!response.data[0]?.b64_json) {
//       throw new Error("No image was generated.");
//     }

//     return response.data[0].b64_json; // base64 string
//   }
// }



module.exports = {
  generateTextopenai,
  generateTextopenaiStream,
  generateImageBase64openai,
  generateImageBase64
};

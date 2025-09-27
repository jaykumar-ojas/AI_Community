FormData = require("form-data");
require("dotenv").config();
const STABILITY_API_KEY = process.env.STABILITY_API_KEY;

async function ultra(prompt, model, aspectRatio) {
  const { default: axios } = await import("axios");

  // Allowed aspect ratios as per Stability API
  const validAspectRatios = [
    "21:9", "16:9", "3:2", "5:4", "1:1",
    "4:5", "2:3", "9:16", "9:21"
  ];

  // Fallback to '1:1' if invalid aspect ratio is passed
  if (!validAspectRatios.includes(aspectRatio)) {
    console.warn(`⚠️ Invalid aspect ratio "${aspectRatio}", defaulting to "1:1"`);
    aspectRatio = "1:1";
  }

  console.log("i m in ultra", aspectRatio);

  const payload = {
    prompt,
    output_format: "png",
    aspect_ratio: aspectRatio,
  };

  const response = await axios.postForm(
    "https://api.stability.ai/v2beta/stable-image/generate/ultra",
    axios.toFormData(payload, new FormData()),
    {
      responseType: "arraybuffer",
      validateStatus: undefined,
      headers: {
        Authorization: `Bearer ${STABILITY_API_KEY}`,
        Accept: "image/*",
      },
    }
  );

  if (response.status === 200) {
    const base64Image = Buffer.from(response.data, "binary").toString("base64");
    return { imageData: base64Image };
  } else {
    throw new Error(`${response.status}: ${response.data.toString()}`);
  }
}


async function core(prompt, model, aspectRatio) {
  const { default: axios } = await import("axios");

  console.log("i m in core before", aspectRatio);

  const validAspectRatios = [
    "21:9", "16:9", "3:2", "5:4", "1:1",
    "4:5", "2:3", "9:16", "9:21"
  ];

  // Fallback to '1:1' if invalid aspect ratio is passed
  if (!validAspectRatios.includes(aspectRatio)) {
    console.warn(`⚠️ Invalid aspect ratio "${aspectRatio}", defaulting to "1:1"`);
    aspectRatio = "1:1";
  }

  const payload = {
    prompt,
    output_format: "png",
    aspect_ratio: aspectRatio,
  };

  console.log("i m in core", aspectRatio);

  const response = await axios.postForm(
    "https://api.stability.ai/v2beta/stable-image/generate/core",
    axios.toFormData(payload, new FormData()),
    {
      responseType: "arraybuffer",
      validateStatus: undefined,
      headers: {
        Authorization: `Bearer ${STABILITY_API_KEY}`,
        Accept: "image/*",
      },
    }
  );

  if (response.status === 200) {
    const base64Image = Buffer.from(response.data, "binary").toString("base64");
    return { imageData: base64Image };
  } else {
    throw new Error(`${response.status}: ${response.data.toString()}`);
  }
}

async function sd3(prompt, model, aspectRatio) {
  const { default: axios } = await import("axios");

  const payload = {
    prompt,
    output_format: "png",
    model,
    aspect_ratio: aspectRatio || "1:1",
  };
  console.log("hellow");
  const response = await axios.postForm(
    "https://api.stability.ai/v2beta/stable-image/generate/sd3",
    axios.toFormData(payload, new FormData()),
    {
      responseType: "arraybuffer",
      validateStatus: undefined,
      headers: {
        Authorization: `Bearer ${STABILITY_API_KEY}`,
        Accept: "image/*",
      },
    }
  );

  if (response.status === 200) {
    const base64Image = Buffer.from(response.data, "binary").toString("base64");
    return { imageData: base64Image };
  } else {
    throw new Error(`${response.status}: ${response.data.toString()}`);
  }
}


module.exports = { ultra, core, sd3 };
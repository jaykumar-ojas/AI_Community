FormData = require("form-data");
require("dotenv").config();
const STABILITY_API_KEY = process.env.STABILITY_API_KEY;

async function ultra(prompt) {
  const { default: axios } = await import("axios");

  const payload = {
    prompt,
    output_format: "png",
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

async function core(prompt) {
  const { default: axios } = await import("axios");

  const payload = {
    prompt,
    output_format: "png",
  };

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

   // return {ImageData:response.data};
  } else {
    throw new Error(`${response.status}: ${response.data.toString()}`);
  }
}

async function sd3(prompt, model) {
  const { default: axios } = await import("axios");

  const payload = {
    prompt,
    output_format: "png",
    model,
  };

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
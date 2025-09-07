const dotenv = require("dotenv");
dotenv.config();

async function generateBFL(prompt, model, aspectRatio = "1:1", interval = 3000) {
  const { default: axios } = await import("axios");

  // 1. Submit generation request
  const response = await axios.post(
    `https://api.bfl.ai/v1/${model}`,
    { prompt, aspect_ratio: aspectRatio },
    {
      headers: {
        accept: "application/json",
        "x-key": process.env.FLUX_API_KEY,
        "Content-Type": "application/json",
      },
    }
  );

  const { polling_url } = response.data;
  if (!polling_url) {
    throw new Error(`No polling URL returned: ${JSON.stringify(response.data)}`);
  }

  // 2. Poll until status is Ready
  while (true) {
    const poll = await axios.get(polling_url, {
      headers: { accept: "application/json" },
    });

    if (poll.data.status === "Ready") {
      return {imageUrl:poll.data.result.sample}; // ✅ Final image URL
    }
    if (poll.data.status === "Failed") {
      throw new Error("Image generation failed.");
    }

    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
}

module.exports = { generateBFL };

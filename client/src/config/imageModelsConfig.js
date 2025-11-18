// src/config/imageModelsConfig.js
const imageModelsConfig = {
  // --- OpenAI ---
  "dall-e-3": {
    displayName: "DALL·E 3",
    provider: "openai",
    emoji: "🎨",
    aspectRatios: [
      { label: "Square", value: "1024x1024" },
      { label: "Landscape", value: "1792x1024" },
      { label: "Portrait", value: "1024x1792" },
    ],
  },
  "dall-e-2": {
    displayName: "DALL·E 2",
    provider: "openai",
    emoji: "🎨",
    aspectRatios: [{ label: "Square", value: "1024x1024" }],
  },
 "gpt-image-1": {
    displayName: "gpt-image-1",
    provider: "openai",
    emoji: "🎨",
    aspectRatios: [
     { label: "Square", value: "1024x1024" },
      { label: "Landscape", value: "1536x1024" },
      { label: "Portrait", value: "1024x1536" },
    ],
  },

  // --- Stable Diffusion ---
  "sd-ultra": {
    displayName: "Stable Diffusion Ultra",
    provider: "stable",
    emoji: "🖌️",
    aspectRatios: ["1:1", "16:9", "21:9", "2:3", "3:2", "4:5", "5:4", "9:16", "9:21"],
  },
  "core": {
    displayName: "Stable Diffusion Core",
    provider: "stable",
    emoji: "🖌️",
    aspectRatios: ["1:1", "16:9", "21:9", "2:3", "3:2", "4:5", "5:4", "9:16", "9:21"],
  },
  "sd3.5-large": {
    displayName: "Stable Diffusion 3.5 Large",
    provider: "stable",
    emoji: "🖌️",
    aspectRatios: ["1:1", "16:9", "21:9", "2:3", "3:2", "4:5", "5:4", "9:16", "9:21"],
  },
"sd3.5-large-turbo": {
    displayName: "Stable Diffusion 3.5 Large turbo",
    provider: "stable",
    emoji: "🖌️",
    aspectRatios: ["1:1", "16:9", "21:9", "2:3", "3:2", "4:5", "5:4", "9:16", "9:21"],
  },
  "sd3.5-medium":{
    displayName: "Stable Diffusion 3.5 medium",
    provider: "stable",
    emoji: "🖌️",
    aspectRatios: ["1:1", "16:9", "21:9", "2:3", "3:2", "4:5", "5:4", "9:16", "9:21"],
  },
  "sd3.5-flash": {
    displayName: "Stable Diffusion 3.5 Flash",
    provider: "stable",
    emoji: "⚡",
    aspectRatios: ["1:1", "16:9", "21:9", "2:3", "3:2", "4:5", "5:4", "9:16", "9:21"],
  },
  // --- Flux ---
 "flux-kontext-pro": {
  displayName: "Flux Kontext Pro",
  provider: "flux",
  emoji: "🌊",
  aspectRatios: ["1:1", "4:3", "3:4", "3:2", "2:3", "5:4", "4:5", "16:9", "9:16", "7:3", "3:7"],
},
"flux-kontext-max": {
  displayName: "Flux Kontext Max",
  provider: "flux",
  emoji: "🌊",
  aspectRatios: ["1:1", "4:3", "3:4", "3:2", "2:3", "5:4", "4:5", "16:9", "9:16", "7:3", "3:7"],
},
"flux-pro-1.1-ultra": {
  displayName: "Flux Pro 1.1 Ultra",
  provider: "flux",
  emoji: "🌊",
  aspectRatios: ["1:1", "4:3", "3:4", "3:2", "2:3", "5:4", "4:5", "16:9", "9:16", "7:3", "3:7"],
},
"flux-pro-1.1": {
  displayName: "Flux Pro 1.1",
  provider: "flux",
  emoji: "🌊",
  aspectRatios: ["1:1", "4:3", "3:4", "3:2", "2:3", "5:4", "4:5", "16:9", "9:16", "7:3", "3:7"],
},
"flux-dev": {
  displayName: "Flux Dev",
  provider: "flux",
  emoji: "🌊",
  aspectRatios: ["1:1", "4:3", "3:4", "3:2", "2:3", "5:4", "4:5", "16:9", "9:16", "7:3", "3:7"],
},
  // --- Imagen ---
   "imagen-4.0-generate-001": {
    displayName: "Imagen 4.0",
    provider: "google",
    emoji: "🖼️",
    aspectRatios: ["1:1", "3:4", "4:3", "9:16", "16:9"],
  },
  "imagen-4.0-ultra-generate-001": {
    displayName: "Imagen 4.0 Ultra",
    provider: "google",
    emoji: "🖼️",
    aspectRatios: ["1:1", "3:4", "4:3", "9:16", "16:9"],
  },
  "imagen-4.0-fast-generate-001": {
    displayName: "Imagen 4.0 Fast",
    provider: "google",
    emoji: "⚡",
    aspectRatios: ["1:1", "3:4", "4:3", "9:16", "16:9"],
  },
  "imagen-3.0-generate-002": {
    displayName: "Imagen 3.0",
    provider: "google",
    emoji: "🖼️",
    aspectRatios: ["1:1", "3:4", "4:3", "9:16", "16:9"],
  },

  // --- Gemini ---
  "gemini-2.5-flash-image-preview": {
    displayName: "Gemini 2.5 Image Preview",
    provider: "google",
    emoji: "🍌",
    aspectRatios: ["1:1"],
  },
  "gemini-2.0-flash-preview-image-generation": {
    displayName: "Gemini 2.0 Image Generation",
    provider: "google",
    emoji: "🍌",
    aspectRatios: ["1:1"],
  },

  // --- Grok ---
  "grok-2-image": {
    displayName: "Grok 2 Image",
    provider: "grok",
    emoji: "🤖",
    aspectRatios: ["1:1"],
  },
};

export default imageModelsConfig;
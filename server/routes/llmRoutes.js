const express = require("express");
const router = express.Router();
const llmService = require("../services/llmService");
// const { llmConfig } = require('../config/llmConfig');
const llmConfig = require("../config/modelconfig");
const modelCreditConfig = require("../config/modelCreditConfig");
const { reduceCredit, validateCredit } = require("../middleware/validateCredit");
const authenticate = require("../middleware/authenticate");


console.log("llmConfig import check:", {
  isObject: typeof llmConfig === "object",
  isEmpty: Object.keys(llmConfig || {}).length === 0,
  structure: llmConfig,
});


const validateRequest = (req, res, next) => {
  console.log("in validate");
  const { model, prompt, type, provider, aspectRatio } = req.body;
  console.log("Request body:", req.body);
  // 1. Required fields
  if (!type || !provider || !model || !prompt) {
    console.log("Missing required fields");
    return res.status(400).json({
      error: "Missing required fields: type, provider, model, and prompt are required",
    });
  }

  // 2. Validate type
  if (!["text", "image"].includes(type)) {
    console.log("Invalid type");
    return res.status(400).json({
      error: 'Type must be either "text" or "image"',
    });
  }

  // 3. Validate provider
  const providerConfig = llmConfig[type][provider];
  if (!providerConfig) {
    console.log("Invalid provider");
    return res.status(400).json({
      error: `Provider '${provider}' not found for type '${type}'`,
      availableProviders: Object.keys(llmConfig[type] || {}),
    });
  }

  // 4. Validate model
  const modelFunction = providerConfig[model];
  if (!modelFunction) {
    console.log("Invalid model");
    return res.status(400).json({
      error: `Model '${model}' not found for provider '${provider}'`,
      availableModels: Object.keys(providerConfig || {}),
    });
  }

  console.log("succeffully verified");

  // ✅ Attach resolved model function to request
  req.modelFunction = modelFunction;

  next();
};

router.post("/generateContent",authenticate, validateRequest, validateCredit, async (req, res) => {
  try {
    const { model, prompt, type, provider, aspectRatio} = req.body;
    // Get the function for the specific model from the provider
    const modelFunctions = req.modelFunction;

   const func = modelFunctions;
 //  const response = { imageUrl: "https://pixxelmindbucket.s3.eu-north-1.amazonaws.com/eaef348587b9ac0bc206d817d07a0523952432a1d1dd6cefa01c294c9681f576"};
    const response = await func(prompt, model, aspectRatio);

   // console.log("response from model function:", response);
 
    // const response = await new Promise((resolve) => {
    //   setTimeout(() => {
    //     resolve({
    //       imageUrl: "https://pixxelmindbucket.s3.eu-north-1.amazonaws.com/eaef348587b9ac0bc206d817d07a0523952432a1d1dd6cefa01c294c9681f576"
    //     });
    //   }, 10000); // 5 seconds
    // });

   let credit = 0;
    if(response?.text || response?.imageUrl || response?.imageData){
      const modelCredit = modelCreditConfig[type][model].cost;
      credit =await reduceCredit(req.userId,modelCredit);
    }

    console.log(response);
    res.json({
      success: true,
      data: response,
      credit: credit
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
});







// Route to get available models
router.get("/models", (req, res) => {
  try {
    const availableModels = llmService.getAvailableModels();
    const defaultModels = llmService.getDefaultModels();

    res.json({
      success: true,
      data: {
        models: availableModels,
        defaults: defaultModels,
      },
    });
  } catch (error) {
    console.error("Error getting available models:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
});

// Route to get model details
router.get("/models/:type/:model", (req, res) => {
  try {
    const { type, model } = req.params;

    if (!["text", "image"].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Type must be either "text" or "image"',
      });
    }

    const modelConfig = llmConfig[type][model];
    if (!modelConfig) {
      return res.status(404).json({
        success: false,
        error: `Model ${model} not found for type ${type}`,
        availableModels: Object.keys(llmConfig[type]),
      });
    }

    res.json({
      success: true,
      data: {
        name: model,
        type,
        provider: modelConfig.provider,
        config: {
          maxTokens: modelConfig.maxTokens,
          temperature: modelConfig.temperature,
          size: modelConfig.size,
        },
      },
    });
  } catch (error) {
    console.error("Error getting model details:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
});

router.get("/models-info", (req, res) => {
  try {
    const providerEmojis = {
      openai: "🤖",
      google: "✨",
      meta: "🦙",
      grok: "🚀",
      qwen: "🐉",
      flux: "⚡",
      stable: "🖼️",
    };

    // Display name mapping built directly from your llmConfig models
    const displayNameMapping = {
      // --- openai (text & image) ---
      "gpt-4.1": "GPT-4.1",
      "gpt-5": "GPT-5",
      "gpt-5-mini": "GPT-5 Mini",
      "gpt-5-nano": "GPT-5 Nano",
      "o4-mini": "O4 Mini",
      "dall-e-3": "DALL·E 3",
      "dall-e-2": "DALL·E 2",
      "gpt-image-1": "GPT Image 1",

      // --- google ---
      "gemini-2.0-flash": "Gemini 2.0 Flash",
      "gemini-2.5-pro": "Gemini 2.5 Pro",
      "gemini-2.5-flash": "Gemini 2.5 Flash",
      "gemini-2.0-flash-lite": "Gemini 2.0 Flash Lite",
      "imagen-4.0-generate-001": "Imagen 4.0",
      "imagen-4.0-ultra-generate-001": "Imagen 4.0 Ultra",
      "imagen-4.0-fast-generate-001": "Imagen 4.0 Fast",
      "imagen-3.0-generate-002": "Imagen 3.0",
      "gemini-2.5-flash-image-preview": "Gemini 2.5 Image Preview",
      "gemini-2.0-flash-preview-image-generation":
        "Gemini 2.0 Image Generation",

      // --- meta ---
      "llama-3.1-8b-instant": "LLaMA 3.1 8B Instant",
      "llama-3.3-70b-versatile": "LLaMA 3.3 70B Versatile",
      "meta-llama/llama-4-maverick-17b-128e-instruct": "LLaMA 4 Maverick 17B",
      "meta-llama/llama-4-scout-17b-16e-instruct": "LLaMA 4 Scout 17B",
      "meta-llama/llama-guard-4-12b": "LLaMA Guard 4 12B",

      // --- grok ---
      "grok-3-mini": "Grok 3 Mini",
      "grok-3-mini-fast": "Grok 3 Mini Fast",
      "grok-4": "Grok 4",
      "grok-2-image": "Grok 2 Image",

      // --- qwen ---
      "qwen/qwen3-32b": "Qwen3 32B",

      // --- stable ---
      "ultra": "Stable Diffusion Ultra",
      "core": "Stable Diffusion Core",
      "sd3.5-large": "sd 3.5 Large",
      "sd3.5-large-turbo": "sd 3.5 Large Turbo",
      "sd3.5-medium": "sd 3.5 Medium",
      "sd3.5-flash": "sd 3.5 Flash",

      // --- flux ---
      "flux-kontext-pro": "Flux Kontext Pro",
      "flux-kontext-max": "Flux Kontext Max",
      "flux-pro-1.1-ultra": "Flux Pro 1.1 Ultra",
      "flux-pro-1.1": "Flux Pro 1.1",
      "flux-pro": "Flux Pro",
      "flux-dev": "Flux Dev",
    };

    const buildInfo = (cfg, type) => {
      const out = {};
      Object.entries(cfg).forEach(([provider, models]) => {
        Object.keys(models).forEach((modelName) => {
          const emoji = providerEmojis[provider] || "🤖";
          const displayName = displayNameMapping[modelName] || modelName;
          out[modelName] = {
            provider,
            displayName,
            emoji,
            type,
          };
        });
      });
      return out;
    };

    const modelInfo = {
      text: buildInfo(llmConfig.text, "text"),
      image: buildInfo(llmConfig.image, "image"),
    };

    res.json({
      success: true,
      data: modelInfo,
    });
  } catch (error) {
    console.error("Error getting model info:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
});

module.exports = router;

// Route to generate content (text or image)
// router.post("/generate", validateRequest, async (req, res) => {
//   try {
//     const { model, prompt, type, options } = req.body;

//     const response = await llmService.generate(type, model, prompt, options);

//     res.json({
//       success: true,
//       data: response,
//     });
//   } catch (error) {
//     console.error("Error in generate route:", error);
//     res.status(500).json({
//       success: false,
//       error: error.message || "Internal server error",
//     });
//   }
// });
// Route to get model information with display names and emojis
// router.get('/models-info', (req, res) => {
//     try {
//         // Generate model info dynamically from llmConfig
//         const generateModelInfo = (config, type) => {
//             const modelInfo = {};

//             // Default emojis for different providers
//             const providerEmojis = {
//                 openai: "🤖",
//                 google: "✨",
//                 anthropic: "🧠",
//                 meta: "🦙",
//                 xai: "🚀",
//                 deepseek: "🔍",
//                 stability: "🖼️",
//                 runway: "🎬",
//                 flux: "⚡"
//             };

//             // Default display names mapping
//             const displayNameMapping = {
//                 "dall-e-3": "DALL-E 3",
//                 "stable-diffusion-xl": "Stable Diffusion XL",
//                 "stable-diffusion-3-5": "Stable Diffusion 3.5",
//                 "imagen-3.0-generate-002": "Imagen 3.0",
//                 "grok-2-image-1212": "Grok Image",
//                 "runway-sd": "Runway SD",
//                 "flux-schnell": "Flux Schnell",
//                 "gpt-4.1": "GPT-4.1",
//                 "gemini-2.0-flash": "Gemini 2.0",
//                 "claude-3-7-sonnet-20250219": "Claude 3",
//                 "llama-3.3-70b-versatile": "Llama 2",
//                 "grok-3-mini": "Grok 3",
//                 "deepseek-chat": "Deepseek Chat"
//             };

//             Object.entries(config).forEach(([modelName, modelConfig]) => {
//                 const provider = modelConfig.provider;
//                 const emoji = providerEmojis[provider] || "🤖";
//                 const displayName = displayNameMapping[modelName] || modelName;

//                 modelInfo[modelName] = {
//                     provider: provider,
//                     displayName: displayName,
//                     emoji: emoji,
//                     type: type
//                 };
//             });

//             return modelInfo;
//         };

//         const modelInfo = {
//             text: generateModelInfo(llmConfig.text, 'text'),
//             image: generateModelInfo(llmConfig.image, 'image')
//         };

//         res.json({
//             success: true,
//             data: modelInfo
//         });
//     } catch (error) {
//         console.error('Error getting model info:', error);
//         res.status(500).json({
//             success: false,
//             error: error.message || 'Internal server error'
//         });
//     }
// });

//const llmConfig = require('../config/modelconfig');

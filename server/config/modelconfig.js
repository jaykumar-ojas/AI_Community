

/* 
    text:{
        gpt-4.1
        gpt-5
        gpt-5-mini
        gpt-5-nano
        o4-mini
        gemini-2.0-flash
        gemini-2.5-pro
        gemini-2.5-flash
        gemini-2.0-flash-lite
        meta-llama/llama-4-scout
        meta-llama/llama-4-maverick
        meta-llama/Llama-3.3-70B-Instruct-Turbo
        meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo
        grok-3-mini
        grok-3-mini-fast
        grok-4
        mistralai/Mixtral-8x7B-Instruct-v0.1
        mistralai/Mistral-7B-Instruct-v0.3
        anthropic/claude-sonnet-4
        claude-3-7-sonnet-latest
        claude-3-5-sonnet-latest
        anthropic/claude-opus-4
        claude-opus-4-1
        deepseek/deepseek-r1
        deepseek/deepseek-chat-v3.1
        deepseek-chat
        qwen-max
        qwen-turbo
    }

    image:{
        dall-e-3
        dall-e-2
        gpt-5
        gpt-image-1
        grok-2-image
     imagen-4.0-generate-001
      imagen-4.0-ultra-generate-001
     imagen-4.0-fast-generate-001
       imagen-3.0-generate-002
    gemini-2.5-flash-image-preview
    gemini-2.0-flash-preview-image-generation
    stable image ultra = ultra
    stable image core = core
    sd3.5-large
    sd3.5-large-turbo
    sd3.5-medium
    sd3.5-flash
    flux-pro
    flux-pro/v1.1
    flux-pro/v1.1-ultra
    flux-realism
    alibaba/qwen-image
    gen4_image
    }
*/

// llmConfig.js

const { generateTextopenai, generateImageBase64openai, generateImageBase64 } = require('../services/Modelservice/openaiservice');
const {googletext, google_imagen, generateGeminibanana} = require('../services/Modelservice/googleaiservice');
const {getGrokResponse, generateGrokImage} = require('../services/Modelservice/xaiservice');
const { ultra, core, sd3 } = require('../services/Modelservice/stabilityservice');
const { generateBFL } = require('../services/Modelservice/fluxservice');
const { metagen } = require('../services/Modelservice/metaservice');

const llmConfig = {
  text: {
    "openai": {
      "gpt-4.1": generateTextopenai,
      "gpt-5":  generateTextopenai,
      "gpt-5-mini":  generateTextopenai,
      "gpt-5-nano":  generateTextopenai,
      "o4-mini":   generateTextopenai,
    },
    "google": {
      "gemini-2.0-flash":  googletext,
      "gemini-2.5-pro":  googletext,
      "gemini-2.5-flash":  googletext,
      "gemini-2.0-flash-lite":  googletext,
    },
    "meta": {
      "llama-3.1-8b-instant": metagen,
      "llama-3.3-70b-versatile": metagen, 
      "meta-llama/llama-4-maverick-17b-128e-instruct": metagen, 
      "meta-llama/llama-4-scout-17b-16e-instruct": metagen, 
      "meta-llama/llama-guard-4-12b": metagen,
    },
    "grok": {
      "grok-3-mini":  getGrokResponse,
      "grok-3-mini-fast":  getGrokResponse,
      "grok-4":  getGrokResponse,
    },
    // "mistralai": {
    //   "mistralai/Mixtral-8x7B-Instruct-v0.1":  
    //   "mistralai/Mistral-7B-Instruct-v0.3":  
    // },
    // "anthropic": {
    //   "anthropic/claude-sonnet-4":  
    //   "claude-3-7-sonnet-latest":  
    //   "claude-3-5-sonnet-latest":  
    //   "anthropic/claude-opus-4":  
    //   "claude-opus-4-1":  
    // },
    // "deepseek": {
    //   "deepseek/deepseek-r1":  
    //   "deepseek/deepseek-chat-v3.1":  
    //   "deepseek-chat":  
    // },
    "qwen": {
      "qwen/qwen3-32b": metagen,
    }
  },

  image: {
    "openai": {
      "dall-e-3": generateImageBase64openai,
      "dall-e-2": generateImageBase64openai,
      "gpt-5": generateImageBase64,
      "gpt-image-1": generateImageBase64openai,
    },
    "grok": {
      "grok-2-image": generateGrokImage
    },
    "google": {
      "imagen-4.0-generate-001":  google_imagen,
      "imagen-4.0-ultra-generate-001":  google_imagen,
      "imagen-4.0-fast-generate-001":  google_imagen,
      "imagen-3.0-generate-002":  google_imagen,
      "gemini-2.5-flash-image-preview":  generateGeminibanana,
      "gemini-2.0-flash-preview-image-generation":  generateGeminibanana,
    },
    "stable": {
      "ultra": ultra,
      "core": core, 
      "sd3.5-large": sd3,
      "sd3.5-large-turbo": sd3, 
      "sd3.5-medium": sd3, 
      "sd3.5-flash": sd3, 
     },
    "flux": {
      "flux-kontext-pro": generateBFL,
      "flux-kontext-max": generateBFL,
      "flux-pro-1.1-ultra": generateBFL,
      "flux-pro-1.1": generateBFL,
      "flux-pro": generateBFL,
      "flux-dev": generateBFL,
    },
    // "alibaba": {
    //   "alibaba/qwen-image":  
    // },
    // "gen4": {
    //   "gen4_image":  
    //   "gen4_image_turbo":
    // }
  }
};
console.log("Loaded model configuration:", llmConfig);
module.exports = llmConfig;


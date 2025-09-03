const express = require('express');
const router = express.Router();
const llmService = require('../services/llmService');
// const { llmConfig } = require('../config/llmConfig');
const { llmConfig } = require('../config/modelconfig');
// const {GoogleGenerativeAI} = require("@google/generative-ai");
// Middleware to validate request
const validateRequest = (req, res, next) => {
    const { model, prompt, type } = req.body;
    
    if (!model) {
        return res.status(400).json({ error: 'Model name is required' });
    }
    
    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!type || !['text', 'image'].includes(type)) {
        return res.status(400).json({ error: 'Type must be either "text" or "image"' });
    }

    // Validate if model exists for the given type
    if (!llmConfig[type][model]) {
        return res.status(400).json({ 
            error: `Model ${model} not found for type ${type}`,
            availableModels: Object.keys(llmConfig[type])
        });
    }
    
    next();
};

// Route to generate content (text or image)
router.post('/generate', validateRequest, async (req, res) => {
    try {
        const { model, prompt, type, options } = req.body;
        
        const response = await llmService.generate(type, model, prompt, options);
        
        res.json({
            success: true,
            data: response
        });
    } catch (error) {
        console.error('Error in generate route:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
});

// Route to get available models
router.get('/models', (req, res) => {
    try {
        const availableModels = llmService.getAvailableModels();
        const defaultModels = llmService.getDefaultModels();
        
        res.json({
            success: true,
            data: {
                models: availableModels,
                defaults: defaultModels
            }
        });
    } catch (error) {
        console.error('Error getting available models:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
});

// Route to get model details
router.get('/models/:type/:model', (req, res) => {
    try {
        const { type, model } = req.params;
        
        if (!['text', 'image'].includes(type)) {
            return res.status(400).json({ 
                success: false,
                error: 'Type must be either "text" or "image"'
            });
        }

        const modelConfig = llmConfig[type][model];
        if (!modelConfig) {
            return res.status(404).json({ 
                success: false,
                error: `Model ${model} not found for type ${type}`,
                availableModels: Object.keys(llmConfig[type])
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
                    size: modelConfig.size
                }
            }
        });
    } catch (error) {
        console.error('Error getting model details:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
});

// Route to get model information with display names and emojis
router.get('/models-info', (req, res) => {
    try {
        // Generate model info dynamically from llmConfig
        const generateModelInfo = (config, type) => {
            const modelInfo = {};
            
            // Default emojis for different providers
            const providerEmojis = {
                openai: "🤖",
                google: "✨", 
                anthropic: "🧠",
                meta: "🦙",
                xai: "🚀",
                deepseek: "🔍",
                stability: "🖼️",
                runway: "🎬",
                flux: "⚡"
            };

            // Default display names mapping
            const displayNameMapping = {
                "dall-e-3": "DALL-E 3",
                "stable-diffusion-xl": "Stable Diffusion XL",
                "stable-diffusion-3-5": "Stable Diffusion 3.5",
                "imagen-3.0-generate-002": "Imagen 3.0",
                "grok-2-image-1212": "Grok Image",
                "runway-sd": "Runway SD",
                "flux-schnell": "Flux Schnell",
                "gpt-4.1": "GPT-4.1",
                "gemini-2.0-flash": "Gemini 2.0",
                "claude-3-7-sonnet-20250219": "Claude 3",
                "llama-3.3-70b-versatile": "Llama 2",
                "grok-3-mini": "Grok 3",
                "deepseek-chat": "Deepseek Chat"
            };

            Object.entries(config).forEach(([modelName, modelConfig]) => {
                const provider = modelConfig.provider;
                const emoji = providerEmojis[provider] || "🤖";
                const displayName = displayNameMapping[modelName] || modelName;
                
                modelInfo[modelName] = {
                    provider: provider,
                    displayName: displayName,
                    emoji: emoji,
                    type: type
                };
            });
            
            return modelInfo;
        };

        const modelInfo = {
            text: generateModelInfo(llmConfig.text, 'text'),
            image: generateModelInfo(llmConfig.image, 'image')
        };
        
        res.json({
            success: true,
            data: modelInfo
        });
    } catch (error) {
        console.error('Error getting model info:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
});

router.post('/generateaires', async (req, res) => {
    try {
        const { model, prompt, type, provider } = req.body;
        let func;
        if(type==text){
            func = llmConfig.text[provider][model];
        }
        // Better error handling
 
        //const func = llmConfig[type][provider][model];
        if (!func) {
            return res.status(400).json({ 
                error: `Model '${model}' not found. Available models for ${provider}: ${Object.keys(llmConfig[type][provider]).join(', ')}` 
            });
        }

        console.log("Function found for model:", model);
        const response = await func(prompt, model);
        
        res.json({
            success: true,
            data: response
        });

    } catch (error) {
        console.error('Error in generate route:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
});


module.exports = router; 
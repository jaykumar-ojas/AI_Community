const express = require('express');
const router = express.Router();
const llmService = require('../services/llmService');
const llmConfig = require('../config/llmConfig');
const {GoogleGenerativeAI} = require("@google/generative-ai");
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

module.exports = router; 
const { OpenAI } = require('openai');
const llmConfig = require('../config/llmConfig');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Groq = require('groq-sdk');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

class LLMService {
    constructor() {
        this.clients = {};
        this.initializeClients();
    }

    initializeClients() {
        // Initialize clients for each provider
        const providers = new Set([
            ...Object.values(llmConfig.text).map(model => model.provider),
            ...Object.values(llmConfig.image).map(model => model.provider)
        ]);

        providers.forEach(provider => {
            this.clients[provider] = new OpenAI({
                apiKey: process.env[`${provider.toUpperCase()}_API_KEY`],
                baseURL: llmConfig.text[Object.keys(llmConfig.text).find(model => llmConfig.text[model].provider === provider)]?.baseURL ||
                        llmConfig.image[Object.keys(llmConfig.image).find(model => llmConfig.image[model].provider === provider)]?.baseURL
            });
        });
    }

    async generate(type, modelName, prompt, options = {}) {
        try {
            if (!['text', 'image'].includes(type)) {
                throw new Error(`Invalid generation type: ${type}`);
            }

            const modelConfig = llmConfig[type][modelName];
            if (!modelConfig) {
                throw new Error(`Model ${modelName} not found for type ${type}`);
            }

            const provider = modelConfig.provider;
            const client = this.clients[provider];
            if (!client) {
                throw new Error(`Provider ${provider} not initialized`);
            }

            const requestOptions = {
                ...modelConfig,
                ...options
            };

            console.log(`Generating ${type} using model: ${modelName}, provider: ${provider}`);
            console.log('Request options:', requestOptions);

            let result;
            if (type === 'text') {
                result = await this._generateTextByProvider(provider, client, modelName, prompt, requestOptions);
            } else {
                result = await this._generateImageByProvider(provider, client, modelName, prompt, requestOptions);
            }

            return {
                type,
                provider,
                model: modelName,
                result,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error(`Error generating ${type} with model ${modelName}:`, error);
            throw error;
        }
    }

    async _generateTextByProvider(provider, client, model, prompt, options) {
        switch (provider) {
            case 'openai':
                return await this._generateOpenAIText(client, model, prompt, options);
            case 'anthropic':
                return await this._generateAnthropicText(client, model, prompt, options);
            case 'google':
                return await this._generateGoogleTextWithOfficialSDK(model, prompt, options);
            case 'deepseek':
                return await this._generateDeepseekText(client, model, prompt, options);
            case 'xai':
                return await this._generateXaiText( client, model, prompt, options);
            case 'meta':
                return await this._generateGroqText(model, prompt, options);
            default:
                throw new Error(`Unsupported text provider: ${provider}`);
        }
    }

    async _generateImageByProvider(provider, client, model, prompt, options) {
        switch (provider) {
            case 'openai':
                return await this._generateOpenAIImage(client, model, prompt, options);
            case 'google':
                return await this._generateGoogleImage(model, prompt, options);
            case 'xai':
                return await this._generateXaiImage(client, model, prompt, options);
            case 'stability':
                return await this._generateStabilityImage(model, prompt, options);
            case 'runway':
                return await this._generateRunwayImage(client, model, prompt, options);
            case 'flux':
                return await this._generateFluxImage(client, model, prompt, options);
            default:
                throw new Error(`Unsupported image provider: ${provider}`);
        }
    }

    // OpenAI Text Generation
    async _generateOpenAIText(client, model, prompt, options) {
        const response = await client.chat.completions.create({
            model: model,
            messages: [{ role: "user", content: prompt }],
            temperature: options.temperature,
            max_tokens: options.maxTokens
        });

        return {
            text: response.choices[0].message.content
         //   usage: response.usage
        };
    }

    // Anthropic Text Generation
    async _generateAnthropicText(client, model, prompt, options) {
        const response = await client.messages.create({
            model: model,
            messages: [{ role: "user", content: prompt }],
            temperature: options.temperature,
            max_tokens: options.maxTokens
        });

        return {
            text: response.content[0].text,
            usage: response.usage
        };
    }

    // Google Text Generation
    async _generateGoogleTextWithOfficialSDK(model, prompt, options) {
       
        
        try {
           
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
            const result = await model.generateContent({
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    temperature: options.temperature || 0.7,
                    maxOutputTokens: options.maxTokens || 1000,
                    topP: options.topP || 0.95,
                    topK: options.topK || 64
                }
            });
    
            const response = await result.response;
            return {
                text: response.text(),
                // usage: {
                //     promptTokens: result.response.usageMetadata?.promptTokenCount,
                //     completionTokens: result.response.usageMetadata?.candidatesTokenCount,
                //     totalTokens: result.response.usageMetadata?.totalTokenCount
                // }
            };
        } catch (error) {
            console.error('Google Gemini API Error:', error);
            throw error;
        }
    }
    
    

    // Deepseek Text Generation
    async _generateDeepseekText(client, model, prompt, options) {
        const response = await client.chat.completions.create({
            model: model,
            messages: [{ role: "user", content: prompt }],
            temperature: options.temperature,
            max_tokens: options.maxTokens
        });

        return {
            text: response.choices[0].message.content,
            usage: response.usage
        };
    }

    // XAI (Grok) Text Generation
// XAI (Grok) Text Generation
async _generateXaiText(client, model, prompt, options) {
   

    try {
        const response = await client.chat.completions.create({
            model: model,
            messages: [{ role: "user", content: prompt }],
            temperature: options.temperature || 0.7,
            max_tokens: options.maxTokens || 2000
        });

        // Add proper validation
        if (!response || !response.choices || !response.choices[0] || !response.choices[0].message) {
            console.error('Invalid XAI API response structure:', response);
            throw new Error('Invalid response format from XAI API');
        }

        const result = {
            text: response.choices[0].message.content // Access .content property
        };

        return result;
    } catch (error) {
        console.error('XAI API Error details:', error);
        console.error('Error response:', error.response?.data);
        throw new Error(`XAI API error: ${error.message}`);
    }
}
    
    
    

    // Meta (Llama) Text Generation
    async _generateMetaText(client, model, prompt, options) {
        const response = await client.chat.completions.create({
            model: model,
            messages: [{ role: "user", content: prompt }],
            temperature: options.temperature,
            max_tokens: options.maxTokens
        });

        return {
            text: response.choices[0].message.content,
            usage: response.usage
        };
    }

    // OpenAI Image Generation
    async _generateOpenAIImage(client, model, prompt, options) {
            const response = await client.images.generate({
                model: model,
                prompt: prompt,
                n: options.n || 1,
                size: options.size,
                quality: options.quality
            });

        return {
            images: response.data[0].url
        };
    }

    // Google Image Generation
    async _generateGoogleImage( model, prompt, options) {
        try {
            console.log('Generating Google Imagen with model:', model);
            
            // Use the same genAI instance we created for text generation
            const imagenModel = genAI.getGenerativeModel({ model: "imagen-3.0-generate-002" });
            
            const result = await imagenModel.generateContent({
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    temperature: options.temperature || 0.7,
                    topP: options.topP || 0.95,
                    topK: options.topK || 64
                }
            });

            const response = await result.response;
            
            if (!response || !response.candidates || !response.candidates[0]) {
                throw new Error('Invalid response from Google Imagen API');
            }

            return {
                images: [{
                    url: response.candidates[0].content.parts[0].text,
                    format: 'base64'
                }]
            };
        } catch (error) {
            console.error('Google Imagen API Error:', error);
            throw new Error(`Google Imagen API Error: ${error.message}`);
        }
    }

    // XAI Image Generation
    async _generateXaiImage(client, model, prompt, options) {
        const response = await client.images.generate({
            model: model,
            prompt: prompt,
            n: options.n || 1,
           // size: options.size
        });

        return {
            images: response.data[0].url
        };
    }

    // Stability AI Image Generation
    async _generateStabilityImage(model, prompt, options) {
        try {
            const axios = require('axios');
            const requestOptions = {
                method: 'POST',
                url: 'https://modelslab.com/api/v6/realtime/text2img',
                headers: {
                    'Content-Type': 'application/json',
                },
                data: {
                    key: process.env.STABILITY_API_KEY,
                    prompt: prompt,
                    negative_prompt: options.negativePrompt || 'bad quality',
                    width: options.width || '512',
                    height: options.height || '512',
                    safety_checker: options.safetyChecker || false,
                    seed: options.seed || null,
                    samples: options.n || 1,
                    base64: options.base64 || false,
                    webhook: options.webhook || null,
                    track_id: options.trackId || null,
                }
            };

            const response = await axios(requestOptions);
            const result = response.data;

            return {
                images: result.output.map(url => ({
                    url: url,
                    //revised_prompt: prompt
                }))
            };
        } catch (error) {
            console.error('Stability AI API Error:', error);
            throw new Error(`Stability AI API Error: ${error.message}`);
        }
    }

    // Runway Image Generation
    async _generateRunwayImage(client, model, prompt, options) {
        const response = await client.images.generate({
            model: model,
            prompt: prompt,
            n: options.n || 1,
            size: options.size
        });

            return {
            images: response.images.map(img => ({
                url: img.url,
                revised_prompt: img.revised_prompt || prompt
                }))
            };
    }

    // Flux Image Generation
    async _generateFluxImage(client, model, prompt, options) {
        const response = await client.images.generate({
            model: model,
            prompt: prompt,
            n: options.n || 1,
            size: options.size
        });

        return {
            images: response.images.map(img => ({
                url: img.url,
                revised_prompt: img.revised_prompt || prompt
            }))
        };
    }

    // Groq Text Generation
    async _generateGroqText(model, prompt, options) {
        try {
            const completion = await groq.chat.completions.create({
                messages: [
                    {
                        role: "user",
                        content: prompt,
                    },
                ],
                model: model,
                temperature: options.temperature || 0.7,
                max_tokens: options.maxTokens || 1000,
            });

            return {
                text: completion.choices[0].message.content,
                // usage: completion.usage || {
                //     prompt_tokens: 0,
                //     completion_tokens: 0,
                //     total_tokens: 0
                // }
            };
        } catch (error) {
            console.error('Groq API Error:', error);
            throw new Error(`Groq API error: ${error.message}`);
        }
    }

    getAvailableModels() {
        return {
            text: Object.keys(llmConfig.text),
            image: Object.keys(llmConfig.image)
        };
    }

    getDefaultModels() {
        return llmConfig.defaultModel;
    }
}

module.exports = new LLMService(); 

const llmConfig = {
    text: {
        "grok-3-mini": {
            provider: "xai",
            baseURL: "https://api.x.ai/v1",
            apiKey: "XAI_API_KEY",
            maxTokens: 4000,
            temperature: 0.7
        },
        "gpt-4.1": {
            provider: "openai",
            baseURL: "https://api.openai.com/v1",
            apiKey: "OPENAI_API_KEY",
            maxTokens: 4000,
            temperature: 0.7
        },
        // "grok-3-mini": {
        //     provider: "xai",
        //     baseURL: "https://api.xai.com/v1",
        //     apiKey: "GROK_API_KEY",
        //     maxTokens: 4000,
        //     temperature: 0.7
        // },
        "gemini-2.0-flash": {
            provider: "google",
            baseURL: "https://generativelanguage.googleapis.com/v1beta/openai",
            apiKey: "GEMINI_API_KEY",
            maxTokens: 2000,
            temperature: 0.7
        },
        "deepseek-chat": {
            provider: "deepseek",
            baseURL: "https://api.deepseek.com",
            apiKey: "DEEPSEEK_API_KEY",
            maxTokens: 2000,
            temperature: 0.7
        },
        "claude-3-7-sonnet-20250219": {
            provider: "anthropic",
            baseURL: "https://api.anthropic.com/v1",
            apiKey: "ANTHROPIC_API_KEY",
            maxTokens: 4000,
            temperature: 0.7
        },
        "llama-3.3-70b-versatile": {
            provider: "meta",
            baseURL: "https://api.meta.ai/v1",
            apiKey: "GROQ_API_KEY",
            maxTokens: 4000,
            temperature: 0.7
        },
        "meta-llama/llama-4-scout-17b-16e-instruct":{
            provider: "meta",
            baseURL: "https://api.meta.ai/v1",
            apiKey: "GROQ_API_KEY",
            maxTokens: 4000,
            temperature: 0.7
        }
    },
    image: {
        "dall-e-3": {
            provider: "openai",
            baseURL: "https://api.openai.com/v1",
            apiKey: "OPENAI_API_KEY",
            size: "1024x1792"
        },
        "grok-2-image-1212": {
            provider: "xai",
            baseURL: "https://api.x.ai/v1",
            apiKey: "XAI_API_KEY",
            size: "1920x1024"
        },
        "imagen-3.0-generate-002": {
            provider: "google",
            baseURL: "https://generativelanguage.googleapis.com/v1beta",
            apiKey: "GEMINI_API_KEY",
            size: "1024x1024"
        },
        "stable-diffusion-xl": {
            provider: "stability",
            baseURL: "https://api.stability.ai/v1",
            apiKey: "STABILITY_API_KEY",
            size: "1024x1024",
            engine: "stable-diffusion-xl-1024-v1-0"  // Optional: specify engine
        },
        "stable-diffusion-3-5": {
            provider: "stability",
            baseURL: "https://api.stability.ai/v1",
            apiKey: "STABILITY_API_KEY",
            size: "1024x1024",
            engine: "stable-diffusion-3-5-large"
        },
        "runway-sd": {
            provider: "runway",
            baseURL: "https://api.runwayml.com/v1",
            apiKey: "RUNWAY_API_KEY",
            size: "1024x1024",
            model: "runway-ml/stable-diffusion-v1-5"  // Optional: specify model
        },
        "flux-schnell": {
            provider: "flux",
            baseURL: "https://api.replicate.com/v1",  // Using Replicate
            apiKey: "FLUX_API_KEY",  // or REPLICATE_API_TOKEN
            size: "1024x1024",
            version: "2b017d9b67edd2ee1401238df49d75da53c523f36e363881e057f5dc3ed3c5b2"
        },
        "flux-dev": {
            provider: "flux",
            baseURL: "https://api.flux.ai/v1",  // Direct Flux API (if available)
            apiKey: "FLUX_API_KEY",
            size: "1024x1024"
        }
    },
    
    defaultModel: {
        text: "gpt-4.1",
        image: "dall-e-3"
    }
};

module.exports = llmConfig; 
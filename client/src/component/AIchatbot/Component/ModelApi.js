const baseUrl = process.env.REACT_APP_BASE_URL;


export const fetchModelConfig = async () => {
    const res = await fetch(`${baseUrl}/models-info`);
    if (!res.ok) throw new Error("Failed to fetch model config");
    const data = await res.json();
    if (!data.success) throw new Error("API returned unsuccessful response");
    return data.data;
};

export const fetchIconUrl = async (modelName) => {
    const res = await fetch(`${baseUrl}/aimodels/search?modelName=${encodeURIComponent(modelName)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.success ? data.data.iconUrl : null;
};

export const loadIcons = async (modelConfig,modelType,iconUrls,setIconUrls) => {
    const entries = Object.entries(modelConfig[modelType] || {});
    for (const [modelName] of entries) {
        if (!iconUrls[modelName]) {
            const iconUrl = await fetchIconUrl(modelName);
            if (iconUrl) {
                setIconUrls(prev => ({ ...prev, [modelName]: iconUrl }));
            }
        }
    }
};

export const modelCreditConfig = {
    
    "gpt-5": { cost: 10 },
    "gpt-5-mini": { cost: 8 },
    "gpt-5-nano": { cost: 7 },
    "gpt-4.1": { cost: 5 },
    "o4-mini": { cost: 4 },

    "gemini-2.5-pro": { cost: 8 },
    "gemini-2.5-flash": { cost: 5 },
    "gemini-2.0-flash": { cost: 4 },
    "gemini-2.0-flash-lite": { cost: 3 },
    "gemini-3-pro-preview": { cost: 9 },

    "meta-llama/llama-4-maverick-17b-128e-instruct": { cost: 6 },
    "meta-llama/llama-4-scout-17b-16e-instruct": { cost: 5 },
    "llama-3.3-70b-versatile": { cost: 4 },
    "llama-3.1-8b-instant": { cost: 3 },
    "meta-llama/llama-guard-4-12b": {cost:2},

    "grok-4": { cost: 10 },
    "grok-3-mini": { cost: 8 },
    "grok-3-mini-fast": { cost: 5 },

    "mistralai/Mixtral-8x7B-Instruct-v0.1": { cost: 7 },
    "mistralai/Mistral-7B-Instruct-v0.3": { cost: 6 },

    "anthropic/claude-sonnet-4": { cost: 4 },
    "claude-3-7-sonnet-latest": { cost: 3 },
    "claude-3-5-sonnet-latest": { cost: 2 },
    "anthropic/claude-opus-4": { cost: 5 },
    "claude-opus-4-1": { cost: 5 },

    "deepseek/deepseek-r1": { cost: 3 },
    "deepseek/deepseek-chat-v3.1": { cost: 2 },
    "deepseek-chat": { cost: 1 },

    "qwen/qwen3-32b": { cost: 6 },
    "qwen-max": { cost: 5 },
    "qwen-turbo": { cost: 5 },

    "gpt-image-1": { cost: 20 },   // most costly
    "dall-e-3": { cost: 10 },
    "dall-e-2": { cost: 5 },

    "grok-2-image": { cost: 12 },

    "imagen-4.0-ultra-generate-001": { cost: 15 },
    "imagen-4.0-generate-001": { cost: 12 },
    "imagen-4.0-fast-generate-001": { cost: 10 },
    "imagen-3.0-generate-002": { cost: 10 },

    "gemini-2.5-flash-image-preview": { cost: 9 },
    "gemini-2.0-flash-preview-image-generation": { cost: 8 },
    "gemini-3-pro-image-preview": { cost: 10 },

    "sd-ultra": { cost: 15 },
    "core": { cost: 12 },
    "sd3.5-large": { cost: 10 },
    "sd3.5-large-turbo": { cost: 9 },
    "sd3.5-medium": { cost: 8 },
    "sd3.5-flash": { cost: 7 },

    "flux-pro": { cost: 8 },
    "flux-pro-1.1": { cost: 9 },
    "flux-pro-1.1-ultra": { cost: 10 },
    "flux-kontext-pro": { cost: 15 },
    "flux-kontext-max": { cost: 13 },
    "flux-dev": { cost: 7 },

    "alibaba/qwen-image": { cost: 2 },
    "gen4_image": { cost: 3 }
};
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
    
    "gpt-5": { cost: 5 },
    "gpt-5-mini": { cost: 2 },
    "gpt-5-nano": { cost: 1 },
    "gpt-4.1": { cost: 4 },
    "o4-mini": { cost: 2 },

    "gemini-2.5-pro": { cost: 4 },
    "gemini-2.5-flash": { cost: 2 },
    "gemini-2.0-flash": { cost: 1 },
    "gemini-2.0-flash-lite": { cost: 1 },

    "meta-llama/llama-4-maverick-17b-128e-instruct": { cost: 3 },
    "meta-llama/llama-4-scout-17b-16e-instruct": { cost: 2 },
    "llama-3.3-70b-versatile": { cost: 3 },
    "llama-3.1-8b-instant": { cost: 1 },

    "grok-4": { cost: 4 },
    "grok-3-mini": { cost: 2 },
    "grok-3-mini-fast": { cost: 1 },

    "mistralai/Mixtral-8x7B-Instruct-v0.1": { cost: 2 },
    "mistralai/Mistral-7B-Instruct-v0.3": { cost: 1 },

    "anthropic/claude-sonnet-4": { cost: 4 },
    "claude-3-7-sonnet-latest": { cost: 3 },
    "claude-3-5-sonnet-latest": { cost: 2 },
    "anthropic/claude-opus-4": { cost: 5 },
    "claude-opus-4-1": { cost: 5 },

    "deepseek/deepseek-r1": { cost: 3 },
    "deepseek/deepseek-chat-v3.1": { cost: 2 },
    "deepseek-chat": { cost: 1 },

    "qwen/qwen3-32b": { cost: 3 },
    "qwen-max": { cost: 2 },
    "qwen-turbo": { cost: 1 },

    "gpt-image-1": { cost: 6 },   // most costly
    "dall-e-3": { cost: 5 },
    "dall-e-2": { cost: 3 },

    "grok-2-image": { cost: 3 },

    "imagen-4.0-ultra-generate-001": { cost: 5 },
    "imagen-4.0-generate-001": { cost: 3 },
    "imagen-4.0-fast-generate-001": { cost: 2 },
    "imagen-3.0-generate-002": { cost: 1 },

    "gemini-2.5-flash-image-preview": { cost: 2 },
    "gemini-2.0-flash-preview-image-generation": { cost: 1 },

    "sd-ultra": { cost: 4 },
    "core": { cost: 2 },
    "sd3.5-large": { cost: 3 },
    "sd3.5-large-turbo": { cost: 3 },
    "sd3.5-medium": { cost: 2 },
    "sd3.5-flash": { cost: 1 },

    "flux-pro": { cost: 3 },
    "flux-pro-1.1": { cost: 4 },
    "flux-pro-1.1-ultra": { cost: 5 },
    "flux-kontext-pro": { cost: 2 },
    "flux-kontext-max": { cost: 3 },
    "flux-dev": { cost: 1 },

    "alibaba/qwen-image": { cost: 2 },
    "gen4_image": { cost: 3 }
};
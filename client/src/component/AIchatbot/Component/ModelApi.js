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
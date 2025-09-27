// ModelsContext.js
import React, { createContext, useState, useEffect } from "react";
import imageModelsConfig from "../../config/imageModelsConfig";

export const ModelsContext = createContext();

const baseUrl = process.env.REACT_APP_BASE_URL;

const fetchIconUrl = async (modelName) => {
  try {
    const res = await fetch(`${baseUrl}/aimodels/search?modelName=${encodeURIComponent(modelName)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.success ? data.data.iconUrl : null;
  } catch {
    return null;
  }
};

export const ModelsProvider = ({ children }) => {
  const [availableModels, setAvailableModels] = useState({ image: {} });
  const [isLoadingModels, setIsLoadingModels] = useState(true);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch(`${baseUrl}/models-info`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            const models = data.data.image || {};
            const enrichedModels = {};
            for (const [key, config] of Object.entries(models)) {
              const iconUrl = await fetchIconUrl(key);
              const localConfig = imageModelsConfig[key] || {};
              enrichedModels[key] = {
                ...config,
                ...localConfig,
                iconUrl: iconUrl || null,
              };
            }
            setAvailableModels({ image: enrichedModels });
          }
        }
      } catch (error) {
        console.error("Error fetching models:", error);
        setAvailableModels({ image: imageModelsConfig });
      } finally {
        setIsLoadingModels(false);
      }
    };

    // 👇 prefetch right when app starts
    fetchModels();
  }, []);

  return (
    <ModelsContext.Provider value={{ availableModels, isLoadingModels }}>
      {children}
    </ModelsContext.Provider>
  );
};

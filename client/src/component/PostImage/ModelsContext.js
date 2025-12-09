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
    return data?.success ? data.data.iconUrl : null;
  } catch {
    return null;
  }
};

export const ModelsProvider = ({ children }) => {
  const [availableModels, setAvailableModels] = useState({ image: {}, text: {} });
  const [isLoadingModels, setIsLoadingModels] = useState(true);

  useEffect(() => {
    const fetchAndEnrich = async () => {
      setIsLoadingModels(true);

      try {
        const response = await fetch(`${baseUrl}/models-info`);
        if (!response.ok) throw new Error("Failed to fetch models-info");
        const payload = await response.json();
        if (!payload.success) throw new Error(payload.error || "No models data");

        const respImage = payload.data?.image ?? {};
        const respText = payload.data?.text ?? {};

        // helper to enrich a model map (modelKey -> cfg)
        const enrichMap = async (map, localConfigMap = {}) => {
          const entries = Object.entries(map || {});
          // run icon fetches in parallel
          const promises = entries.map(async ([key, cfg]) => {
            const iconUrl = await fetchIconUrl(key);
            const localCfg = localConfigMap[key] || {};
            return [key, { ...cfg, ...localCfg, iconUrl: iconUrl || null }];
          });

          const resolved = await Promise.all(promises);
          const out = {};
          for (const [k, v] of resolved) out[k] = v;
          return out;
        };

        // Enrich both image and text (imageModelsConfig provides local overrides for images;
        // we can reuse it for text too if you have text local configs, otherwise pass {}).
        const [enrichedImage, enrichedText] = await Promise.all([
          enrichMap(respImage, imageModelsConfig),
          enrichMap(respText, {}), // if you have textModelsConfig, pass it here
        ]);

        setAvailableModels({ image: enrichedImage, text: enrichedText });
      } catch (err) {
        console.error("Error fetching models-info:", err);
        // fallback: use local imageModelsConfig as image and keep text empty
        setAvailableModels({ image: imageModelsConfig, text: {} });
      } finally {
        setIsLoadingModels(false);
      }
    };

    fetchAndEnrich();
  }, []);

  return (
    <ModelsContext.Provider value={{ availableModels, isLoadingModels }}>
      {children}
    </ModelsContext.Provider>
  );
};

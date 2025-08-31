import React, { useContext, useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { ForumContext } from "../../ContextProvider/ModelContext";
import { CommentContext } from "../../ContextProvider/CommentModelContext";

const baseUrl = process.env.REACT_APP_BASE_URL;

function ModelItem({
  name,
  displayName,
  iconUrl,
  emoji,
  active = false,
  onClick,
}) {
  return (
    <li>
      <button
        type="button"
        className={`w-full text-left px-2 py-2 rounded-md transition-all duration-150 cursor-pointer flex items-center space-x-2 ${
          active
            ? "bg-like_color text-text_header font-medium transform scale-[1.02]"
            : "text-text_header hover:bg-like_color hover:transform hover:scale-[1.02]"
        }`}
        onClick={() => onClick(name)}
      >
        {iconUrl ? (
          <img
            src={iconUrl}
            alt={displayName}
            style={{ width:16 , height: 16, borderRadius: "50%" }}
            onError={(e) => {
              e.target.style.display = "none";
              e.target.nextSibling.style.display = "inline";
            }}
          />
        ) : null}
        <span
          className="text-sm"
          style={{ display: iconUrl ? "none" : "inline" }}
        >
          {emoji}
        </span>
        <span className="text-sm">{displayName}</span>
      </button>
    </li>
  );
}

const fetchModelConfig = async () => {
  const res = await fetch(`${baseUrl}/models-info`);
  if (!res.ok) throw new Error("Failed to fetch model config");
  const data = await res.json();
  if (!data.success) throw new Error("API returned unsuccessful response");
  return data.data;
};

const fetchIconUrl = async (modelName) => {
  const res = await fetch(
    `${baseUrl}/aimodels/search?modelName=${encodeURIComponent(modelName)}`
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data.success ? data.data.iconUrl : null;
};

const ModelContent = ({ closeDropdown }) => {
  const { model, setModel, modelType, setModelType } = useContext(CommentContext);
  const [iconUrls, setIconUrls] = useState({});
  const [isOpen, setIsOpen] = useState(false); // dropdown state
  const containerRef = useRef(null);

  const {
    data: modelConfig = { text: {}, image: {} },
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["model-config"],
    queryFn: fetchModelConfig,
    staleTime: 1000 * 60 * 5, // 5 mins
  });

  // Fetch icons after modelConfig is available
  useEffect(() => {
    const loadIcons = async () => {
      const entries = Object.entries(modelConfig[modelType] || {});
      for (const [modelName] of entries) {
        if (!iconUrls[modelName]) {
          const iconUrl = await fetchIconUrl(modelName);
          if (iconUrl) {
            setIconUrls((prev) => ({ ...prev, [modelName]: iconUrl }));
          }
        }
      }
    };
    loadIcons();
  }, [modelConfig, modelType]);

  const handleModelSelect = (modelName) => {
    setModel(modelName);
    const isImageModel = modelType === "image";
    const controlBits = {
      enhancePrompt: false,
      generateText: !isImageModel,
      generateImage: isImageModel,
      processContextAware: false,
    };
    window.dispatchEvent(
      new CustomEvent("modelSelected", {
        detail: {
          model: modelName,
          type: modelType,
          controlBits,
        },
      })
    );
    
    if (closeDropdown) closeDropdown();
  };

  const handleTypeSelect = (type) => {
    setModelType(type);
    setModel("");
    const isImageModel = type === "image";
    const controlBits = {
      enhancePrompt: false,
      generateText: !isImageModel,
      generateImage: isImageModel,
      processContextAware: false,
    };
    window.dispatchEvent(
      new CustomEvent("modelSelected", {
        detail: {
          model: "",
          type: type,
          controlBits,
        },
      })
    );
  };

  if (isLoading) {
    return (
      <div className="w-full flex flex-col bg-transparent rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-500 border-b-transparent"></div>
          <span className="ml-2 text-text_header">Loading models...</span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 text-red-500">
        Failed to load model configuration.
      </div>
    );
  }

  return (
    <div className="relative" ref={containerRef}>
      {/* Model Type Selector */}

      {/* Dropdown Button fixed at bottom navbar */}
      <div className="fixed bottom-12 left-1/2 transform -translate-x-1/2 w-[90%] z-50">
        {/* Dropdown list above button */}

        <ul className="absolute bottom-full mb-2 w-full max-h-64 overflow-y-auto bg-gray-800 rounded-md shadow-lg p-2 z-50">
          <div className="flex space-x-2 mb-2">
            {["text", "image"].map((type) => (
              <button
                type="button"
                key={type}
                className={`px-3 py-1 rounded-md text-sm flex items-center space-x-1 transition-all duration-150 ${
                  modelType === type
                    ? "bg-like_color text-text_header font-medium"
                    : "text-text_header hover:bg-like_color"
                }`}
                onClick={() => handleTypeSelect(type)}
              >
                <span>{type === "text" ? "✍️" : "🖼️"}</span>
                <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
              </button>
            ))}
          </div>

          {Object.entries(modelConfig[modelType] || {}).map(
            ([modelName, config]) => (
              <ModelItem
                key={modelName}
                name={modelName}
                displayName={config.displayName}
                iconUrl={iconUrls[modelName]}
                emoji={config.emoji}
                active={model === modelName}
                onClick={handleModelSelect}
              />
            )
          )}
        </ul>
      </div>
    </div>
  );
};

export default ModelContent;

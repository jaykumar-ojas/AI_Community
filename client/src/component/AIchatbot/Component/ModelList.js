import React, { useContext, useEffect, useState } from 'react';
import { ForumContext } from '../../ContextProvider/ModelContext';

function ModelItem({ name, displayName, iconUrl, emoji, active = false, onClick }) {
    return (
        <li>
            <button
                className={`w-full text-left px-3 py-2 rounded-md transition-all duration-150 cursor-pointer flex items-center space-x-2 ${
                    active
                        ? 'bg-like_color text-text_header font-medium transform scale-[1.02]'
                        : 'text-text_header hover:bg-like_color hover:transform hover:scale-[1.02]'
                }`}
                onClick={() => onClick(name)}
            >
                {iconUrl ? (
                    <img 
                        src={iconUrl} 
                        alt={displayName} 
                        style={{ width: 24, height: 24, borderRadius: '50%' }}
                        onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'inline';
                        }}
                    />
                ) : null}
                <span className="text-xl" style={{ display: iconUrl ? 'none' : 'inline' }}>{emoji}</span>
                <span>{displayName}</span>
            </button>
        </li>
    );
}

const ModelList = () => {
    const { model, setModel, modelType, setModelType } = useContext(ForumContext);
    const [modelConfig, setModelConfig] = useState({ text: {}, image: {} });
    const [isLoading, setIsLoading] = useState(true);
    const [iconUrls, setIconUrls] = useState({}); // { modelName: iconUrl }

    // Fetch model configuration from backend
    useEffect(() => {
        const fetchModelConfig = async () => {
            try {
                setIsLoading(true);
                const response = await fetch("http://localhost:8099/models-info");
                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        setModelConfig(data.data);
                        // Set default model if none selected
                        if (!model && data.data[modelType]) {
                            const firstModel = Object.keys(data.data[modelType])[0];
                            setModel("");
                        }
                    }
                }
            } catch (error) {
                console.error("Error fetching model config:", error);
                // Fallback to basic config if API fails
                setModelConfig({
                    text: {
                        "gpt-4.1": { displayName: "GPT-4.1", emoji: "🤖", provider: "openai" }
                    },
                    image: {
                        "dall-e-3": { displayName: "DALL-E 3", emoji: "🎨", provider: "openai" }
                    }
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchModelConfig();
    }, [model, modelType, setModel]);

    // Fetch icon URLs for all models in the current type
    useEffect(() => {
        const fetchIcons = async () => {
            const entries = Object.entries(modelConfig[modelType] || {});
            for (const [modelName] of entries) {
                if (!iconUrls[modelName]) {
                    try {
                        const res = await fetch(`http://localhost:8099/aimodels/search?modelName=${encodeURIComponent(modelName)}`);
                        if (res.ok) {
                            const data = await res.json();
                            if (data.success && data.data.iconUrl) {
                                setIconUrls(prev => ({ ...prev, [modelName]: data.data.iconUrl }));
                            }
                        }
                    } catch (err) {
                        // Ignore icon fetch errors
                    }
                }
            }
        };
        fetchIcons();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [modelConfig, modelType]);

    const handleModelSelect = (modelName) => {
        setModel(modelName);
        // Update control bits based on model type
        const isImageModel = modelType === 'image';
        const controlBits = {
            enhancePrompt: false,
            generateText: !isImageModel,
            generateImage: isImageModel,
            processContextAware: false
        };
        // You can emit an event or use context to update control bits in UserReply
        window.dispatchEvent(new CustomEvent('modelSelected', {
            detail: {
                model: modelName,
                type: modelType,
                controlBits
            }
        }));
    };

    const handleTypeSelect = (type) => {
        setModelType(type);
        const defaultModel = Object.keys(modelConfig[type] || {})[0];
        if (defaultModel) {
            setModel(defaultModel);
            // Update control bits when type changes
            const isImageModel = type === 'image';
            const controlBits = {
                enhancePrompt: false,
                generateText: !isImageModel,
                generateImage: isImageModel,
                processContextAware: false
            };
            window.dispatchEvent(new CustomEvent('modelSelected', {
                detail: {
                    model: defaultModel,
                    type: type,
                    controlBits
                }
            }));
        }
    };

    if (isLoading) {
        return (
            <div className="w-full flex flex-col bg-black rounded-lg shadow-sm p-4">
                <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-500 border-b-transparent"></div>
                    <span className="ml-2 text-text_header">Loading models...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col bg-black rounded-lg shadow-sm">
            {/* Model Type Selection */}
            <div className="p-4 border-b border-gray-700">
                <div className="font-semibold mb-3 text-text_header text-sm flex items-center">
                    <span className="mr-2">🎯</span> MODEL TYPE
                </div>
                <div className="flex space-x-3">
                    <button
                        className={`px-4 py-2 rounded-md text-sm flex items-center space-x-2 transition-all duration-150 ${
                            modelType === 'text'
                                ? 'bg-like_color text-text_header font-medium transform scale-[1.02]'
                                : 'text-text_header hover:bg-like_color hover:transform hover:scale-[1.02]'
                        }`}
                        onClick={() => handleTypeSelect('text')}
                    >
                        <span>✍️</span>
                        <span>Text</span>
                    </button>
                    <button
                        className={`px-4 py-2 rounded-md text-sm flex items-center space-x-2 transition-all duration-150 ${
                            modelType === 'image'
                                ? 'bg-like_color text-text_header font-medium transform scale-[1.02]'
                                : 'text-text_header hover:bg-like_color hover:transform hover:scale-[1.02]'
                        }`}
                        onClick={() => handleTypeSelect('image')}
                    >
                        <span>🖼️</span>
                        <span>Image</span>
                    </button>
                </div>
            </div>

            {/* AI Models Section */}
            <div className="p-4">
                <div className="font-semibold mb-3 text-text_header text-sm flex items-center">
                    <span className="mr-2">🤖</span> AI MODELS
                </div>
                <ul className="space-y-2">
                    {Object.entries(modelConfig[modelType] || {}).map(([modelName, config]) => (
                        <ModelItem
                            key={modelName}
                            name={modelName}
                            displayName={config.displayName}
                            iconUrl={iconUrls[modelName]}
                            emoji={config.emoji}
                            active={model === modelName}
                            onClick={handleModelSelect}
                        />
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default ModelList;


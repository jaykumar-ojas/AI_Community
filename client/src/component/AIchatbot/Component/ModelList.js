import React, { useContext, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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

const fetchModelConfig = async () => {
    const res = await fetch("/models-info");
    if (!res.ok) throw new Error("Failed to fetch model config");
    const data = await res.json();
    if (!data.success) throw new Error("API returned unsuccessful response");
    return data.data;
};

const fetchIconUrl = async (modelName) => {
    const res = await fetch(`/aimodels/search?modelName=${encodeURIComponent(modelName)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.success ? data.data.iconUrl : null;
};

const ModelList = () => {
    const { model, setModel, modelType, setModelType } = useContext(ForumContext);
    const [iconUrls, setIconUrls] = useState({});

    const {
        data: modelConfig = { text: {}, image: {} },
        isLoading,
        isError,
    } = useQuery({
        queryKey: ['model-config'],
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
                        setIconUrls(prev => ({ ...prev, [modelName]: iconUrl }));
                    }
                }
            }
        };
        loadIcons();
    }, [modelConfig, modelType]);

    // Removed auto-selection of default model - user must manually select

    const handleModelSelect = (modelName) => {
        setModel(modelName);
        const isImageModel = modelType === 'image';
        const controlBits = {
            enhancePrompt: false,
            generateText: !isImageModel,
            generateImage: isImageModel,
            processContextAware: false
        };
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
        // Clear model selection when changing type - user must manually select
        setModel("");
        const isImageModel = type === 'image';
        const controlBits = {
            enhancePrompt: false,
            generateText: !isImageModel,
            generateImage: isImageModel,
            processContextAware: false
        };
        window.dispatchEvent(new CustomEvent('modelSelected', {
            detail: {
                model: "",
                type: type,
                controlBits
            }
        }));
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

    if (isError) {
        return <div className="p-4 text-red-500">Failed to load model configuration.</div>;
    }

    return (
        <div className="w-full flex flex-col bg-black rounded-lg shadow-sm">
            {/* Model Type Selection */}
            <div className="p-4 border-b border-gray-700">
                <div className="font-semibold mb-3 text-text_header text-sm flex items-center">
                    <span className="mr-2">🎯</span> MODEL TYPE
                </div>
                <div className="flex space-x-3">
                    {['text', 'image'].map(type => (
                        <button
                            key={type}
                            className={`px-4 py-2 rounded-md text-sm flex items-center space-x-2 transition-all duration-150 ${
                                modelType === type
                                    ? 'bg-like_color text-text_header font-medium transform scale-[1.02]'
                                    : 'text-text_header hover:bg-like_color hover:transform hover:scale-[1.02]'
                            }`}
                            onClick={() => handleTypeSelect(type)}
                        >
                            <span>{type === 'text' ? '✍️' : '🖼️'}</span>
                            <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                        </button>
                    ))}
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

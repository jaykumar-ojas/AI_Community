import React, { useContext, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ForumContext } from '../../ContextProvider/ModelContext';
// import Context from '../../ContextProvider/CommentModelContext';
import {CommentContext} from '../../ContextProvider/CommentModelContext';


function ModelItem({ name, displayName, iconUrl, emoji, active = false, onClick }) {
    const [imageError, setImageError] = useState(false);
    return (
        <li className="flex justify-center w-full ">
            <button
                title={displayName}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-150 cursor-pointer text-xl ${
                    active
                        ? 'bg-like_color text-text_header ring-2 ring-like_color scale-105'
                        : 'text-text_header hover:ring-2 hover:ring-like_color hover:scale-105'
                }`}
                onClick={() => onClick(name)}
            >
                {!imageError && iconUrl ? (
                    <img
                        src={iconUrl}
                        alt={displayName}
                        className="w-6 h-6 rounded-full object-cover"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <span>{emoji}</span>
                )}
            </button>
        </li>
    );
}


const fetchModelConfig = async () => {
    const res = await fetch("http://localhost:8099/models-info");
    if (!res.ok) throw new Error("Failed to fetch model config");
    const data = await res.json();
    if (!data.success) throw new Error("API returned unsuccessful response");
    return data.data;
};

const fetchIconUrl = async (modelName) => {
    const res = await fetch(`http://localhost:8099/aimodels/search?modelName=${encodeURIComponent(modelName)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.success ? data.data.iconUrl : null;
};

const ModelList = () => {
    const { model, setModel, modelType, setModelType } = useContext(CommentContext);
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

    // Auto-select default model if none selected
    useEffect(() => {
        const models = Object.keys(modelConfig[modelType] || {});
        if (!model && models.length > 0) {
            setModel(models[0]);
        }
    }, [model, modelConfig, modelType, setModel]);

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
        const defaultModel = Object.keys(modelConfig[type] || {})[0];
        if (defaultModel) {
            setModel(defaultModel);
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

    if (isError) {
        return <div className="p-4 text-red-500">Failed to load model configuration.</div>;
    }

    return (
        <div className="w-full flex flex-col-reverse rounded-lg shadow-sm">

            <div className="border-b border-gray-700">
                
                <div className="flex flex-col">
                    {['text', 'image'].map(type => (
                        <button
                            key={type}
                            className={`p-2 border-b text-xs flex flex-col items-center  transition-all duration-150 ${
                                modelType === type
                                    ? 'border-b-like_color text-text_header font-medium transform scale-[1.02]'
                                    : 'text-text_header hover:border-b-like_color hover:transform hover:scale-[1.02]'
                            }`}
                            onClick={() => handleTypeSelect(type)}
                        >
                            <span>{type === 'text' ? '✍️' : '🖼️'}</span>
                            <div className='text-xs'>{type.charAt(0).toUpperCase() + type.slice(1)}</div>
                            {/* <span></span> */}
                        </button>
                    ))}
                </div>
            </div>

            {/* AI Models Section */}
                <ul className="border flex flex-col-reverse rounded-full p-2 space-y-2">
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
    );
};

export default ModelList;

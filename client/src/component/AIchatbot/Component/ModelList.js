import React, { useContext } from 'react';
import { ForumContext } from '../../ContextProvider/ModelContext';

// Model configuration from llmConfig with emojis
const modelConfig = {
    text: {
        "gpt-4.1": {
            provider: "openai",
            displayName: "GPT-4.1",
            emoji: "🤖"
        },
        "gemini-2.0-flash": {
            provider: "google",
            displayName: "Gemini 2.0",
            emoji: "✨"
        },
        "claude-3-7-sonnet-20250219": {
            provider: "anthropic",
            displayName: "Claude 3",
            emoji: "🧠"
        },
        "llama-3.3-70b-versatile": {
            provider: "meta",
            displayName: "Llama 2",
            emoji: "🦙"
        },
        "grok-3-mini": {
            provider: "xai",
            displayName: "Grok 3",
            emoji: "🚀"
        },
        "deepseek-chat": {
            provider: "deepseek",
            displayName: "Deepseek Chat",
            emoji: "🔍"
        }
    },
    image: {
        "dall-e-2": {
            provider: "openai",
            displayName: "DALL-E 3",
            emoji: "🎨"
        },
        "stable-diffusion-xl": {
            provider: "stability",
            displayName: "Stable Diffusion XL",
            emoji: "🖼️"
        },
        "stable-diffusion-3-5": {
            provider: "stability",
            displayName: "Stable Diffusion 3.5",
            emoji: "🎯"
        },
        "imagen-3.0-generate-002": {
            provider: "google",
            displayName: "Imagen 3.0",
            emoji: "🌟"
        },
        "grok-2-image-1212": {
            provider: "xai",
            displayName: "Grok Image",
            emoji: "🌌"
        },
        "runway-sd": {
            provider: "runway",
            displayName: "Runway SD",
            emoji: "🎬"
        },
        "flux-schnell": {
            provider: "flux",
            displayName: "Flux Schnell",
            emoji: "⚡"
        }
    }
};

function ModelItem({ name, displayName, emoji, active = false, onClick }) {
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
                <span className="text-xl">{emoji}</span>
                <span>{displayName}</span>
            </button>
        </li>
    );
}

const ModelList = () => {
    const { model, setModel, modelType, setModelType } = useContext(ForumContext);

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
        const defaultModel = Object.keys(modelConfig[type])[0];
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
    };

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
                    {Object.entries(modelConfig[modelType]).map(([modelName, config]) => (
                        <ModelItem
                            key={modelName}
                            name={modelName}
                            displayName={config.displayName}
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


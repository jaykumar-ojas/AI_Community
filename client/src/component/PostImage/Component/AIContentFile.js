import React, { useContext, useRef, useState, useEffect } from "react";
import { PostContext } from "../PostContext";
const baseUrl = process.env.REACT_APP_BASE_URL;


const AIContentFile = () => {
    const { setPreviewUrl, setShowCropper, setFileType, setFile, aiPrompt, setAiPrompt, selectedImageModel, setSelectedImageModel, setAiMetadata } = useContext(PostContext);
    
    // const [aiPrompt, setAiPrompt] = useState("");
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [setEnhancedPrompt] = useState("");
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [availableModels, setAvailableModels] = useState({});
    const [isLoadingModels, setIsLoadingModels] = useState(false);
    const [modelIcons, setModelIcons] = useState({}); // { modelName: iconUrl }
    const { originalFileRef, setDesc } = useContext(PostContext);

    // Fetch available models from backend
    useEffect(() => {
        const fetchModels = async () => {
            try {
                setIsLoadingModels(true);
                const response = await fetch(`${baseUrl}/models-info`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        setAvailableModels(data.data);
                        // Removed auto-selection of default model - user must manually select
                    }
                }
            } catch (error) {
                console.error("Error fetching models:", error);
                // Fallback to basic models if API fails
                setAvailableModels({
                    image: {
                        "dall-e-3": { displayName: "DALL-E 3", emoji: "🎨", provider: "openai" }
                    }
                });
            } finally {
                setIsLoadingModels(false);
            }
        };

        fetchModels();
    }, []);

    // Fetch icon URLs for all image models
    useEffect(() => {
        const fetchModelIcons = async () => {
            const imageModels = availableModels.image || {};
            for (const [modelName] of Object.entries(imageModels)) {
                if (!modelIcons[modelName]) {
                    try {
                        const response = await fetch(`/aimodels/search?modelName=${encodeURIComponent(modelName)}`);
                        if (response.ok) {
                            const data = await response.json();
                            if (data.success && data.data.iconUrl) {
                                setModelIcons(prev => ({ ...prev, [modelName]: data.data.iconUrl }));
                            }
                        }
                    } catch (err) {
                        console.error(`Error fetching icon for ${modelName}:`, err);
                    }
                }
            }
        };
        
        if (Object.keys(availableModels.image || {}).length > 0) {
            fetchModelIcons();
        }
    }, [availableModels, modelIcons]);

    // Use backend models - no fallback to static config
    const imageModels = availableModels.image || {};

    const processFile = (uploadedFile) => {
        if (uploadedFile) {
            originalFileRef.current = uploadedFile;
            setFile(uploadedFile);

            // Determine file type
            const type = uploadedFile.type.split("/")[0];
            setFileType(type);

            // Create preview for images and videos
            if (type === "image" || type === "video") {
                const preview = URL.createObjectURL(uploadedFile);
                console.log("htis is my preview url for that",preview);
                setPreviewUrl(preview);

                // Show cropper for images only
                if (type === "image") {
                    setShowCropper(true);
                }
            } else if (type === "audio") {
                // For audio, use a generic audio icon as preview
                setPreviewUrl("/audio-icon.png"); // You'll need to add this image to your public folder
            } else {
                setPreviewUrl(null);
            }
        }
    };

   const enhancePrompt = async () => {
    if (!aiPrompt.trim()) {
        alert("Please enter a prompt first");
        return;
    }

    try {
        setIsEnhancing(true);
        const response = await fetch(`${baseUrl}/enhance-prompt`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ prompt: aiPrompt }),
        });

        if (!response.ok) {
            throw new Error("Server returned non-ok status: " + response.status);
        }

        const result = await response.json();
        console.log("Result from backend:", result);

        if (result.status === 200) {
            alert("i m generating very full");
        }

        if (result.enhancedPrompt) {
            // setEnhancedPrompt(result.enhancedPrompt);
            setAiPrompt(result.enhancedPrompt);
        } else {
            alert("No enhanced prompt returned.");
        }
    } catch (error) {
        console.error("Error enhancing prompt:", error);
        alert("Failed to enhance prompt. Please try again: " + error.message);
    } finally {
        setIsEnhancing(false);
    }
};


    const generateAIImage = async () => {
        if (!aiPrompt.trim()) {
            alert("Please enter a prompt for image generation");
            return;
        }
        if (!selectedImageModel) {
            alert("Please select an image model");
            return;
        }
        try {
            setIsGeneratingImage(true);
            console.log("Generating AI image with prompt:", aiPrompt, "model:", selectedImageModel);

            // Call /generate with model and prompt
            const response = await fetch(`${baseUrl}/generate`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({
                    prompt: aiPrompt,
                    model: selectedImageModel,
                    type: "image"
                }),
            });
            console.log("this is my response", response);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: "Unknown error occurred" }));
                throw new Error(errorData.error || `Server error: ${response.status}`);
            }
            
            const result = await response.json();
            console.log("AI Image generation response:", result);
            
            // Updated: Check for the correct response structure
            if (result.success && result.data && result.data.result && result.data.result.images) {
                // Handle different response structures
                let imageUrl;
                console.log("Processing images response:", result.data.result.images);
                
                if (Array.isArray(result.data.result.images)) {
                    // If images is an array (like Stability AI), take the first image
                    if (result.data.result.images.length > 0) {
                        const firstImage = result.data.result.images[0];
                        imageUrl = typeof firstImage === 'string' ? firstImage : firstImage.url;
                        console.log("Extracted image URL from array:", imageUrl);
                    } else {
                        throw new Error("No images generated");
                    }
                } else if (typeof result.data.result.images === 'string') {
                    // If images is a string (like OpenAI), use it directly
                    imageUrl = result.data.result.images;
                    console.log("Using direct image URL:", imageUrl);
                } else {
                    console.error("Unexpected images format:", typeof result.data.result.images, result.data.result.images);
                    throw new Error("Invalid image response format");
                }

                if (!imageUrl) {
                    throw new Error("No valid image URL found in response");
                }

                console.log("Final image URL for proxy:", imageUrl);
                const proxyUrl = `${baseUrl}/proxy-image?url=${encodeURIComponent(imageUrl)}`;
                console.log("proxy url",proxyUrl);
                
                const imageResponse = await fetch(proxyUrl);
                if (!imageResponse.ok) {
                    throw new Error("Failed to fetch the generated image");
                }
                
                const blob = await imageResponse.blob();
                const file = new File([blob], `ai-generated-${Date.now()}.png`, {
                    type: "image/png",
                    lastModified: Date.now(),
                });
                
                // Ensure the file has proper metadata
                console.log("Created file:", file);
                console.log("File size:", file.size);
                console.log("File type:", file.type);
                
                // Get model display name and provider info
                const modelConfig = imageModels[selectedImageModel];
                const modelDisplayName = modelConfig ? modelConfig.displayName : selectedImageModel;
                const provider = result.data.provider || 'Unknown';
                
                // Store AI metadata in context for later use
                const aiMetadata = {
                    model: selectedImageModel,
                    provider: provider,
                    prompt: aiPrompt,
                    displayName: modelDisplayName
                };
                
                // Store AI metadata in context
                if (setAiMetadata) {
                    setAiMetadata(aiMetadata);
                }
                
                processFile(file);
                setDesc((prevDesc) => {
                    const newDesc = prevDesc
                        ? `${prevDesc}\n\nAI Generated Image Prompt: ${aiPrompt}`
                        : `AI Generated Image Prompt: ${aiPrompt}`;
                    return newDesc;
                });
                setAiPrompt("");
            } else {
                throw new Error("Failed to generate image: Invalid response from server");
            }
        } catch (error) {
            console.error("Error generating AI image:", error);
            alert(`Failed to generate image: ${error.message}`);
        } finally {
            setIsGeneratingImage(false);
        }
    };

    return (
        <div className="p-6">
            <h3 className="text-xl text-text_header px-2 font-bold text-gray-800 mb-4 flex items-center gap-2">
                AI Image Generation
            </h3>
            {/* Image Model Selection */}
            <div className="mb-4">
                <div className="font-semibold text-text_header text-sm mb-2 flex items-center">
                    <span className="mr-2">🖼️</span> Select Image Model
                </div>
                {isLoadingModels ? (
                    <div className="flex items-center justify-center p-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-500 border-b-transparent"></div>
                        <span className="ml-2 text-text_header">Loading models...</span>
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {Object.entries(imageModels).map(([modelKey, config]) => (
                            <button
                                key={modelKey}
                                className={`px-3 py-2 rounded-md text-sm flex items-center space-x-2 transition-all duration-150 border border-gray-700 ${selectedImageModel === modelKey ? 'bg-like_color text-text_header font-bold scale-105' : 'text-text_header hover:bg-like_color hover:scale-105'}`}
                                onClick={() => setSelectedImageModel(modelKey)}
                                type="button"
                            >
                                {modelIcons[modelKey] ? (
                                    <img 
                                        src={modelIcons[modelKey]} 
                                        alt={config.displayName} 
                                        className="h-6 w-6 rounded-full object-cover"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'inline';
                                        }}
                                    />
                                ) : null}
                                <span style={{ display: modelIcons[modelKey] ? 'none' : 'inline' }}>{config.emoji}</span>
                                <span>{config.displayName}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
            <div className="flex flex-col gap-4">
                {/* Prompt Input + Enhance Button */}
                <div className="flex flex-col gap-3">
                    <textarea
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="Describe the image you want to create..."
                        className="flex-1 p-4 bg-bg_comment border border-gray-700 rounded-lg  focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none text-time_header text-sm"
                        rows="5"
                    />
                    <div className="flex flex-row gap-12 items-center justify-between">
                        <button
                            onClick={enhancePrompt}
                            disabled={isEnhancing || !aiPrompt.trim()}
                            className="h-full w-full  items-center justify-center px-4 py-2 bg-green-700 text-text_header text-sm font-semibold rounded-xl shadow-md hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isEnhancing ? (
                                <div className="flex items-center">
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-b-transparent mr-2"></div>
                                    Enhancing...
                                </div>
                            ) : (
                                <span>Enhance</span>
                            )}
                        </button>
                        <button
                            onClick={generateAIImage}
                            disabled={isGeneratingImage || !aiPrompt.trim()}
                            className="h-full w-full  items-center justify-center px-4 py-2 bg-like_color text-text_header text-sm font-semibold rounded-xl shadow-md hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isGeneratingImage ? (
                                <div className="flex items-center">
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-b-transparent mr-2"></div>
                                    Generating...
                                </div>
                            ) : (
                                <span>Generate</span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Generate Button */}
            </div>
        </div>
    );
};

export default AIContentFile;
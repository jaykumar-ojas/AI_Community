import React, { useContext, useRef, useState } from "react";
import { PostContext } from "../PostContext";

const AIContentFile = () => {
    const { setPreviewUrl, setShowCropper, setFileType, setFile,aiPrompt,setAiPrompt } =useContext(PostContext);
    
    // const [aiPrompt, setAiPrompt] = useState("");
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [setEnhancedPrompt] = useState("");
    const [isEnhancing, setIsEnhancing] = useState(false);
    const { originalFileRef, setDesc } = useContext(PostContext);

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
            const response = await fetch("http://localhost:8099/enhance-prompt", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({
                    prompt: aiPrompt,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to enhance prompt");
            }

            const result = await response.json();
            if (result.enhancedPrompt) {
                setEnhancedPrompt(result.enhancedPrompt);
                setAiPrompt(result.enhancedPrompt);
            }
        } catch (error) {
            console.error("Error enhancing prompt:", error);
            alert("Failed to enhance prompt. Please try again.");
        } finally {
            setIsEnhancing(false);
        }
    };

    const generateAIImage = async () => {
        if (!aiPrompt.trim()) {
            alert("Please enter a prompt for image generation");
            return;
        }

        try {
            setIsGeneratingImage(true);
            console.log("Generating AI image with prompt:", aiPrompt);

            const response = await fetch("http://localhost:8099/generate-image", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({
                    prompt: aiPrompt,
                }),
            });
            console.log("this is my response");

            if (!response.ok) {
                const errorData = await response
                    .json()
                    .catch(() => ({ error: "Unknown error occurred" }));
                throw new Error(errorData.error || `Server error: ${response.status}`);
            }

            const result = await response.json();
            console.log("AI Image generation response:", result);

            if (result.status === 200 && result.imageUrl) {
                // Use the proxy endpoint to fetch the image
                const proxyUrl = `http://localhost:8099/proxy-image?url=${encodeURIComponent(
                    result.imageUrl
                )}`;
                const imageResponse = await fetch(proxyUrl);

                if (!imageResponse.ok) {
                    throw new Error("Failed to fetch the generated image");
                }

                const blob = await imageResponse.blob();
                const file = new File([blob], `ai-generated-${Date.now()}.png`, {
                    type: "image/png",
                });

                // Process the file as if it was uploaded
                processFile(file);

                // Add the prompt to the description
                setDesc((prevDesc) => {
                    const newDesc = prevDesc
                        ? `${prevDesc}\n\nAI Generated Image Prompt: ${aiPrompt}`
                        : `AI Generated Image Prompt: ${aiPrompt}`;
                    return newDesc;
                });

                // Clear the prompt input
                setAiPrompt("");
            } else {
                throw new Error(
                    "Failed to generate image: Invalid response from server"
                );
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

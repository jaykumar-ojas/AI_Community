import React, { useContext, useState, useEffect, useRef } from "react";
import { PostContext } from "../PostContext";
import { ChevronDown } from "lucide-react";
import modelIcon from "../../../asset/IconImage/ModelIcon.png"
const baseUrl = process.env.REACT_APP_BASE_URL;

const AIContentFile = () => {
  const {
    setPreviewUrl,
    setShowCropper,
    setFileType,
    setFile,
    aiPrompt,
    setAiPrompt,
    selectedImageModel,
    setSelectedImageModel,
    setAiMetadata,
  } = useContext(PostContext);

  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [availableModels, setAvailableModels] = useState({});
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const { originalFileRef, setDesc } = useContext(PostContext);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

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
          }
        }
      } catch (error) {
        console.error("Error fetching models:", error);
        setAvailableModels({
          image: {
            "dall-e-3": {
              displayName: "DALL-E 3",
              emoji: "🎨",
              provider: "openai",
            },
          },
        });
      } finally {
        setIsLoadingModels(false);
      }
    };
    fetchModels();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const imageModels = availableModels.image || {};

  const handleSelectModel = (modelKey) => {
    setSelectedImageModel(modelKey);
    setIsDropdownOpen(false);
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt }),
      });
      const result = await response.json();
      if (result.enhancedPrompt) {
        setAiPrompt(result.enhancedPrompt);
      } else {
        alert("No enhanced prompt returned.");
      }
    } catch (error) {
      console.error("Error enhancing prompt:", error);
      alert("Failed to enhance prompt. " + error.message);
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
      const response = await fetch(`${baseUrl}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ prompt: aiPrompt, model: selectedImageModel, type: "image" }),
      });

      if (!response.ok) throw new Error("Failed to generate image");

      const result = await response.json();
      if (!(result.success && result.data?.result?.images)) {
        throw new Error("Invalid response format");
      }

      let imageUrl;
      const images = result.data.result.images;
      if (Array.isArray(images)) {
        imageUrl = typeof images[0] === "string" ? images[0] : images[0].url;
      } else if (typeof images === "string") {
        imageUrl = images;
      }

      if (!imageUrl) throw new Error("No image URL found");

      const proxyUrl = `${baseUrl}/proxy-image?url=${encodeURIComponent(imageUrl)}`;
      const imageResponse = await fetch(proxyUrl);
      const blob = await imageResponse.blob();
      const file = new File([blob], `ai-generated-${Date.now()}.png`, { type: "image/png" });

      const modelConfig = imageModels[selectedImageModel];
      const aiMetadata = {
        model: selectedImageModel,
        provider: result.data.provider || "Unknown",
        prompt: aiPrompt,
        displayName: modelConfig ? modelConfig.displayName : selectedImageModel,
      };
      if (setAiMetadata) setAiMetadata(aiMetadata);

      // Save file in context
      originalFileRef.current = file;
      setFile(file);
      setFileType("image");
      setPreviewUrl(URL.createObjectURL(file));
      setShowCropper(true);
      setDesc((prev) =>
        prev ? `${prev}\n\nAI Generated Image Prompt: ${aiPrompt}` : `AI Generated Image Prompt: ${aiPrompt}`
      );
      setAiPrompt("");
    } catch (error) {
      console.error("Error generating AI image:", error);
      alert("Failed to generate image: " + error.message);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  return (
    <div className="md:px-6">
      <div className="relative flex justify-between items-center mb-4" ref={dropdownRef}>
        {/* Title */}
        <div className="text-lg font-bold text-text_header">AI Image Generation</div>

        {/* Dropdown Button */}
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-2 border border-gray-300 bg-black px-3 py-1.5 rounded-lg shadow-sm hover:shadow-md transition-all"
        >
          {selectedImageModel ? (
            <>
              <span>{imageModels[selectedImageModel]?.emoji}</span>
              <span className="font-medium text-white">
                {imageModels[selectedImageModel]?.displayName}
              </span>
            </>
          ) : (
            <span className="text-gray-500"><img className="h-6 w-full object-cover rounded-full" src={modelIcon}/></span>
          )}
          <ChevronDown className={`h-4 w-4 text-gray-600 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
        </button>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute right-0 top-12 w-56 rounded-lg shadow-lg z-50">
            {isLoadingModels ? (
              <div className="flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-purple-500 border-b-transparent"></div>
                <span className="ml-2 text-sm">Loading...</span>
              </div>
            ) : (
              <div className="flex flex-col bg-black">
                {Object.entries(imageModels).map(([modelKey, config]) => (
                  <button
                    key={modelKey}
                    onClick={() => handleSelectModel(modelKey)}
                    className={`flex items-center gap-2 px-3 py-2 text-sm hover:bg-like_color ${
                      selectedImageModel === modelKey ? "bg-like_color text-white font-semibold" : "text-white"
                    }`}
                  >
                    <span>{config.emoji}</span>
                    <span>{config.displayName}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Prompt Input + Buttons */}
      <div className="flex flex-col gap-3">
        <textarea
          value={aiPrompt}
          onChange={(e) => setAiPrompt(e.target.value)}
          placeholder="Describe the image you want to create..."
          className="flex-1 p-4 bg-bg_comment border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none text-time_header text-sm"
          rows="5"
        />
        <div className="flex flex-row gap-4">
          <button
            onClick={enhancePrompt}
            disabled={isEnhancing || !aiPrompt.trim()}
            className="flex-1 px-4 py-2 bg-green-700 text-white text-sm font-semibold rounded-xl shadow-md transition-all disabled:opacity-70"
          >
            {isEnhancing ? "Enhancing..." : "Enhance"}
          </button>
          <button
            onClick={generateAIImage}
            disabled={isGeneratingImage || !aiPrompt.trim()}
            className="flex-1 px-4 py-2 bg-like_color text-white text-sm font-semibold rounded-xl shadow-md transition-all disabled:opacity-70"
          >
            {isGeneratingImage ? "Generating..." : "Generate"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIContentFile;

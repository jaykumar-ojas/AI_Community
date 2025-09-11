import React, { useContext, useState, useEffect, useRef } from "react";
import { PostContext } from "../PostContext";
import { ChevronDown } from "lucide-react";
import modelIcon from "../../../asset/IconImage/ModelIcon.png"
import { getAuthHeaders } from "../../AiForumPage/components/ForumUtils";
import { UseSetUserCredit } from "../../GlobalFunction/GlobalFunctionForResue";
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
  const [provider,setProvider] = useState("");
    const setUserCredit = UseSetUserCredit();
   

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

const fetchIconUrl = async (modelName) => {
  const res = await fetch(
    `${baseUrl}/aimodels/search?modelName=${encodeURIComponent(modelName)}`
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data.success ? data.data.iconUrl : null;
};


  // Fetch available models from backend
useEffect(() => {
  const fetchModels = async () => {
    try {
      setIsLoadingModels(true);
      const response = await fetch(`${baseUrl}/models-info`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const models = data.data.image || {};

          // fetch icons for each model
          const enrichedModels = {};
          for (const [key, config] of Object.entries(models)) {
            const iconUrl = await fetchIconUrl(key);
            enrichedModels[key] = {
              ...config,
              iconUrl: iconUrl || null, // fallback handled later
            };
          }

          setAvailableModels({ image: enrichedModels });
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
            iconUrl: null,
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

    // --- Call backend ---
    const response = await fetch(`${baseUrl}/generateContent`, {
      method: "POST",
      headers:getAuthHeaders(),
      body: JSON.stringify({
        prompt: aiPrompt,
        model: selectedImageModel,
        type: "image",
        provider: imageModels[selectedImageModel]?.provider,
      }),
    });

    if (!response.ok) throw new Error("Failed to generate image");
    const result = await response.json();
    console.log(result);

    setUserCredit(result?.credit);

    // --- Validate response ---
    const { imageData, imageUrl, provider } = result.data || {};
    if (!(result.success && (imageData || imageUrl))) {
      throw new Error("Invalid response format");
    }

    // --- Convert image data to File ---
    let file;
    if (imageData) {
      // Case 1: base64 → Blob
      const byteArray = Uint8Array.from(atob(imageData), (c) => c.charCodeAt(0));
      const blob = new Blob([byteArray], { type: "image/png" });
      file = new File([blob], `ai-generated-${Date.now()}.png`, { type: "image/png" });
    } else if (imageUrl) {
      // Case 2: fetch from URL → Blob
      const proxyUrl = `${baseUrl}/proxy-image?url=${encodeURIComponent(imageUrl)}`;
      const imgResponse = await fetch(proxyUrl);
      const blob = await imgResponse.blob();
      file = new File([blob], `ai-generated-${Date.now()}.png`, { type: "image/png" });
    }

    if (!file) throw new Error("No image file created");

    // --- Save metadata ---
    const modelConfig = imageModels[selectedImageModel];
    const aiMetadata = {
      model: selectedImageModel,
      provider: selectedImageModel || "Unknown",
      prompt: aiPrompt,
      displayName: selectedImageModel,
    };
    if (setAiMetadata) setAiMetadata(aiMetadata);

    // --- Update UI state ---
    originalFileRef.current = file;
    setFile(file);
    setFileType("image");
    setPreviewUrl(URL.createObjectURL(file));
    setShowCropper(true);
    setDesc((prev) =>
      prev
        ? `${prev}\n\nAI Generated Image Prompt: ${aiPrompt}`
        : `AI Generated Image Prompt: ${aiPrompt}`
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
        <div className="text-lg font-semibold text-gray-700 dark:text-text_header">AI Image Generation</div>

        {/* Dropdown Button */}
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-2 border border-gray-300 dark:bg-black bg-white px-3 py-1.5 rounded-lg shadow-sm hover:shadow-md transition-all"
        >
          {selectedImageModel ? (
            <>
              {imageModels[selectedImageModel]?.iconUrl ? (
                <img
                  src={imageModels[selectedImageModel].iconUrl}
                  alt={imageModels[selectedImageModel].displayName}
                  className="h-6 w-6 rounded-full object-cover"
                />
              ) : (
                <span>{imageModels[selectedImageModel]?.emoji || "🖼️"}</span>
              )}
              <span className="font-medium text-white">
                {imageModels[selectedImageModel]?.displayName}
              </span>
            </>
          ) : (
            <img
              className="h-6 w-6 object-cover rounded-full"
              src={modelIcon}
              alt="Default model"
            />
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
                    selectedImageModel === modelKey
                      ? "bg-like_color text-white font-semibold"
                      : "text-white"
                  }`}
                >
                  {config.iconUrl ? (
                    <img
                      src={config.iconUrl}
                      alt={config.displayName}
                      className="h-5 w-5 rounded-full object-cover"
                    />
                  ) : (
                    <span>{config.emoji}</span>
                  )}
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
          className="flex-1 p-4 bg-gray-200 dark:bg-bg_comment placeholder-gray-600 border border-gray-400 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:dark:ring-purple-400 focus:ring-ring-purple-400 resize-none text-gray-800 dark:text-time_header text-sm"
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
import React, { useContext, useState, useEffect, useRef } from "react";
import { PostContext } from "../PostContext";
import { ChevronDown } from "lucide-react";
import modelIcon from "../../../asset/IconImage/ModelIcon.png"
import { getAuthHeaders } from "../../AiForumPage/components/ForumUtils";
import { UseSetUserCredit } from "../../GlobalFunction/GlobalFunctionForResue";
import imageModelsConfig from "../../../config/imageModelsConfig";

import { useNotification } from "../../ContextProvider/NotificationContext";
import { LoginContext } from "../../ContextProvider/context";
import { ModelsContext } from "../ModelsContext";

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
  //const { availableModels, isLoadingModels } = useContext(ModelsContext);

  const { isGeneratingImage, setIsGeneratingImage } = useContext(PostContext);
  const [isEnhancing, setIsEnhancing] = useState(false);
  //  const [availableModels, setAvailableModels] = useState({});
  //  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const { availableModels, isLoadingModels } = useContext(ModelsContext);
  const { originalFileRef, setDesc } = useContext(PostContext);
  const [provider, setProvider] = useState("");
  const setUserCredit = UseSetUserCredit();
   
  // New state for aspect ratio
  const [selectedAspectRatio, setSelectedAspectRatio] = useState("");
  const [isAspectRatioDropdownOpen, setIsAspectRatioDropdownOpen] = useState(false);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const aspectRatioDropdownRef = useRef(null);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState('');

  const {showNotification} = useNotification();
  const {loginData} = useContext(LoginContext);


  // const fetchIconUrl = async (modelName) => {
  //   const res = await fetch(
  //     `${baseUrl}/aimodels/search?modelName=${encodeURIComponent(modelName)}`
  //   );
  //   if (!res.ok) return null;
  //   const data = await res.json();
  //   return data.success ? data.data.iconUrl : null;
  // };

  // //Fetch available models from backend
  // useEffect(() => {
  //   const fetchModels = async () => {
  //     try {
  //       setIsLoadingModels(true);
  //       const response = await fetch(`${baseUrl}/models-info`);
  //       if (response.ok) {
  //         const data = await response.json();
  //         if (data.success) {
  //           const models = data.data.image || {};
              
  //           // Merge with local config and fetch icons
  //           const enrichedModels = {};
  //           for (const [key, config] of Object.entries(models)) {
  //             const iconUrl = await fetchIconUrl(key);
  //             const localConfig = imageModelsConfig[key] || {};
              
  //             enrichedModels[key] = {
  //               ...config,
  //               ...localConfig, // Override with local config
  //               iconUrl: iconUrl || null,
  //             };
  //           }

  //           setAvailableModels({ image: enrichedModels });
  //         }
  //       }
  //     } catch (error) {
  //       console.error("Error fetching models:", error);
  //       // Fallback to local config
  //       setAvailableModels({
  //         image: imageModelsConfig,
  //       });
  //     } finally {
  //       setIsLoadingModels(false);
  //     }
  //   };
  //   fetchModels();
  // }, []);



  // Close dropdown when clicking outside
 
 

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (aspectRatioDropdownRef.current && !aspectRatioDropdownRef.current.contains(event.target)) {
        setIsAspectRatioDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const imageModels = availableModels.image || {};

  const handleSelectModel = (modelKey) => {
    setSelectedImageModel(modelKey);
    setIsDropdownOpen(false);
    
    // Reset aspect ratio when model changes
    setSelectedAspectRatio("");
    
    // Auto-select first aspect ratio if available
    const modelConfig = imageModels[modelKey];
    if (modelConfig?.aspectRatios && Array.isArray(modelConfig.aspectRatios) && modelConfig.aspectRatios.length > 0) {
      const firstRatio = modelConfig.aspectRatios[0];
      setSelectedAspectRatio(typeof firstRatio === 'object' ? firstRatio.value : firstRatio);
    }
  };

  const handleSelectAspectRatio = (ratio) => {
    setSelectedAspectRatio(ratio);
    setIsAspectRatioDropdownOpen(false);
  };

  // Get available aspect ratios for selected model
  const getAvailableAspectRatios = () => {
    if (!selectedImageModel || !imageModels[selectedImageModel]) return [];
    
    const modelConfig = imageModels[selectedImageModel];
    const ratios = modelConfig.aspectRatios;
    
    if (!ratios) return [];
    
    // Handle string type (like Flux models)
    if (typeof ratios === 'string') {
      return [{ label: ratios, value: 'auto' }];
    }
    
    // Handle array of objects (like DALL-E)
    if (Array.isArray(ratios) && ratios.length > 0 && typeof ratios[0] === 'object') {
      return ratios;
    }
    
    // Handle array of strings (like Stable Diffusion)
    if (Array.isArray(ratios)) {
      return ratios.map(ratio => ({ label: ratio, value: ratio }));
    }
    
    return [];
  };

  const enhancePrompt = async () => {
    if(!loginData){
      showNotification("please first login","info");
    }
    if (!aiPrompt.trim()) {
      showNotification("Oo.... i think you forget me to give a prompt","info");
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
  if(!loginData){
    showNotification("you are not logged in","info");
    return;
  }
  if (!aiPrompt.trim()) {
    showNotification("Please enter a prompt for image generation","generate a image");
    return;
  }
  if (!selectedImageModel) {
    showNotification("Please select an image model","info");
    return;
  }

  try {
    setIsGeneratingImage(true);

    const requestBody = {
      prompt: aiPrompt,
      model: selectedImageModel,
      type: "image",
      provider: imageModels[selectedImageModel]?.provider,
    };

    if (selectedAspectRatio && selectedAspectRatio !== 'auto') {
      requestBody.aspectRatio = selectedAspectRatio;
    }

    const response = await fetch(`${baseUrl}/generateContent`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(requestBody),
    });

    // If non-2xx, try to parse body for details and throw enriched error
    if (!response.ok) {
      let errBody = null;
      try { errBody = await response.json(); } catch (e) { /* ignore parse errors */ }
      const err = new Error(errBody?.message || `Failed to generate image (status ${response.status})`);
      err.status = response.status;
      err.body = errBody;
      throw err;
    }

    const result = await response.json();
    setUserCredit(result?.credit);

    // If backend reports failure, include its message/code
    if (!result.success) {
      const err = new Error(result.message || "Image generation failed");
      err.code = result.code || null;
      err.body = result;
      throw err;
    }

    const { imageData, imageUrl } = result.data || {};
    if (!(imageData || imageUrl)) {
      const err = new Error("Invalid response format");
      err.body = result;
      throw err;
    }

    let file;
    if (imageData) {
      const byteArray = Uint8Array.from(atob(imageData), (c) => c.charCodeAt(0));
      const blob = new Blob([byteArray], { type: "image/png" });
      file = new File([blob], `ai-generated-${Date.now()}.png`, { type: "image/png" });
    } else if (imageUrl) {
      const proxyUrl = `${baseUrl}/proxy-image?url=${encodeURIComponent(imageUrl)}`;
      const imgResponse = await fetch(proxyUrl);
      const blob = await imgResponse.blob();
      file = new File([blob], `ai-generated-${Date.now()}.png`, { type: "image/png" });
    }

    if (!file) throw new Error("No image file created");

    const modelConfig = imageModels[selectedImageModel];
    const aiMetadata = {
      model: selectedImageModel,
      provider: selectedImageModel || "Unknown",
      prompt: aiPrompt,
      displayName: selectedImageModel,
      aspectRatio: selectedAspectRatio,
    };
    if (setAiMetadata) setAiMetadata(aiMetadata);

    originalFileRef.current = file;
    setFile(file);
    setFileType("image");
    setPreviewUrl(URL.createObjectURL(file));

    setDesc((prev) =>
      prev
        ? `${prev}\n\n${aiPrompt}`
        : `${aiPrompt}`
    );
    setAiPrompt("");

    setTimeout(() => {
      setIsGeneratingImage(false);
      setTimeout(() => {
        setShowCropper(true);
      }, 300);
    }, 1000);

  } catch (error) {
    // Determine user-friendly message based on error details
    const msg = (error && error.message) ? error.message.toLowerCase() : "";

    if (!loginData || error.status === 401 || /unauthor|not\s+logged/i.test(msg)) {
      showNotification("you are not logged in","info");
    } else if (
      error.body?.code === 'INSUFFICIENT_CREDITS' ||
      /credit|insufficient/i.test(msg) ||
      (error.body && /credit|insufficient/i.test(JSON.stringify(error.body).toLowerCase()))
    ) {
      showNotification("Not enough credits","info");
    } else {
      // Keep your existing flagged-content fallback
      showNotification("This prompt may contain flagged content (e.g., personal names). Please revise the prompt or switch to a different model : " + (error.message || error));
    }

    setIsGeneratingImage(false);
  }
};

  const availableRatios = getAvailableAspectRatios();

  return (
    <>
      <div className="md:px-6">
        <div className="flex flex-col gap-4 mb-4">
          {/* Header Row */}
          <div className="flex justify-between items-center">
            <div className="text-lg font-semibold text-gray-700 dark:text-text_header">AI Image Generation</div>
          </div>

          {/* Model and Aspect Ratio Selection Row */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Model Dropdown */}
            <div className="relative flex-1" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full flex items-center justify-between gap-2 border border-gray-300 dark:bg-black bg-white px-3 py-2 rounded-lg shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-2">
                  {selectedImageModel ? (
                    <>
                      {imageModels[selectedImageModel]?.iconUrl ? (
                        <img
                          src={imageModels[selectedImageModel].iconUrl}
                          alt={imageModels[selectedImageModel].displayName}
                          className="h-5 w-5 rounded-full object-cover"
                        />
                      ) : (
                        <span>{imageModels[selectedImageModel]?.emoji || "🖼️"}</span>
                      )}
                      <span className="font-medium text-gray-700 dark:text-white text-sm">
                        {imageModels[selectedImageModel]?.displayName}
                      </span>
                    </>
                  ) : (
                    <>
                      <img
                        className="h-5 w-24 object-cover rounded-full"
                        src={modelIcon}
                        alt="Default model"
                      />
                      <span className="dark:text-gray-300 text-gray-800 text-sm">Select Model</span>
                    </>
                  )}
                </div>
                <ChevronDown className={`h-4 w-4 text-gray-600 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Model Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                  {isLoadingModels ? (
                    <div className="flex items-center justify-center p-4 bg-white dark:bg-black">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-purple-500 border-b-transparent"></div>
                      <span className="ml-2 text-sm">Loading...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-lg">
                      {Object.entries(imageModels).map(([modelKey, config]) => (
                        <button
                          key={modelKey}
                          onClick={() => handleSelectModel(modelKey)}
                          className={`flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-like_color first:rounded-t-lg last:rounded-b-lg ${
                            selectedImageModel === modelKey
                              ? "bg-gray-100 dark:bg-like_color text-gray-900 dark:text-white font-semibold"
                              : "text-gray-700 dark:text-white"
                          }`}
                        >
                          {config.iconUrl ? (
                            <img
                              src={config.iconUrl}
                              alt={config.displayName}
                              className="h-4 w-4 rounded-full object-cover"
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

            {/* Aspect Ratio Dropdown */}
            {selectedImageModel && availableRatios.length > 0 && (
              <div className="relative flex-1" ref={aspectRatioDropdownRef}>
                <button
                  onClick={() => setIsAspectRatioDropdownOpen(!isAspectRatioDropdownOpen)}
                  className="w-full flex items-center justify-between gap-2 border border-gray-300 dark:bg-black bg-white px-3 py-2 rounded-lg shadow-sm hover:shadow-md transition-all"
                >
                  <span className="font-medium text-gray-700 dark:text-white text-sm">
                    {selectedAspectRatio ? 
                      (availableRatios.find(r => r.value === selectedAspectRatio)?.label || selectedAspectRatio)
                      : "Select Ratio"
                    }
                  </span>
                  <ChevronDown className={`h-4 w-4 text-gray-600 transition-transform ${isAspectRatioDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {/* Aspect Ratio Dropdown Menu */}
                {isAspectRatioDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                    <div className="flex flex-col bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-lg">
                      {availableRatios.map((ratio, index) => (
                        <button
                          key={index}
                          onClick={() => handleSelectAspectRatio(ratio.value)}
                          className={`px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-like_color first:rounded-t-lg last:rounded-b-lg ${
                            selectedAspectRatio === ratio.value
                              ? "bg-gray-100 dark:bg-like_color text-gray-900 dark:text-white font-semibold"
                              : "text-gray-700 dark:text-white"
                          }`}
                        >
                          {ratio.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Prompt Input + Buttons */}
        <div className="flex flex-col gap-3">
          <textarea
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="Describe the image you want to create..."
            className="w-full p-4 bg-gray-200 dark:placeholder-gray-400 placeholder-gray-600 dark:bg-bg_comment border border-gray-300 dark:border-gray-700 rounded-lg  focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none text-gray-800 dark:text-gray-200 text-sm"
            rows="5"
          />
          <div className="flex flex-row gap-4">
            <button
              onClick={enhancePrompt}
              disabled={isEnhancing || !aiPrompt.trim()}
              className="flex-1 px-4 py-2 bg-green-700 text-white text-sm font-semibold rounded-xl shadow-md transition-all disabled:opacity-70"
            >
              {isEnhancing ? "Enhancing..." : "Enhance Prompt"}
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
    </>
  );
};

export default AIContentFile;
import React, { useContext, useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import modelIcon from "../../../asset/IconImage/ModelIcon.png";
import { getAuthHeaders } from "../../AiForumPage/components/ForumUtils";
import { UseSetUserCredit } from "../../GlobalFunction/GlobalFunctionForResue";
import { useNotification } from "../../ContextProvider/NotificationContext";
import { LoginContext } from "../../ContextProvider/context";
import { ModelsContext } from "../../PostImage/ModelsContext";
import { useParams } from "react-router-dom";

const baseUrl = process.env.REACT_APP_BASE_URL;

const ChallengePost = ({ onClose = () => {} }) => {
  const { id } = useParams();
  const [aiPrompt, setAiPrompt] = useState("");
  const [selectedImageModel, setSelectedImageModel] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [aiMetadata, setAiMetadata] = useState("");
  const [file, setFile] = useState();
  const [fileType, setFileType] = useState();
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const originalFileRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  const { availableModels, isLoadingModels } = useContext(ModelsContext);
  const setUserCredit = UseSetUserCredit();
  const [selectedAspectRatio, setSelectedAspectRatio] = useState("auto");

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const containerRef = useRef(null); // NEW: modal container ref for outside click detection
  const { showNotification } = useNotification();
  const { loginData } = useContext(LoginContext);

  const imageModels = availableModels.image || {};

  const handleSelectModel = (modelKey) => {
    setSelectedImageModel(modelKey);
    setIsDropdownOpen(false);
    setSelectedAspectRatio("");
    const modelConfig = imageModels[modelKey];
    if (
      modelConfig?.aspectRatios &&
      Array.isArray(modelConfig.aspectRatios) &&
      modelConfig.aspectRatios.length > 0
    ) {
      const firstRatio = modelConfig.aspectRatios[0];
      setSelectedAspectRatio(
        typeof firstRatio === "object" ? firstRatio.value : firstRatio
      );
    }
  };

  // ---------- Outside click & Escape key handling ----------
  useEffect(() => {
    const handleOutside = (e) => {
      // if click target is outside containerRef, call onClose
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        onClose();
      }
    };
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [onClose]);

  // ---------- generateAIImage (unchanged logic) ----------
  const generateAIImage = async () => {
    if (!loginData) {
      showNotification("you are not logged in", "info");
      return;
    }
    if (!aiPrompt.trim()) {
      showNotification(
        "Please enter a prompt for image generation",
        "generate a image"
      );
      return;
    }
    if (!selectedImageModel) {
      showNotification("Please select an image model", "info");
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

      if (selectedAspectRatio && selectedAspectRatio !== "auto") {
        requestBody.aspectRatio = selectedAspectRatio;
      }

      const response = await fetch(`${baseUrl}/generateContent`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        let errBody = null;
        try {
          errBody = await response.json();
        } catch (e) {}
        const err = new Error(
          errBody?.message ||
            `Failed to generate image (status ${response.status})`
        );
        err.status = response.status;
        err.body = errBody;
        throw err;
      }

      const result = await response.json();
      setUserCredit(result?.credit);

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

      let createdFile;
      if (imageData) {
        const byteArray = Uint8Array.from(atob(imageData), (c) =>
          c.charCodeAt(0)
        );
        const blob = new Blob([byteArray], { type: "image/png" });
        createdFile = new File([blob], `ai-generated-${Date.now()}.png`, {
          type: "image/png",
        });
      } else if (imageUrl) {
        const proxyUrl = `${baseUrl}/proxy-image?url=${encodeURIComponent(
          imageUrl
        )}`;
        const imgResponse = await fetch(proxyUrl);
        const blob = await imgResponse.blob();
        createdFile = new File([blob], `ai-generated-${Date.now()}.png`, {
          type: "image/png",
        });
      }

      if (!createdFile) throw new Error("No image file created");

      const meta = {
        model: selectedImageModel,
        provider: selectedImageModel || "Unknown",
        prompt: aiPrompt,
        displayName: selectedImageModel,
        aspectRatio: selectedAspectRatio,
      };
      if (setAiMetadata) setAiMetadata(meta);

      originalFileRef.current = createdFile;
      setFile(createdFile);
      setFileType("image");
      setPreviewUrl(URL.createObjectURL(createdFile));
      setAiPrompt("");

      setTimeout(() => {
        setIsGeneratingImage(false);
      }, 1000);
    } catch (error) {
      const msg = error && error.message ? error.message.toLowerCase() : "";

      if (
        !loginData ||
        error.status === 401 ||
        /unauthor|not\s+logged/i.test(msg)
      ) {
        showNotification("you are not logged in", "info");
      } else if (
        error.body?.code === "INSUFFICIENT_CREDITS" ||
        /credit|insufficient/i.test(msg) ||
        (error.body &&
          /credit|insufficient/i.test(JSON.stringify(error.body).toLowerCase()))
      ) {
        showNotification("Not enough credits", "info");
      } else {
        showNotification(
          "This prompt may contain flagged content (e.g., personal names). Please revise the prompt or switch to a different model : " +
            (error.message || error)
        );
      }

      setIsGeneratingImage(false);
    }
  };

  // ---------- handleSubmit (unchanged, except ensure it doesn't close modal automatically) ----------
  const handleSubmit = async (e) => {
    try {
      if (!loginData) {
        showNotification("User not logged in");
        return;
      }

      if (!file) {
        showNotification("Please add a description or upload a file", "error");
        return;
      }

      setIsUploading(true);
      let fileToUpload = file;

      const formData = new FormData();
      formData.append("file", fileToUpload);
      formData.append(
        "userId",
        loginData.validuserone?._id || loginData.validateUser?._id
      );
      formData.append("desc", aiPrompt);
      formData.append("challengeId", id);

      if (aiMetadata) {
        formData.append("aiModel", aiMetadata.model);
        formData.append("aiProvider", aiMetadata.provider);
        formData.append("aiPrompt", aiMetadata.prompt);
      }

      const data = await fetch(`${baseUrl}/upload-image-challenge`, {
        method: "POST",
        body: formData,
      });

      if (!data.ok) {
        const errorText = await data.text();
        console.error("Server error:", data.status, errorText);
        throw new Error(`Server error: ${data.status} - ${errorText}`);
      }

      const res = await data.json();

      if (res.status === 201) {
        setFile(null);
        setAiPrompt("");
        setPreviewUrl(null);
        setFileType(null);
        setAiMetadata(null);
        showNotification("Post uploaded successfully!", "success");
        // You may want to close modal on success:
        // onClose();
      } else {
        console.error("Upload failed:", res);
        showNotification(
          `Failed to upload post: ${res.error || "Unknown error"}`,
          "error"
        );
      }
    } catch (error) {
      console.error("Error during upload:", error);
      showNotification(
        `Upload error: ${error.message || "Unknown error occurred"}`,
        "error"
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex bg-black/80 items-start md:items-center justify-center p-4">
      <div
        ref={containerRef}
        className="w-full max-w-4xl bg-nav_hover rounded-xl shadow-2xl border-2 border-nav_hover3 overflow-auto relative"
        onClick={(e) => e.stopPropagation()} // prevent accidental outer handlers
      >
        {/* Close (X) */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 text-gray-300 bg-gray-800/50 hover:bg-gray-800 px-2 py-1 rounded"
        >
          ✕
        </button>

        <div className="p-4 md:p-6">
          {/* Top row: actions */}
          <div className="flex items-center justify-between mb-4 gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={handleSubmit}
                disabled={isUploading}
                className="px-4 py-2 rounded-md bg-green-500 text-black font-semibold disabled:opacity-60"
              >
                {isUploading ? "Posting..." : "Post"}
              </button>

              <button
                onClick={() => {
                  setPreviewUrl("");
                  setFile(null);
                  setAiMetadata(null);
                }}
                className="px-3 py-2 rounded-md bg-gray-700 text-gray-100"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Main content area: 50/50 on md+, stacked on small screens */}
          <div className="flex flex-col md:flex-row gap-4">
            {/* Left column: controls (50%) */}
            <div className="w-full md:w-1/2 flex flex-col gap-4">
              {/* model select dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen((s) => !s)}
                  className="w-full flex items-center justify-between gap-2 border border-gray-600 bg-bg_dark px-3 py-2 rounded-lg shadow-sm hover:shadow-md transition-all text-gray-100"
                  type="button"
                  aria-haspopup="listbox"
                  aria-expanded={isDropdownOpen}
                >
                  <div className="flex items-center gap-2">
                    {selectedImageModel ? (
                      <>
                        {imageModels[selectedImageModel]?.iconUrl ? (
                          <img
                            src={imageModels[selectedImageModel].iconUrl}
                            alt={
                              imageModels[selectedImageModel].displayName ||
                              "model"
                            }
                            className="h-5 w-5 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-sm">
                            {imageModels[selectedImageModel]?.emoji || "🖼️"}
                          </span>
                        )}
                        <span className="font-semibold text-sm">
                          {imageModels[selectedImageModel]?.displayName}
                        </span>
                      </>
                    ) : (
                      <>
                        <img
                          className="h-5 w-20 object-cover rounded-full"
                          src={modelIcon}
                          alt="Select model"
                        />
                        <span className="text-sm font-bold text-gray-100">
                          Select Model
                        </span>
                      </>
                    )}
                  </div>

                  <ChevronDown
                    className={`h-4 w-4 text-gray-300 transition-transform ${
                      isDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-2 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto bg-gray-900 border border-gray-700">
                    {isLoadingModels ? (
                      <div className="flex items-center justify-center p-4 text-gray-300">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-purple-500 border-b-transparent mr-2" />
                        Loading models...
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        {Object.entries(imageModels).map(([modelKey, config]) => (
                          <button
                            key={modelKey}
                            onClick={() => {
                              handleSelectModel(modelKey);
                              setIsDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 flex items-center gap-2 text-sm ${
                              selectedImageModel === modelKey
                                ? "bg-gray-800 text-white"
                                : "text-gray-200 hover:bg-gray-800"
                            }`}
                            type="button"
                          >
                            {config.iconUrl ? (
                              <img
                                src={config.iconUrl}
                                alt={config.displayName || modelKey}
                                className="h-5 w-5 rounded-full object-cover"
                              />
                            ) : (
                              <span>{config.emoji || "🧠"}</span>
                            )}
                            <span>{config.displayName || modelKey}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Prompt textarea */}
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Prompt..."
                rows={6}
                className="w-full p-3 rounded-lg bg-bg_dark border border-nav_hover3 text-low_text placeholder-gray-500 "
              />

              {/* Generate + Upload buttons */}
              <div className="flex gap-3">
                <button
                  onClick={generateAIImage}
                  disabled={isGeneratingImage || !aiPrompt.trim()}
                  className="flex-1 px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold disabled:opacity-60"
                >
                  {isGeneratingImage ? "Generating..." : "Generate"}
                </button>

                <label className="inline-flex items-center px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 cursor-pointer text-gray-200">
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={(e) => {
                      const f = e.target.files && e.target.files[0];
                      if (!f) return;
                      originalFileRef.current = f;
                      setFile(f);
                      setFileType(f.type?.split("/")[0] || "image");
                      setPreviewUrl(URL.createObjectURL(f));
                    }}
                    className="hidden"
                  />
                  Upload
                </label>
              </div>
            </div>

            {/* Right column: preview (50%) */}
            <div className="w-full md:w-1/2 border-2 border-dotted border-gray-700 rounded-lg flex items-center justify-center p-4 bg-bg_dark">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="preview"
                  className="max-h-80 w-full object-contain rounded-md"
                />
              ) : (
                <div className="text-center text-low_text">
                  <div className="mb-2">Image preview</div>
                  <div className="text-xs">No image yet — generate or upload one</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChallengePost;

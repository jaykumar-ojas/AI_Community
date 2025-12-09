import React, { useContext, useEffect, useRef, useState } from "react";
import axios from "axios";
import ShowGeneratedContent from "../../UserReply/Component/ShowGeneratedContent";
import { getAuthHeaders } from "../../AiForumPage/components/ForumUtils";
import { ChevronDown, Send } from "lucide-react";
import { fetchModelInfo } from "../../UserReply/Component/ReplyApi";
import { UseSetUserCredit } from "../../GlobalFunction/GlobalFunctionForResue";
import { CubeSpinner } from "../../ui/CubeSpinner";
import ErrorBar from "../../Card/ErrorBar";
import { useNotification } from "../../ContextProvider/NotificationContext";
import { LoginContext } from "../../ContextProvider/context";
import { ModelsContext } from "../../PostImage/ModelsContext";

const baseUrl = process.env.REACT_APP_BASE_URL;

/**
 * Props:
 * - onClose: function called when modal should close
 * - initialModel, initialProvider, initialModelType (optional)
 */
export default function ChallengeTextPost({
  onClose = () => {},
}) {
  const { loginData } = useContext(LoginContext);
  const { showNotification } = useNotification();
  const setUserCredit = UseSetUserCredit();

  const [postingData, setPostingData] = useState([]);
  const [newReply, setNewReply] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDropdownOpen,setIsDropdownOpen] = useState(false);
  const scrollContainerRef = useRef(null);
  const [selectedImageModel, setSelectedImageModel] = useState("");
  
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);

  const [model, setModel] = useState("");
  const [provider, setProvider] = useState("");
  const [modelType, setModelType] = useState("");

  const { availableModels, isLoadingModels } = useContext(ModelsContext);
  console.log(availableModels);

  const handleSelectModel = (modelKey) => {
    setSelectedImageModel(modelKey);
  };


  // Accessibility: close on ESC
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Click outside close handled by wrapper onClick -> onClose; stopPropagation on inner container

  // --- Streaming helper (unchanged behaviour, just kept compact) ---
  const handleStreamingText = async (prompt, modelName, providerName) => {
    try {
      const generatePayload = { model: modelName, prompt, type: "text", provider: providerName };
      const modelInfo = await fetchModelInfo(modelName);

      const response = await fetch(`${baseUrl}/generateContent/stream`, {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(generatePayload),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      let credit = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line) continue;
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === "chunk" && data.content) {
                fullText += data.content;

                setPostingData((prev) => {
                  const next = [...prev];
                  for (let i = next.length - 1; i >= 0; i--) {
                    if (next[i].isLoading && next[i].loadingType === "text") {
                      next[i] = { ...next[i], aiText: fullText };
                      break;
                    }
                  }
                  return next;
                });

                if (scrollContainerRef?.current) {
                  scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
                }
              } else if (data.type === "complete") {
                credit = data.credit ?? credit;
              } else if (data.type === "error") {
                throw new Error(data.error || "Generation error");
              }
            } catch (e) {
              console.error("Error parsing SSE data:", e);
            }
          }
        }
      }

      setPostingData((prev) => {
        const next = [...prev];
        for (let i = next.length - 1; i >= 0; i--) {
          if (next[i].isLoading && next[i].loadingType === "text") {
            next[i] = { ...next[i], isLoading: false, modelInfo };
            break;
          }
        }
        return next;
      });

      if (credit !== null) setUserCredit(credit);
    } catch (err) {
      console.error("Streaming error:", err);
      throw err;
    }
  };

  const handleGenerateSubmit = async (e, useEnhancedPrompt = null, useOriginalText = null) => {
    if (e) e.preventDefault();

    if (!loginData) {
      showNotification("Please login to generate content", "warning");
      return;
    }

    const promptToUse = useEnhancedPrompt ?? newReply.trim();
    const textToRender = useOriginalText ?? newReply.trim();
    if (!promptToUse) return;

    setLoading(true);
    setError("");

    const loadingType = modelType === "image" ? "image" : "text";

    setPostingData((prev) => [
      ...prev,
      {
        userText: textToRender,
        aiText: "",
        prompt: promptToUse,
        imageUrl: "",
        isLoading: true,
        loadingType,
        model,
      },
    ]);

    try {
      if (modelType === "text") {
        await handleStreamingText(promptToUse, model, provider);
      } else {
        const generatePayload = { model, prompt: promptToUse, type: modelType, provider };
        const response = await axios.post(`${baseUrl}/generateContent`, generatePayload, {
          headers: getAuthHeaders(),
        });

        if (response.data?.success) {
          const modelInfo = await fetchModelInfo(model);

          setPostingData((prev) => {
            const next = [...prev];
            for (let i = next.length - 1; i >= 0; i--) {
              if (next[i].isLoading) {
                const data = response.data.data;
                const updated = { ...next[i], isLoading: false, modelInfo };
                if (data?.imageUrl) updated.imageUrl = data.imageUrl;
                next[i] = updated;
                break;
              }
            }
            return next;
          });

          setUserCredit(response?.data?.credit ?? null);
        } else {
          setError("Failed to generate content");
          setPostingData((prev) => prev.filter((item) => !item.isLoading));
        }
      }

      setNewReply("");
      setModel(null);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "An error occurred while generating content");
      setPostingData((prev) => prev.filter((item) => !item.isLoading));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!newReply.trim()) return;

    setIsLoading(true);
    try {
      setPostingData((prev) => [
        ...prev,
        { userText: newReply.trim(), aiText: "", prompt: "", imageUrl: "", isLoading: false, loadingType: "user" },
      ]);
      setNewReply("");
    } catch (err) {
      console.error(err);
      setError("Failed to post message");
    } finally {
      setIsLoading(false);
    }
  };

  // small helpers
  const charCount = newReply.length;
  const isGenerateDisabled = loading || !newReply.trim();
  const imageModels = availableModels.text || {};

  return (
    <div
      aria-modal="true"
      role="dialog"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        ref={containerRef}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl bg-white/80 dark:bg-nav_hover border border-gray-200 dark:border-nav_hover3 shadow-2xl transform transition-all duration-200 ease-out"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b dark:border-nav_hover3">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Generate Content</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              aria-label="Close"
              className="rounded-md px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm shadow-sm"
            >
              Close
            </button>
          </div>
        </div>

        {/* Body: responsive 2-column (stacks on small screens) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5">

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
            
          {/* Left: prompt */}
          <div className="flex flex-col gap-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Your prompt</label>

            <textarea
              value={newReply}
              onChange={(e) => setNewReply(e.target.value)}
              placeholder="Type your prompt here..."
              disabled={isLoading || loading}
              className="min-h-[180px] resize-none rounded-lg border border-gray-200 dark:border-nav_hover3 bg-white/90 dark:bg-nav_hover2 p-3 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-theme_color transition"
            />

            <div className="flex items-center justify-between gap-3">
              <div className="text-xs text-gray-500">{charCount} characters</div>

              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => handleGenerateSubmit(e)}
                  disabled={isGenerateDisabled}
                  className="inline-flex items-center gap-2 rounded-md px-4 py-2 bg-theme_color text-white font-semibold shadow hover:brightness-95 disabled:opacity-60"
                >
                  {loading ? <CubeSpinner size="w-5 h-5" /> : "Generate"}
                </button>
              </div>
            </div>

          </div>

          {/* Right: generated content */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Generated / Posted</h4>
              <div className="text-xs text-gray-500">Live updates</div>
            </div>

            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto space-y-3 rounded-lg border p-3 bg-white/70 dark:bg-bg_dark dark:border-nav_hover3"
              style={{ minHeight: 180 }}
            >
              {error && <ErrorBar message={error} onClose={() => setError("")} />}

              <ShowGeneratedContent postingData={postingData} scrollContainerRef={scrollContainerRef} />
            </div>
          </div>
        </div>

        {/* Footer (optional small help text) */}
        <div className="px-5 py-3 border-t text-xs text-gray-500 flex justify-end dark:text-gray-400 dark:border-nav_hover3">
          <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading || loading || !newReply.trim()}
                  className="flex items-center gap-2 rounded-full px-3 py-1.5 bg-gray-100 dark:bg-nav_hover3 hover:bg-gray-200 dark:hover:bg-nav_hover4 text-sm"
                >
                  {isLoading ? "Posting..." : <Send size={16} className="rotate-45" />}
                </button>

        </div>
      </div>
    </div>
  );
}

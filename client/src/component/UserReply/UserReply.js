import React, { useContext, useEffect, useRef, useState } from "react";
import { ForumContext } from "../ContextProvider/ModelContext";
import UserAndModel from "./Component/UserAndModel";
import ShowSelectedFile from "./Component/ShowSelectedFiie";
import { AttachIcon, SparklesIcon } from "../../asset/icons";
import axios from "axios";
import ShowGeneratedContent from "./Component/ShowGeneratedContent";
import { LoginContext } from "../ContextProvider/context";
import { useParams } from "react-router-dom";
import {
  REPLIES_URL,
  getAuthHeaders,
  handleAuthError,
} from "../AiForumPage/components/ForumUtils";
import { useWebSocket } from "../AiForumPage/components/WebSocketContext";
import { ChevronDown, Send, Brain } from "lucide-react";
import modelIcon from "../../asset/IconImage/ModelIcon.png";
import ModelList from "../AIchatbot/Component/ModelList";
import { CommentContext } from "../ContextProvider/CommentModelContext";
import {
  fetchModelInfo,
  describeImagesInBackground,
} from "./Component/ReplyApi";
import { UseSetUserCredit } from "../GlobalFunction/GlobalFunctionForResue";
import { CubeSpinner } from "../ui/CubeSpinner";
import ErrorBar from "../Card/ErrorBar";
import { useNotification } from "../ContextProvider/NotificationContext";
import { decodeId } from "../../utils/hashids";

const baseUrl = process.env.REACT_APP_BASE_URL;

const CONTEXT_MESSAGES = [
  "Contexting your response…",
  "Analyzing thread…",
  "Shaping your answer…",
  "Reading between the lines…",
  "Understanding the conversation…",
  "Crafting contextual insights…",
  "Processing discussion flow…",
  "Weaving context magic…",
];

const UserReply = ({ forum = false, openCommunityModal, standalone = false, onShareRequest }) => {
  const { showNotification } = useNotification();
  const { loginData } = useContext(LoginContext);
  const { emitNewReply, emitNewComment } = useWebSocket();
  const params = useParams();

  const dynamicId = forum ? params.topicId : params.id;
  const dynamicId1 = forum ? decodeId(params.topicId) : params.id;

  // Use different localStorage key for standalone mode
  const localStorageKey = standalone
    ? 'userReplyData_standalone'
    : `userReplyData_${forum ? dynamicId1 : dynamicId}`;

  const forumContext = useContext(ForumContext);
  const commentContext = useContext(CommentContext);
  const setUserCredit = UseSetUserCredit();

  const {
    replyIdForContext,
    model,
    modelType,
    provider,
    setModel,
    setModelType,
    setProvider,
  } = forum ? forumContext : commentContext;

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [postingData, setPostingData] = useState([]);
  const [newReply, setNewReply] = useState("");
  const [conversationHistory, setConversationHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState();
  const [loading, setLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [postedReplies, setPostedReplies] = useState([]);
  const [isContextAware, setIsContextAware] = useState(false);
  const [contextLoading, setContextLoading] = useState(false);
  const [contextMessage, setContextMessage] = useState("");
  const [messageIndex, setMessageIndex] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const scrollContainerRef = useRef(null);
  // In standalone mode, no community is selected initially
  const communitySelected = standalone ? true : (forum ? params.topicId : params.id);

  // Rotating context messages
  useEffect(() => {
    let interval;
    if (contextLoading) {
      interval = setInterval(() => {
        setMessageIndex((prev) => (prev + 1) % CONTEXT_MESSAGES.length);
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [contextLoading]);

  useEffect(() => {
    if (contextLoading) {
      setContextMessage(CONTEXT_MESSAGES[messageIndex]);
    }
  }, [messageIndex, contextLoading]);

  // Conversation builder
  const buildConversationPrompt = (history, newPrompt) => {
    let historyString = history
      .map(
        (msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`
      )
      .join("\n");
    return `You are an AI assistant. Below is the conversation so far:\n\n${historyString}\n\nThe user now says:\n"${newPrompt}"\n\nPlease respond helpfully as the assistant:\nAssistant:`;
  };

  useEffect(() => {
    const newHistory = [];
    postingData.forEach((item) => {
      if (item.userText) {
        newHistory.push({ role: "user", content: item.userText });
      }
      if (item.aiText) {
        newHistory.push({ role: "assistant", content: item.aiText });
      }
    });
    setConversationHistory(newHistory);
  }, [postingData]);

  // ✅ Load data from localStorage ON MOUNT
  useEffect(() => {
    const savedData = localStorage.getItem(localStorageKey);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);

        // Restore all states
        setNewReply(parsed.newReply || "");
        setSelectedFiles(parsed.selectedFiles || []);
        setModel(parsed.model || "");
        setModelType(parsed.modelType || "text");
        setProvider(parsed.provider || "");
        setConversationHistory(parsed.conversationHistory || []);
        setIsContextAware(parsed.isContextAware || false);
        setLoading(parsed.loading || false);
        setContextLoading(parsed.contextLoading || false);

        // ✅ FIXED: Restore postingData with proper image URLs
        const restoredPostingData = (parsed.postingData || []).map(item => {
          if (item.imageBlob && !item.imageUrl) {
            // Recreate blob URL from base64 data
            const binary = atob(item.imageBlob);
            const bytes = new Uint8Array(binary.length);
            for (let j = 0; j < binary.length; j++) {
              bytes[j] = binary.charCodeAt(j);
            }
            const blob = new Blob([bytes], { type: "image/png" });
            return {
              ...item,
              imageUrl: URL.createObjectURL(blob)
            };
          }
          return item;
        });

        setPostingData(restoredPostingData);

      } catch (err) {
        console.error("Failed to parse saved UserReply data", err);
      }
    }
    setIsInitialized(true);
  }, [localStorageKey, setModel, setModelType, setProvider]);

  // ✅ Save data to localStorage (debounced) - ONLY AFTER INITIALIZATION
  useEffect(() => {
    if (!isInitialized) return;

    const timeout = setTimeout(() => {
      const dataToSave = {
        newReply,
        postingData,
        selectedFiles,
        model,
        modelType,
        provider,
        conversationHistory,
        isContextAware,
        loading,
        contextLoading,
      };
      localStorage.setItem(localStorageKey, JSON.stringify(dataToSave));
    }, 500);
    return () => clearTimeout(timeout);
  }, [
    newReply,
    postingData,
    selectedFiles,
    model,
    modelType,
    provider,
    conversationHistory,
    isContextAware,
    loading,
    contextLoading,
    localStorageKey,
    isInitialized,
  ]);

  // ✅ Save immediately on unmount (navigation away)
  useEffect(() => {
    return () => {
      const dataToSave = {
        newReply,
        postingData,
        selectedFiles,
        model,
        modelType,
        provider,
        conversationHistory,
        isContextAware,
        loading,
        contextLoading,
      };
      localStorage.setItem(localStorageKey, JSON.stringify(dataToSave));
    };
  }, [
    newReply,
    postingData,
    selectedFiles,
    model,
    modelType,
    provider,
    conversationHistory,
    isContextAware,
    loading,
    contextLoading,
    localStorageKey,
  ]);

  // File handler
  const handleFileSelect = (e) => {
    setSelectedFiles(Array.from(e.target.files));
  };

  // Background describe images
  useEffect(() => {
    postedReplies.forEach(({ replyId, postingData, processed }) => {
      if (!processed) {
        setPostedReplies((prev) =>
          prev.map((item) =>
            item.replyId === replyId ? { ...item, processed: true } : item
          )
        );
        describeImagesInBackground(replyId, postingData, selectedFiles);
      }
    });
  }, [postedReplies]);

  // Generate content (now with streaming support for text)
  const handleGenerateSubmit = async (
    e,
    useEnhancedPrompt = null,
    useOriginalText = null
  ) => {
    if (!loginData) {
      showNotification("user not Login", "warning");
      return;
    }
    if (e) e.preventDefault();

    const promptToUse = useEnhancedPrompt || newReply.trim();
    const textToRender = useOriginalText || newReply.trim();

    if (!promptToUse) return;

    setLoading(true);
    setError(null);

    const loadingType = modelType === "image" ? "image" : "text";
    setPostingData((prev) => [
      ...prev,
      {
        userText: textToRender,
        aiText: "",
        prompt: "",
        imageUrl: "",
        isLoading: true,
        loadingType,
        model,
      },
    ]);

    try {
      const conversationPrompt =
        conversationHistory.length > 0
          ? buildConversationPrompt(conversationHistory, promptToUse)
          : promptToUse;

      // ✅ Use streaming for text generation
      if (modelType === "text") {
        await handleStreamingText(conversationPrompt, model, provider);
      } else {
        // Non-streaming for images
        const generatePayload = {
          model,
          prompt: conversationPrompt,
          type: modelType,
          provider,
        };

        const response = await axios.post(
          `${baseUrl}/generateContent`,
          generatePayload,
          {
            headers: getAuthHeaders(),
          }
        );

        if (response.data.success) {
          const modelInfo = await fetchModelInfo(model);

          setPostingData((prev) => {
            const next = [...prev];
            for (let i = next.length - 1; i >= 0; i--) {
              if (next[i].isLoading) {
                const data = response.data.data;
                const updated = { ...next[i], isLoading: false, modelInfo };
                if (data?.imageData) {
                  const binary = atob(data.imageData);
                  const bytes = new Uint8Array(binary.length);
                  for (let j = 0; j < binary.length; j++)
                    bytes[j] = binary.charCodeAt(j);
                  const blob = new Blob([bytes], { type: "image/png" });
                  updated.imageUrl = URL.createObjectURL(blob);
                  updated.imageBlob = data.imageData;
                } else if (data?.imageUrl) {
                  updated.imageUrl = data.imageUrl;
                }
                next[i] = updated;
                break;
              }
            }
            return next;
          });

          setUserCredit(response?.data?.credit);
        } else {
          setError("Failed to generate content");
          setPostingData((prev) => prev.filter(item => !item.isLoading));
        }
      }

      setNewReply("");
      setModel?.(null);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        "An error occurred while generating content"
      );
      setPostingData((prev) => prev.filter(item => !item.isLoading));
    } finally {
      setLoading(false);
    }
  };

  // ✅ New streaming function for text
  const handleStreamingText = async (prompt, model, provider) => {
    try {
      const generatePayload = {
        model,
        prompt,
        type: "text",
        provider,
      };

      const modelInfo = await fetchModelInfo(model);

      const response = await fetch(`${baseUrl}/generateContent/stream`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
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
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === 'chunk' && data.content) {
                fullText += data.content;

                // Update the latest posting data item
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

                // Immediately trigger scroll after state update
                setTimeout(() => {
                  if (scrollContainerRef?.current) {
                    scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
                  }
                }, 0);
              } else if (data.type === 'complete') {
                credit = data.credit;
              } else if (data.type === 'error') {
                throw new Error(data.error);
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }

      // Mark as complete
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

      if (credit !== null) {
        setUserCredit(credit);
      }
    } catch (err) {
      console.error('Streaming error:', err);
      throw err;
    }
  };

  // Context aware generate
  const handleContextAwareGenerate = async () => {
    if (!newReply.trim()) return;
    setContextLoading(true);
    setError(null);
    setMessageIndex(0);

    try {
      const suggestResponse = await axios.post(
        `${baseUrl}/suggest/${replyIdForContext || dynamicId1}`,
        {
          newPrompt: newReply.trim(),
          contextType: forum ? "forumReply" : "comment",
          options: { temperature: 0.7, maxTokens: 1000 },
        },
        { headers: getAuthHeaders() }
      );

      if (suggestResponse.data.success) {
        const enhancedPrompt = suggestResponse.data.finalprompt;
        const originalUserText = newReply.trim();
        setContextLoading(false);
        await handleGenerateSubmit(null, enhancedPrompt, originalUserText);
      } else {
        setError("Failed to generate context-aware suggestion");
        setContextLoading(false);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        "An error occurred while generating context-aware content"
      );
      setContextLoading(false);
    }
  };

  const handleGenerateClick = (e) => {
    if (isContextAware) {
      handleContextAwareGenerate();
    } else {
      handleGenerateSubmit(e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newReply.trim() && postingData.length === 0) return;
    setIsLoading(true);
    setError(null);

    let updatedPostingData = [...postingData];
    if (newReply.trim()) {
      updatedPostingData.push({
        userText: newReply.trim(),
        aiText: "",
        prompt: "",
        imageUrl: "",
      });
    }

    try {
      const formData = new FormData();
      formData.append("content", JSON.stringify(updatedPostingData));
      formData.append("dynamicId", dynamicId);
      formData.append("userId", loginData.validuserone._id);
      formData.append("userName", loginData.validuserone.userName);
      if (replyIdForContext) {
        formData.append("parentReplyId", replyIdForContext);
      }
      selectedFiles.forEach((file) => formData.append("media", file));
      const url = forum ? REPLIES_URL : `${baseUrl}/comments/post`;

      const response = await axios.post(url, formData, {
        headers: { ...getAuthHeaders(), "Content-Type": "multipart/form-data" },
      });

      if (response.status === 201) {
        const idKey = forum ? "topicId" : "postId";
        const newReplyData = {
          ...response.data.reply,
          [idKey]: dynamicId,
          userName: loginData.validuserone.userName,
          userId: loginData.validuserone._id,
        };
        forum ? emitNewReply(newReplyData) : emitNewComment(newReplyData);

        const replyId = response.data.reply._id || response.data.reply.id;
        if (replyId) {
          const combinedPostingData = [
            ...updatedPostingData,
            ...selectedFiles.map((file) => ({
              imageUrl: {
                fileUrl: URL.createObjectURL(file),
                fileName: file.name,
              },
            })),
          ];
          setPostedReplies((prev) => [
            ...prev,
            { replyId, postingData: combinedPostingData, processed: false },
          ]);
        }

        setNewReply("");
        setSelectedFiles([]);
        setPostingData([]);
        setConversationHistory([]);

        localStorage.removeItem(localStorageKey);
      }
    } catch (err) {
      if (handleAuthError(err, setError)) return;
      setError("Failed to post reply. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle share request in standalone mode
  const handleShareClick = () => {
    if (onShareRequest) {
      let updatedPostingData = [...postingData];
      if (newReply.trim()) {
        updatedPostingData.push({
          userText: newReply.trim(),
          aiText: "",
          prompt: "",
          imageUrl: "",
        });
      }
      onShareRequest(updatedPostingData, selectedFiles);
    }
  };

  const clearConversationHistory = () => {
    setConversationHistory([]);
    setPostingData([]);
  };

  return (
    <div className="relative bottom-0 left-0 right-0 border border-gray-500 dark:border-gray-900 rounded-md  dark:bg-nav_hover2  bg-transparent  z-40">
      {error && <ErrorBar message={error} onClose={() => setError("")} />}

      <div
        ref={scrollContainerRef}
        className="max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-100 dark:scrollbar-thumb-gray-500 scrollbar-track-bg-red-100 dark:scrollbar-track-bg_comment_box"
      >
        <ShowGeneratedContent postingData={postingData} scrollContainerRef={scrollContainerRef} />
      </div>

      <UserAndModel forum={forum} />

      <form>
        <div className="flex md:my-1">
          <textarea
            className="flex-1 px-2 text-gray-900 dark:text-low_text font-poppins text-[13px] bg-transparent focus:outline-none focus:ring-0 rounded-md overflow-y-auto break-words"
            placeholder={
              standalone
                ? "Chat with AI models..."
                : communitySelected
                  ? "Write your reply..."
                  : "Join a community to chat with AI models"
            }
            value={newReply}
            onChange={(e) => {
              if (!standalone && !communitySelected) {
                openCommunityModal();   // 🚀 triggers modal
                return;                 // ❌ stop typing
              }
              setNewReply(e.target.value);
            }}
            onClick={() => {
              if (!standalone && !communitySelected) {
                openCommunityModal();   // 🚀 if they click, show modal
              }
            }}
            disabled={isLoading || loading || contextLoading}
          />

        </div>

        <div className="flex justify-between items-center">
          {/* Left controls */}
          <div className="flex items-center gap-2 px-1">
            <label className="dark:text-low_text text-gray-600 hover:text-gray-700 cursor-pointer text-xs md:text-sm flex items-center">
              <input
                type="file"
                multiple
                accept="image/*,video/*,audio/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isLoading}
              />
              <AttachIcon />
            </label>

            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 border dark:border-low_text border-gray-800 px-2 py-1 rounded-lg shadow-sm hover:shadow-md transition-all"
            >
              {model ? (
                <span className="font-medium sm:text-xs text-[8px] text-gray-900 dark:text-theme_color2 line-clamp-1">
                  {model}
                </span>
              ) : (
                <span className="text-gray-500">
                  <img
                    className="sm:h-5 h-3 w-full object-cover  rounded-full"
                    src={modelIcon}
                    alt="model"
                  />
                </span>
              )}
              <ChevronDown
                className={`sm:h-4 sm:w-4 h-3 w-3 text-gray-800 dark:text-low_text transition-transform ${isDropdownOpen ? "rotate-180" : ""
                  }`}
              />
            </button>
            {isDropdownOpen && (
              <ModelList
                userForum={forum}
                userComment={!forum}
                closeDropdown={() => setIsDropdownOpen(false)}
              />
            )}

            {/* Cool Context Aware Toggle */}
            {!contextLoading && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsContextAware(!isContextAware)}
                  className={`
                  relative inline-flex sm:h-6 h-4 sm:w-11 w-8 items-center rounded-full transition-colors duration-400 ease-in-out 
                  ${isContextAware
                      ? "bg-gradient-to-r from-theme_color to-pink-600"
                      : "bg-gray-300 dark:bg-nav_hover"
                    }
                `}
                  disabled={contextLoading}
                >
                  <span
                    className={`
                    inline-block sm:h-4  sm:w-4 h-3 w-3 transform rounded-full bg-low_text transition-transform duration-200 ease-in-out shadow-lg
                    ${isContextAware
                        ? "sm:translate-x-6 translate-x-4"
                        : "translate-x-1"
                      }
                  `}
                  >
                    {isContextAware && (
                      <Brain className="h-3 w-3 text-theme_color absolute top-0 left-0 sm:top-0.5 sm:left-0.5" />
                    )}
                  </span>
                </button>
                <div className="mb-1 sm:mb-0">
                  <span
                    className={`sm:text-sm text-[9px]  font-medium transition-colors  ${isContextAware
                      ? "text-theme_color"
                      : "text-gray-800 dark:text-gray-200"
                      }`}
                  >
                    Context Engine
                  </span>
                  <span className={` sm:text-xs text-[8px]  font-bold ${isContextAware ? "bg-clip-text bg-gradient-to-r mt-2 from-theme_color2  to-pink-500 text-transparent " : "text-low_text"}`}>
                    (beta)
                  </span>
                </div>
              </div>
            )}

            {/* Context Loading Message */}
            {contextLoading && (
              <div className="flex items-center gap-2 bg-gradient-to-r from-theme_color3 to-pink-600 px-3 py-1 rounded-full border border-theme_color">
                <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="sm:text-xs text-[8px]   text-black font-medium animate-pulse line-clamp-1">
                  {contextMessage}
                </span>
              </div>
            )}

            {conversationHistory.length > 0 && (
              <button
                type="button"
                onClick={clearConversationHistory}
                className="sm:text-xs text-[8px] font-bold  text-low_text hover:text-red-600 px-2 py-1  rounded border border-gray-300 hover:border-red-600"
              >
                Clear History ({conversationHistory.length})
              </button>
            )}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            {/* Show Generate button only if model is selected */}
            {model ? (
              <button
                type="button"
                onClick={handleGenerateClick}
                className="text-white rounded-md px-4 py-2 text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                disabled={loading || contextLoading || !newReply.trim()}
                aria-busy={loading || contextLoading}
              >
                {loading || contextLoading ? (
                  <div className="scale-75">
                    <CubeSpinner size="w-8 h-8" color="orange" />
                  </div>
                ) : (
                  <div className="flex  font-playfair bg-theme_color p-2 py-0 rounded-md  font-bold leading-relaxed "><span className="text-[15px] text-white ">Generate</span> <SparklesIcon size={20} /></div>
                )}
              </button>
            ) : standalone ? (
              // Show Share button in standalone mode
              <button
                type="button"
                onClick={handleShareClick}
                className="text-gray-800 dark:text-low_text rounded-full p-2 text-sm hover:bg-theme_color2 hover:dark:text-white hover:text-gray-200 "
                disabled={
                  isLoading ||
                  loading ||
                  contextLoading ||
                  (postingData.length === 0 && !newReply.trim())
                }
                title="Share to community"
              >
                <Send size={20} className="rotate-45" />
              </button>
            ) : (
              // Show Post button when no model selected in normal mode
              <button
                type="button"
                onClick={handleSubmit}
                className="text-gray-800 dark:text-low_text rounded-full p-2 text-sm hover:bg-theme_color2 hover:dark:text-white hover:text-gray-200 "
                disabled={
                  isLoading ||
                  loading ||
                  contextLoading ||
                  (!newReply.trim() && postingData.length === 0)
                }
              >
                {isLoading ? (
                  "Posting..."
                ) : (
                  <Send size={20} className="rotate-45" />
                )}
              </button>
            )}
          </div>
        </div>

        <ShowSelectedFile
          selectedFiles={selectedFiles}
          setSelectedFiles={setSelectedFiles}
        />
      </form>
    </div>
  );

};

export default UserReply;
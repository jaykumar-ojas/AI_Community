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
import { ChevronDown, Send, Brain, Zap } from "lucide-react";
import modelIcon from "../../asset/IconImage/ModelIcon.png";
import ModelList from "../AIchatbot/Component/ModelList";
import { CommentContext } from "../ContextProvider/CommentModelContext";
import { fetchModelInfo, describeImagesInBackground } from "./Component/ReplyApi";
import { UseSetUserCredit } from "../GlobalFunction/GlobalFunctionForResue";

import { CubeSpinner } from "../ui/CubeSpinner";
import ErrorBar from "../Card/ErrorBar";
import { useNotification } from "../ContextProvider/NotificationContext";
import { decodeId } from "../../utils/hashids";


const baseUrl = process.env.REACT_APP_BASE_URL;

// Engaging context loading messages
const CONTEXT_MESSAGES = [
  "Contexting your response…",
  "Analyzing thread…",
  "Shaping your answer…",
  "Reading between the lines…",
  "Understanding the conversation…",
  "Crafting contextual insights…",
  "Processing discussion flow…",
  "Weaving context magic…"
];

const UserReply = ({ forum = false }) => {
  const { showNotification } = useNotification();
  const { loginData } = useContext(LoginContext);
  const { emitNewReply, emitNewComment } = useWebSocket();
  const params = useParams();

  const dynamicId = forum ? params.topicId : params.id;
  const dynamicId1 = forum ? decodeId (params.topicId) : params.id;


  const forumContext = useContext(ForumContext);
  const commentContext = useContext(CommentContext);
  const setUserCredit = UseSetUserCredit();

  const { replyIdForContext, model, modelType, provider, setModel } = forum
    ? forumContext
    : commentContext;

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

  // Rotating context messages effect
  useEffect(() => {
    let interval;
    if (contextLoading) {
      interval = setInterval(() => {
        setMessageIndex((prev) => (prev + 1) % CONTEXT_MESSAGES.length);
      }, 1500); // Change message every 1.5 seconds
    }
    return () => clearInterval(interval);
  }, [contextLoading]);

  useEffect(() => {
    if (contextLoading) {
      setContextMessage(CONTEXT_MESSAGES[messageIndex]);
    }
  }, [messageIndex, contextLoading]);

  // -------------------
  // Conversation builder
  const buildConversationPrompt = (history, newPrompt) => {
    let historyString = history
      .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
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

  // -------------------
  // File handler
  const handleFileSelect = (e) => {
    setSelectedFiles(Array.from(e.target.files));
  };

  // -------------------
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

  // -------------------
  // Generate content
  const handleGenerateSubmit = async (e, useEnhancedPrompt = null, useOriginalText = null) => {
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

      const generatePayload = {
        model,
        prompt: conversationPrompt,
        type: modelType,
        provider,
      };

      const response = await axios.post(`${baseUrl}/generateContent`, generatePayload, {
        headers: getAuthHeaders(),
      });

      if (response.data.success) {
        const modelInfo = await fetchModelInfo(model);

        setPostingData((prev) => {
          const next = [...prev];
          for (let i = next.length - 1; i >= 0; i--) {
            if (next[i].isLoading) {
              const data = response.data.data;
              const updated = { ...next[i], isLoading: false, modelInfo };
              if (data?.text) {
                updated.aiText = data.text;
              } else if (data?.imageData) {
                const binary = atob(data.imageData);
                const bytes = new Uint8Array(binary.length);
                for (let j = 0; j < binary.length; j++) bytes[j] = binary.charCodeAt(j);
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
        setNewReply("");

        // Reset model after generation
        setModel?.(null);
      } else {
        setError("Failed to generate content");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "An error occurred while generating content"
      );
    } finally {
      setLoading(false);
      // Don't reset contextLoading here since it's already handled in context flow
    }
  };

  // -------------------
  // Context aware generate and auto-trigger main generation
  const handleContextAwareGenerate = async () => {
    if (!newReply.trim()) return;

    setContextLoading(true);
    setError(null);
    setMessageIndex(0); // Reset message rotation

    try {
      const suggestResponse = await axios.post(
        `${baseUrl}/suggest/${replyIdForContext || dynamicId1 }`,
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
        
        // Stop contexting when generation starts
        setContextLoading(false);
        
        // Automatically trigger generation with enhanced prompt
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

  // Main generate handler - decides between context-aware or direct generation
  const handleGenerateClick = (e) => {
    if (isContextAware) {
      handleContextAwareGenerate();
    } else {
      handleGenerateSubmit(e);
    }
  };

  // -------------------
  // Submit to post
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
              imageUrl: { fileUrl: URL.createObjectURL(file), fileName: file.name },
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
      }
    } catch (err) {
      if (handleAuthError(err, setError)) return;
      setError("Failed to post reply. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const clearConversationHistory = () => {
    setConversationHistory([]);
    setPostingData([]);
  };


  return (
    <div className="relative bottom-0 left-0 right-0 border border-gray-500 dark:border-gray-700 rounded-md  dark:bg-gray-800  bg-transparent  z-50">
      {error && <ErrorBar message={error} onClose={() => setError("")} />}

      <div className="max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-100 dark:scrollbar-thumb-gray-500 scrollbar-track-bg-red-100 dark:scrollbar-track-bg_comment_box">
        <ShowGeneratedContent postingData={postingData} />
      </div>

      <UserAndModel forum={forum} />

      <form>
        <div className="flex md:mb-1">
          <textarea
            className="flex-1 px-2 min-h-8 max-h-12 text-gray-900 dark:text-gray-300 text-sm md:text-sm bg-transparent focus:outline-none focus:ring-0  rounded-md resize-none overflow-y-auto break-words"
            placeholder="Write your reply..."
            value={newReply}
            onChange={(e) => setNewReply(e.target.value)}
            disabled={isLoading || loading || contextLoading}
          />
        </div>

        <div className="flex justify-between items-center">
          {/* Left controls */}
          <div className="flex items-center gap-2 px-1">
            <label className="dark:text-gray-300 text-gray-600 hover:text-gray-700 cursor-pointer text-xs md:text-sm flex items-center">
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
              className="flex items-center gap-2 border dark:border-gray-300 border-gray-800 px-2 py-1 rounded-lg shadow-sm hover:shadow-md transition-all"
            >
              {model ? (
                <span className="font-medium text-xs text-gray-900 dark:text-gray-200">{model}</span>
              ) : (
                <span className="text-gray-500">
                  <img
                    className="h-5 w-full object-cover bg-white rounded-full"
                    src={modelIcon}
                    alt="model"
                  />
                </span>
              )}
              <ChevronDown
                className={`h-4 w-4 text-gray-800 dark:text-gray-300 transition-transform ${
                  isDropdownOpen ? "rotate-180" : ""
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
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsContextAware(!isContextAware)}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-400 ease-in-out 
                  ${isContextAware ? 'bg-gradient-to-r from-like_color to-purple-600' : 'bg-gray-300 dark:bg-gray-500'}
                `}
                disabled={contextLoading}
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out shadow-lg
                    ${isContextAware ? 'translate-x-6' : 'translate-x-1'}
                  `}
                >
                  {isContextAware && (
                    <Brain className="h-3 w-3 text-like_color absolute top-0.5 left-0.5" />
                  )}
                </span>
              </button>
              <span className={`text-xs font-medium transition-colors ${isContextAware ? 'text-like_color' : 'text-gray-800 dark:text-gray-200'}`}>
                Context engine
              </span>
            </div>

            {/* Context Loading Message */}
            {contextLoading && (
              <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-purple-50 px-3 py-1 rounded-full border border-blue-200">
                <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs text-blue-600 font-medium animate-pulse">
                  {contextMessage}
                </span>
              </div>
            )}

            {conversationHistory.length > 0 && (
              <button
                type="button"
                onClick={clearConversationHistory}
                className="text-xs text-gray-500 hover:text-red-600 px-2 py-1 rounded border border-gray-300 hover:border-red-300"
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
                  <SparklesIcon />
                )}
              </button>
            ) : (
              // Show Post button when no model selected
              <button
                type="button"
                onClick={handleSubmit}
                className="text-gray-800 dark:text-gray-300 rounded-full p-2 text-sm hover:bg-blue-500 hover:dark:text-gray-600 hover:text-gray-200 "
                disabled={
                  isLoading ||
                  loading ||
                  contextLoading ||
                  (!newReply.trim() && postingData.length === 0)
                }
              >
                {isLoading ? "Posting..." : <Send size={20} className="rotate-45" />}
              </button>
            )}
          </div>
        </div>

        <ShowSelectedFile selectedFiles={selectedFiles} setSelectedFiles={setSelectedFiles} />
      </form>
    </div>
  );
};

export default UserReply;
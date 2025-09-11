import React, { useContext, useEccfect, useEffect, useRef, useState } from "react";
import { ForumContext } from "../ContextProvider/ModelContext";
import UserAndModel from "./Component/UserAndModel";
import ShowSelectedFile from "./Component/ShowSelectedFiie";
import { AttachIcon, Sparkle, SparklesIcon } from "../../asset/icons";
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
import { ChevronDown, Send } from "lucide-react";
import modelIcon from "../../asset/IconImage/ModelIcon.png";
// import ModelContent from "./Component/ModelContent";
import ModelList from "../AIchatbot/Component/ModelList";
import { CommentContext } from "../ContextProvider/CommentModelContext";
import { fetchModelInfo, describeImagesInBackground } from "./Component/ReplyApi";
import { UseSetUserCredit } from "../GlobalFunction/GlobalFunctionForResue";

const baseUrl = process.env.REACT_APP_BASE_URL;

const UserReply = ({forum=false}) => {
  const { loginData } = useContext(LoginContext);
  const { emitNewReply,emitNewComment } = useWebSocket(); // for websocket
  const params = useParams();
  const dynamicId = forum ? params.topicId : params.id; // for params id
  const forumContext = useContext(ForumContext);
  const commentContext = useContext(CommentContext);
  const setUserCredit = UseSetUserCredit();

  const {replyIdForContext, model, modelType, provider} = forum ? forumContext : commentContext; //for context

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [postingData, setPostingData] = useState([]);
  const [newReply, setNewReply] = useState("");
  
  // Conversation history for memory-aware functionality
  const [conversationHistory, setConversationHistory] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState();
  const [loading, setLoading] = useState(false);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [postedReplies, setPostedReplies] = useState([]);
  const [isContextAware, setIsContextAware] = useState(false);
  const [contextLoading, setContextLoading] = useState(false);
  const [aiGenerated, setAiGenerated] = useState(false);

  // Build conversation prompt with history
  const buildConversationPrompt = (history, newPrompt) => {
    let historyString = history
      .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
      .join("\n");
    return `You are an AI assistant. Below is the conversation so far:\n\n${historyString}\n\nThe user now says:\n"${newPrompt}"\n\nPlease respond helpfully as the assistant:\nAssistant:`;
  };

  // Update conversation history when postingData changes
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
        describeImagesInBackground(replyId, postingData,selectedFiles);
      }
    });
  }, [postedReplies]);

  const handleGenerateSubmit = async (e, enhancedPrompt = null, originalUserText = null) => {
    if(!loginData){
      alert("Please Login to proceed");
      return;
    }
    if (e) e.preventDefault();
    const promptToUse = enhancedPrompt || newReply.trim();
    const textToRender = originalUserText || newReply.trim();
    if (!promptToUse) return;

    setLoading(true);
    setError(null);

    try {
      // Build conversation-aware prompt
      const conversationPrompt = conversationHistory.length > 0 
        ? buildConversationPrompt(conversationHistory, promptToUse)
        : promptToUse;

      const generatePayload = {
        model: model,
        prompt: conversationPrompt,
        type: modelType,
        provider: provider,
        conversationHistory: conversationHistory, // Send history to API
      };

      const response = await axios.post(`${baseUrl}/generateContent`, generatePayload,{headers: getAuthHeaders()});

      if (response.data.success) {
        const modelInfo = await fetchModelInfo(model);

        handleGeneratedResult(response.data.data, textToRender, modelInfo);
        setUserCredit(response?.data?.credit);
        setNewReply("");
      } else {
        setError("Failed to generate content");
      }
    } catch (err) {
      setError(err.response?.data?.error || "An error occurred while generating content");
    } finally {
      setLoading(false);
    }
  };

  // -------------------
  // Context Aware Generate with Memory
  const handleContextAwareGenerate = async (e) => {
    if (e) e.preventDefault();
    if (!newReply.trim()) return;

    setContextLoading(true);
    setError(null);

    try {
      const suggestResponse = await axios.post(
        `${baseUrl}/suggest/${replyIdForContext || dynamicId}`,
        {
          text: newReply.trim(),
          contextType: forum ? "forumReply" : "comment",
          options: { temperature: 0.7, maxTokens: 1000 },
          conversationHistory: conversationHistory, // Include history in context-aware requests
        },
        { headers: getAuthHeaders() }
      );

      if (suggestResponse.data.success) {
        const enhancedPrompt = suggestResponse.data.data.suggestion;
        const originalUserText = newReply.trim();
        handleGenerateSubmit(null, enhancedPrompt, originalUserText);
      } else {
        setError("Failed to generate context-aware suggestion");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "An error occurred while generating context-aware content"
      );
    } finally {
      setContextLoading(false);
    }
  };

  // -------------------
  // Unified Generate Button Click
  const handleGenerateClick = (e) => {
    if (isContextAware) {
      handleContextAwareGenerate(e);
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

    const updatedPostingData = [
      ...postingData.map((entry) => {
        if (entry.modelInfo && model) return { ...entry, model };
        return entry;
      }),
      { userText: newReply.trim(), aiText: "", prompt: "", imageUrl: "" },
    ];

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
          setPostedReplies((prev) => [
            ...prev,
            { replyId, postingData: updatedPostingData, processed: false },
          ]);
        }

        setNewReply("");
        setSelectedFiles([]);
        setPostingData([]);
      }
    } catch (err) {
      console.error("Error posting reply:", err);
      if (handleAuthError(err, setError)) return;
      setError("Failed to post reply. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------
  // Handle generated result
  const handleGeneratedResult = (data, originalPrompt, modelInfo = null) => {
    setAiGenerated(false);

    let newEntry = {
      userText: originalPrompt,
      aiText: "",
      prompt: "",
      imageUrl: "",
      imageBlob: "",
      model: model,
      modelInfo: modelInfo,
    };

    if (data?.text) {
      newEntry.aiText = data.text;
    } else if (data?.imageData) {
      const binary = atob(data.imageData);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: "image/png" });
      newEntry.imageUrl = URL.createObjectURL(blob);
      newEntry.imageBlob = data.imageData;
    } else if (data?.imageUrl) {
      newEntry.imageUrl = data.imageUrl;
    }

    setPostingData((prev) => [...prev, newEntry]);
    setAiGenerated(true);
    setNewReply("");
  };

  // -------------------
  // Clear conversation history
  const clearConversationHistory = () => {
    setConversationHistory([]);
    setPostingData([]);
  };

  // -------------------
  return (
    <div className="relative bottom-0 left-0 right-0 bg-transparent shadow-lg z-50 p-1">
      {error && (
        <div className="mb-2 p-2 bg-red-100 text-red-700 rounded-md text-xs md:text-sm">
          {error}
        </div>
      )}

      <div className="max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-bg_comment_box">
        <ShowGeneratedContent postingData={postingData} />
      </div>

      <UserAndModel forum={forum}/>

      <form>
        <div className="flex md:mb-2">
          <textarea
            className="flex-1 p-1 min-h-8 text-sm md:text-sm bg-transparent focus:outline-none focus:ring-0 border border-gray-300 rounded-md resize-none overflow-y-auto break-words"
            placeholder="Write your reply..."
            value={newReply}
            onChange={(e) => setNewReply(e.target.value)}
            disabled={isLoading || loading || contextLoading}
          />
        </div>

        <div className="flex justify-between items-center">
          {/* Left controls */}
          <div className="flex items-center gap-2 px-1">
            <label className="text-gray-500 hover:text-gray-700 cursor-pointer text-xs md:text-sm flex items-center">
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
              className="flex items-center gap-2 border border-gray-300 px-2 py-1 rounded-lg shadow-sm hover:shadow-md transition-all"
            >
              {model ? (
                <span className="font-medium text-xs text-black">{model}</span>
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
                className={`h-4 w-4 text-gray-600 transition-transform ${
                  isDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {isDropdownOpen && (
              <ModelList userForum={forum} userComment={!forum} closeDropdown={() => setIsDropdownOpen(false)} />
            )}

            {/* Context Aware Toggle */}
            <label className="flex items-center gap-1 text-xs text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={isContextAware}
                onChange={(e) => setIsContextAware(e.target.checked)}
                className="accent-blue-600"
              />
              Context Aware
            </label>

            {/* Clear History Button */}
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
            {model && (
              <button
                type="button"
                onClick={handleGenerateClick}
                className="text-white rounded-md px-4 py-2 text-sm disabled:opacity-50"
                disabled={loading || contextLoading || !newReply.trim()}
              >
                {loading || contextLoading ? <Sparkle /> : <SparklesIcon />}
              </button>
            )}
            <button
              type="button"
              onClick={handleSubmit}
              className="text-black rounded-full p-2 text-sm hover:bg-blue-700 disabled:opacity-50"
              disabled={
                isLoading ||
                loading ||
                contextLoading ||
                (!newReply.trim() && postingData.length === 0) ||
                (model && !aiGenerated)
              }
            >
              {isLoading ? "Posting..." : <Send size={20} className="rotate-45" />}
            </button>
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
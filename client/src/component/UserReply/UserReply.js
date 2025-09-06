import React, { useContext, useEffect, useRef, useState } from "react";
import { ForumContext } from "../ContextProvider/ModelContext";
import UserAndModel from "./Component/UserAndModel";
import ShowSelectedFile from "./Component/ShowSelectedFiie";
import { AttachIcon, MindIcon, Sparkle, SparklesIcon } from "../../asset/icons";
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
import { BrainIcon, ChevronDown, Send } from "lucide-react";
import modelIcon from "../../asset/IconImage/ModelIcon.png";
import ModelContent from "./Component/ModelContent";
const baseUrl = process.env.REACT_APP_BASE_URL;

const UserReply = () => {
  // other states for genral use
  const { loginData } = useContext(LoginContext);
  const { emitNewReply } = useWebSocket();
  const { topicId } = useParams();

  // model related states
  const {
    replyIdForContext,
    setReplyIdForContext,
    model,
    modelType,
    provider,
  } = useContext(ForumContext);

  // post related states
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [postingData, setPostingData] = useState([]);
  const [newReply, setNewReply] = useState("");

  // loading related states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState();
  const [loading, setLoading] = useState(false);

  // for mobileView model button state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Track posted replies to call describe-images API
  const [postedReplies, setPostedReplies] = useState([]);

  // Context aware functionality
  const [isContextAware, setIsContextAware] = useState(false);
  const [contextLoading, setContextLoading] = useState(false);
  const [aiGenerated, setAiGenerated] = useState(false);

  // Effect to monitor posted replies and trigger image description
  useEffect(() => {
    postedReplies.forEach(({ replyId, postingData, processed }) => {
      if (!processed) {
        // Mark as processed to avoid multiple calls
        setPostedReplies((prev) =>
          prev.map((item) =>
            item.replyId === replyId ? { ...item, processed: true } : item
          )
        );

        // Call the describe-images API in background
        describeImagesInBackground(replyId, postingData);
      }
    });
  }, [postedReplies]);

  // function handling file
  const handleFileSelect = (e) => {
    setSelectedFiles(Array.from(e.target.files));
  };

  // Background function to describe images
  const describeImagesInBackground = async (replyId, postingData) => {
    // Check if there are any images in the posting data
    const hasImages = postingData.some(
      (entry) =>
        entry.imageUrl ||
        selectedFiles.some((file) => file.type.startsWith("image/"))
    );

    if (!hasImages) return;

    try {
      const response = await axios.put(
        `${baseUrl}/describe-images/${replyId}`,
        {},
        {
          headers: getAuthHeaders(),
        }
      );
    } catch (err) {
      console.error("Error describing images:", err);
      // Don't show this error to user since it's a background operation
    }
  };

  // Function to fetch model information
  const fetchModelInfo = async (modelName) => {
    try {
      const response = await axios.get(
        `${baseUrl}/aimodels/search?modelName=${encodeURIComponent(modelName)}`,
        {
          headers: getAuthHeaders(),
        }
      );
      if (response.data.success) {
        return response.data.data;
      } else {
        return null;
      }
    } catch (err) {
      return null;
    }
  };

  // handle generate Submit - calls the /generate API
  const handleGenerateSubmit = async (e, enhancedPrompt = null,originalUserText = null) => {
    e.preventDefault();
    const promptToUse = enhancedPrompt || newReply.trim();
    const textToRender = originalUserText || newReply.trim();
    if (!promptToUse) return;

    setLoading(true);
    setError(null);

    try {
      const generatePayload = {
        model: model,
        prompt: promptToUse,
        type: modelType,
        provider: provider,
      };

      const response = await axios.post(`${baseUrl}/generateContent`,generatePayload);

      if (response.data.success) {
        // Fetch model information after successful generation
        const modelInfo = await fetchModelInfo(model);
        
        // Always render the original user text, not the enhanced prompt
        handleGeneratedResult(response.data.data, textToRender, modelInfo);
        setNewReply("");

        // if (!enhancedPrompt) {
        //   setNewReply("");
        // }
      } else {
        setError("Failed to generate content");
      }
    } catch (err) {
      setError(err.response?.data?.error || "An error occurred while generating content");
    } finally {
      setLoading(false);
    }
  };

  // Handle context-aware generation
  const handleContextAwareGenerate = async (e) => {
    e.preventDefault();
    if (!newReply.trim()) return;

    setContextLoading(true);
    setError(null);

    try {
      // First call the suggest API to get context-aware enhancement

      const suggestResponse = await axios.post(
        `${baseUrl}/suggest/${replyIdForContext || topicId}`,
        {
          text: newReply.trim(),
          contextType: "forumReply",
          options: {
            // Add any specific options for suggestion
            temperature: 0.7,
            maxTokens: 500,
          },
        },
        {
          headers: getAuthHeaders(),
        }
      );

      if (suggestResponse.data.success) {
        const enhancedPrompt = suggestResponse.data.data.suggestion;
        const originalUserText = newReply.trim();

        // Use enhanced prompt for generation but render original user text
        handleGenerateSubmit(null, enhancedPrompt, originalUserText);
      } else {
        setError("Failed to generate context-aware suggestion");
      }
    } catch (err) {
      console.error("Error in context-aware generation:", err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "An error occurred while generating context-aware content"
      );
    } finally {
      setContextLoading(false);
    }
  };

  // handle submit to post
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newReply.trim() && postingData.length === 0) return;
    setIsLoading(true);
    setError(null);

    // Ensure all entries in postingData have the model field if they are AI-generated
    const updatedPostingData = [
      ...postingData.map((entry) => {
        if (entry.modelInfo && model) {
          return { ...entry, model };
        }
        return entry;
      }),
      {
        userText: newReply.trim(),
        aiText: "",
        prompt: "",
        imageUrl: "",
      },
    ];

    try {
      const formData = new FormData();
      formData.append("content", JSON.stringify(updatedPostingData));
      formData.append("topicId", topicId);
      formData.append("userId", loginData.validuserone._id);
      formData.append("userName", loginData.validuserone.userName);
      if (replyIdForContext) {
        formData.append("parentReplyId", replyIdForContext);
      }

      // Append files if any
      selectedFiles.forEach((file) => {
        formData.append("media", file);
      });

      const response = await axios.post(REPLIES_URL, formData, {
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status === 201) {
        const newReplyData = {
          ...response.data.reply,
          topicId: topicId,
          userName: loginData.validuserone.userName,
          userId: loginData.validuserone._id,
        };

        emitNewReply(newReplyData);

        // Add to posted replies for background image description
        const replyId = response.data.reply._id || response.data.reply.id;
        if (replyId) {
          setPostedReplies((prev) => [
            ...prev,
            {
              replyId: replyId,
              postingData: updatedPostingData,
              processed: false,
            },
          ]);
        }

        setNewReply("");
        setSelectedFiles([]);
        setPostingData([]);
      }
    } catch (err) {
      console.error("Error posting reply:", err);
      if (handleAuthError(err, setError)) {
        return;
      }
      setError("Failed to post reply. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratedResult = (data, originalPrompt, modelInfo = null) => {
    setAiGenerated(false);

    let newEntry = {
      userText: originalPrompt,
      aiText: "",
      prompt: "",
      imageUrl: "",
      imageBlob:"",
      model: model,
      modelInfo: modelInfo,
    };

    if (data?.text) {
      newEntry.aiText = data.text;
    } else if (data?.imageData) {
      const binary = atob(data.imageData); // decode base64 to binary string
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
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

  return (
    <div className="relative bottom-0 left-0 right-0 bg-transparent shadow-lg z-50 p-1">
      {/* Error display */}
      {error && (
        <div className="mb-2 p-2 bg-red-100 text-red-700 rounded-md text-xs md:text-sm">
          {error}
        </div>
      )}

      {/* for showing user generated content */}
      <div className="max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-bg_comment_box">
        <ShowGeneratedContent postingData={postingData} />
      </div>

      {/* for showing model and userName */}
      <UserAndModel />

      <form>
        <div className="flex md:mb-2">
          <textarea
            type="text"
            className="flex-1 p-1 min-h-8 text-sm md:text-sm 
             bg-transparent focus:outline-none focus:ring-0 border border-gray-300 rounded-md 
             resize-none overflow-y-auto break-words"
            placeholder="Write your reply..."
            value={newReply}
            onChange={(e) => setNewReply(e.target.value)}
            disabled={isLoading || loading || contextLoading}
          />
        </div>

        {/* lower button */}
        <div className="flex justify-between">
          <div className="flex justify-start items-center gap-2 px-1">
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
              className="flex items-center gap-2 border border-gray-300  px-2 py-1  rounded-lg shadow-sm hover:shadow-md transition-all"
            >
              {model ? (
                <>
                  <span className="font-medium text-xs text-black">
                    {model}
                  </span>
                </>
              ) : (
                <span className="text-gray-500">
                  <img
                    className="h-5 w-full object-cover bg-white rounded-full"
                    src={modelIcon}
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
              <ModelContent closeDropdown={() => setIsDropdownOpen(false)} />
            )}
          </div>
          <div className="flex ">
            {model && (
              <button
                type="button"
                onClick={handleGenerateSubmit}
                className="text-white rounded-md px-4 py-2 text-sm  disabled:opacity-50"
                disabled={loading || contextLoading || !newReply.trim()}
              >
                {/* {loading ? "Generating..." : `Generate ${modelType === 'image' ? 'Image' : 'Text'}`} */}
                {loading ? <Sparkle /> : <SparklesIcon />}
              </button>
            )}
            {/* Post Button */}
            <button
              type="button"
              onClick={handleSubmit}
              className="text-black rounded-full p-2 text-sm hover:bg-blue-700 disabled:opacity-50 "
              disabled={
                isLoading ||
                loading ||
                contextLoading ||
                (!newReply.trim() && postingData.length === 0) ||
                (model && !aiGenerated)
              }
            >
              {isLoading ? (
                "Posting..."
              ) : (
                <Send size={20} className="rotate-45 mr-1 text-" />
              )}
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

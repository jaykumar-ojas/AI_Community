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
import modelIcon from "../../asset/IconImage/ModelIcon.png"
import ModelContent from "./Component/ModelContent";
const baseUrl = process.env.REACT_APP_BASE_URL;

const UserReply = () => {
  const { loginData } = useContext(LoginContext);
  const { replyIdForContext, setReplyIdForContext, model, modelType } =
    useContext(ForumContext);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState();
  const { emitNewReply } = useWebSocket();

  const [loading, setLoading] = useState(false);
  const [newReply, setNewReply] = useState("");
  const { topicId } = useParams();
  const [postingData, setPostingData] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

  // Track posted replies to call describe-images API
  const [postedReplies, setPostedReplies] = useState([]);

  // Context aware functionality
  const [isContextAware, setIsContextAware] = useState(false);
  const [contextLoading, setContextLoading] = useState(false);
  const [aiGenerated, setAiGenerated] = useState(false);
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
      console.log(`Calling describe-images API for reply: ${replyId}`);

      const response = await axios.put(
        `${baseUrl}/describe-images/${replyId}`,
        {},
        {
          headers: getAuthHeaders(),
        }
      );

      console.log("Image description API response:", response.data);

      if (response.data.success) {
        console.log("Images described successfully for reply:", replyId);
      }
    } catch (err) {
      console.error("Error describing images:", err);
      // Don't show this error to user since it's a background operation
    }
  };

  // Function to fetch model information
  const fetchModelInfo = async (modelName) => {
    try {
      console.log(`Calling /aimodels/search API for model: ${modelName}`);

      const response = await axios.get(
        `${baseUrl}/aimodels/search?modelName=${encodeURIComponent(modelName)}`,
        {
          headers: getAuthHeaders(),
        }
      );

      console.log("AI model search API response:", response.data);

      if (response.data.success) {
        return response.data.data;
      } else {
        console.warn(`No model info found for: ${modelName}`);
        return null;
      }
    } catch (err) {
      console.error("Error fetching model info:", err);
      // Return null if model info fetch fails, don't break the flow
      return null;
    }
  };

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

  // handle generate Submit - calls the /generate API
  const handleGenerateSubmit = async (
    e,
    enhancedPrompt = null,
    originalUserText = null
  ) => {
    e?.preventDefault();
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
        options: {
          // Add any additional options here based on your requirements
          temperature: 0.7,
          maxTokens: modelType === "text" ? 1000 : undefined,
          n: 1,
          size: modelType === "image" ? "1024x1792" : undefined,
        },
      };

      console.log("Calling /generate API with payload:", generatePayload);

      const response = await axios.post(
        `${baseUrl}/generate`, // Updated endpoint
        generatePayload
      );

      console.log("Generate API response:", response.data);

      if (response.data.success) {
        // Fetch model information after successful generation
        const modelInfo = await fetchModelInfo(model);

        // Always render the original user text, not the enhanced prompt
        handleGeneratedResult(response.data.data, textToRender, modelInfo);
        if (!enhancedPrompt) {
          setNewReply("");
        }
      } else {
        setError("Failed to generate content");
      }
    } catch (err) {
      console.error("Error:", err);
      setError(
        err.response?.data?.error ||
          "An error occurred while generating content"
      );
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
      console.log("Calling /suggest API for context awareness");

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

      console.log("Suggest API response:", suggestResponse.data);

      if (suggestResponse.data.success) {
        const enhancedPrompt = suggestResponse.data.data.suggestion;
        const originalUserText = newReply.trim();

        console.log("Original user input:", originalUserText);
        console.log("Enhanced prompt (for generation only):", enhancedPrompt);

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
    console.log("Direct post submit");
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
    console.log("Handling generated result:", data);
    console.log("Model info received:", modelInfo);

    let newEntry = {
      userText: originalPrompt,
      aiText: "",
      prompt: "",
      imageUrl: "",
      model: model,
      modelInfo: modelInfo,
    };

    // Since we're passing response.data.data, the structure is:
    // data.type, data.result.text, etc.
    if (data.type === "text" && data.result?.text) {
      newEntry.aiText = data.result.text;
    } else if (data.type === "image" && data.result?.images?.[0]?.url) {
      newEntry.imageUrl = data.result.images[0].url;
    } else if (data.type === "image" && data.result?.images) {
      // Alternative structure for image URLs
      newEntry.imageUrl = data.result.images;
    }

    console.log("New Entry:", newEntry);
    setPostingData((prev) => [...prev, newEntry]);

    setAiGenerated(true);
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
            {isDropdownOpen && <ModelContent  closeDropdown={() => setIsDropdownOpen(false)} />}
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

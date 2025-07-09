import React, { useContext, useEffect, useState } from "react";
import ShowSelectedFile from "./Component/ShowSelectedFiie";
import {
  AttachIcon,
} from "../../asset/icons";
import axios from "axios";
import ShowGeneratedContent from "./Component/ShowGeneratedContent";
import Context, { LoginContext } from "../ContextProvider/context";
import { useParams } from "react-router-dom";
import {
  REPLIES_URL,
  getAuthHeaders,
  handleAuthError,
} from "../AiForumPage/components/ForumUtils";
import { useWebSocket } from "../AiForumPage/components/WebSocketContext";
import CommentModelProvider, { CommentContext } from "../ContextProvider/CommentModelContext";
import UserAndModel from "./Comment/UserAndModelComment";

const UserCommentReply = () => {
  const { id } = useParams();
  const { loginData } = useContext(LoginContext);
  const { replyIdForContext, setReplyIdForContext, model, setModel, modelType } = useContext(CommentContext);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState();
  const { emitNewComment } = useWebSocket();

  const [loading, setLoading] = useState(false);
  const [newReply, setNewReply] = useState("");
  const [postingData, setPostingData] = useState([]);

  // Track posted replies to call describe-images API
  const [postedReplies, setPostedReplies] = useState([]);
  
  // Context aware functionality
  const [contextLoading, setContextLoading] = useState(false);
  const [aiGenerated, setAiGenerated] = useState(false);

  // Background function to describe images
  const describeImagesInBackground = async (replyId, postingData) => {
    // Check if there are any images in the posting data
    const hasImages = postingData.some(entry => 
      entry.imageUrl || 
      selectedFiles.some(file => file.type.startsWith('image/'))
    );

    if (!hasImages) return;

    try {
      console.log(`Calling describe-images API for comment reply: ${replyId}`);
      
      const response = await axios.put(
        `/describe-images/${replyId}`,
        {},
        {
          headers: getAuthHeaders()
        }
      );

      console.log("Image description API response:", response.data);
      
      if (response.data.success) {
        console.log("Images described successfully for comment reply:", replyId);
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
        `/aimodels/search?modelName=${encodeURIComponent(modelName)}`,
        {
          headers: getAuthHeaders()
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
        setPostedReplies(prev => 
          prev.map(item => 
            item.replyId === replyId 
              ? { ...item, processed: true }
              : item
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
  const handleGenerateSubmit = async (e, enhancedPrompt = null, originalUserText = null) => {
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
          maxTokens: modelType === 'text' ? 1000 : undefined,
          n: 1,
          size: modelType === 'image' ? '1024x1792' : undefined, // Updated to match UserReply
        }
      };

      console.log("Calling /generate API with payload:", generatePayload);
      
      const response = await axios.post(
        "/generate", // Updated endpoint
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
        `/suggest/${replyIdForContext || id}`,
        {
          text: newReply.trim(),
          contextType: 'comment', // Updated context type
          options: {
            // Add any specific options for suggestion
            temperature: 0.7,
            maxTokens: 500
          }
        },
        {
          headers: getAuthHeaders()
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
      ...postingData.map(entry => {
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
      formData.append("postId", id);
      formData.append("userId", loginData.validuserone._id);
      formData.append("userName", loginData.validuserone.userName);
      if (replyIdForContext) {
        formData.append("parentReplyId", replyIdForContext);
      }

      // Append files if any
      selectedFiles.forEach((file) => {
        formData.append("media", file);
      });

      const response = await axios.post('/comments/post', formData, {
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status === 201 || response.status === 200) {
        const newReplyData = {
          ...response.data.reply,
          postId: id,
          userName: loginData.validuserone.userName,
          userId: loginData.validuserone._id,
        };

        emitNewComment(newReplyData);

        // Add to posted replies for background image description
        const replyId = response.data.reply._id || response.data.reply.id;
        if (replyId) {
          setPostedReplies(prev => [
            ...prev,
            {
              replyId: replyId,
              postingData: updatedPostingData,
              processed: false
            }
          ]);
        }

        setNewReply("");
        setSelectedFiles([]);
        setPostingData([]);
        setReplyIdForContext(null);
        setModel("");
      }
    } catch (err) {
      console.error("Error posting comment reply:", err);
      if (handleAuthError(err, setError)) {
        return;
      }
      setError("Failed to post comment reply. Please try again.");
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
      modelInfo: modelInfo
    };

    // Since we're passing response.data.data, the structure is:
    // data.type, data.result.text, etc.
    if (data.type === 'text' && data.result?.text) {
      newEntry.aiText = data.result.text;
    } else if (data.type === 'image' && data.result?.images?.[0]?.url) {
      newEntry.imageUrl = data.result.images[0].url;
    } else if (data.type === 'image' && data.result?.images) {
      // Alternative structure for image URLs
      newEntry.imageUrl = data.result.images;
    }

    console.log("New Entry:", newEntry);
    setPostingData((prev) => [...prev, newEntry]);

    setAiGenerated(true);
  };

  return (
    <div className="relative bottom-0 left-0 right-0 bg-bg_comment_box shadow-lg z-50 p-2">
      {/* Error display */}
      {error && (
        <div className="mb-2 p-2 bg-red-100 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* for showing user generated content */}
      <div className="max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-bg_comment_box">
        <ShowGeneratedContent postingData={postingData} />
      </div>
      
      {/* for showing model and userName */}
      <UserAndModel/>
      
      <form>
        <div className="flex mb-2">
          <input
            type="text"
            className="flex-1 border border-gray-200 rounded-md p-3 mr-2 text-sm"
            placeholder="Write your reply..."
            value={newReply}
            onChange={(e) => setNewReply(e.target.value)}
            disabled={isLoading || loading || contextLoading}
          />
          
          {/* Context Aware Generate Button - Only show when model is selected */}
          {model && (
            <button
              type="button"
              onClick={handleContextAwareGenerate}
              className="bg-purple-600 text-white rounded-md px-4 py-2 text-sm hover:bg-purple-700 disabled:opacity-50 mr-2"
              disabled={contextLoading || loading || !newReply.trim()}
              title="Generate with context awareness from conversation history"
            >
              {contextLoading ? "Context..." : "Context Aware"}
            </button>
          )}
          
          {/* Regular Generate Button */}
          {model && (
            <button
              type="button"
              onClick={handleGenerateSubmit}
              className="bg-green-600 text-white rounded-md px-4 py-2 text-sm hover:bg-green-700 disabled:opacity-50 mr-2"
              disabled={loading || contextLoading || !newReply.trim()}
            >
              {loading ? "Generating..." : `Generate ${modelType === 'image' ? 'Image' : 'Text'}`}
            </button>
          )}
          
          {/* Post Button */}
          <button
            type="button"
            onClick={handleSubmit}
            className="bg-blue-600 text-white rounded-md px-4 py-2 text-sm hover:bg-blue-700 disabled:opacity-50"
            disabled={isLoading || loading || contextLoading || (!newReply.trim() && postingData.length === 0) || (model && !aiGenerated)}
          >
            {isLoading ? "Posting..." : "Post"}
          </button>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <label className="text-gray-500 hover:text-gray-700 cursor-pointer text-sm flex items-center">
              <input
                type="file"
                multiple
                accept="image/*,video/*,audio/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isLoading}
              />
              <AttachIcon /> Attach
            </label>
            
            {/* Display current model info */}
            <div className="text-xs text-gray-500 ml-4">
              Current: {model} ({modelType})
            </div>
            
            {/* Context Aware Info */}
            {model && (
              <div className="text-xs text-purple-600 ml-2">
                💡 Context Aware available
              </div>
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

export default UserCommentReply;
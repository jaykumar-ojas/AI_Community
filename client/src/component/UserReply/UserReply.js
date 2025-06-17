import React, { useContext, useEffect, useState } from "react";
import { ForumContext } from "../ContextProvider/ModelContext";
import UserAndModel from "./Component/UserAndModel";
import ShowSelectedFile from "./Component/ShowSelectedFiie";
import {
  AttachIcon,
} from "../../asset/icons";
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

const UserReply = () => {
  const { loginData } = useContext(LoginContext);
  const { replyIdForContext, model, modelType } = useContext(ForumContext);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState();
  const { emitNewReply } = useWebSocket();

  const [loading, setLoading] = useState(false);
  const [newReply, setNewReply] = useState("");
  const { topicId } = useParams();
  const [postingData, setPostingData] = useState([]);

  // function handling file
  const handleFileSelect = (e) => {
    setSelectedFiles(Array.from(e.target.files));
  };

  // handle generate Submit - calls the /generate API
  const handleGenerateSubmit = async (e) => {
    e.preventDefault();
    if (!newReply.trim()) return;
    
    setLoading(true);
    setError(null);

    try {
      const generatePayload = {
        model: model,
        prompt: newReply.trim(),
        type: modelType,
        options: {
          // Add any additional options here based on your requirements
          temperature: 0.7,
          maxTokens: modelType === 'text' ? 1000 : undefined,
          n: 1,
          size: modelType === 'image' ? '1024x1024' : undefined,
        }
      };

      console.log("Calling /generate API with payload:", generatePayload);
      
      const response = await axios.post(
        "http://localhost:8099/generate", // Updated endpoint
        generatePayload
      );
      
      console.log("Generate API response:", response.data);
      
      if (response.data.success) {
        handleGeneratedResult(response.data.data, newReply.trim());
        setNewReply("");
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

  // handle submit to post
  const handleSubmit = async (e) => {
    console.log("Direct post submit");
    e.preventDefault();
    if (!newReply.trim()) return;
    setIsLoading(true);
    setError(null);

    const updatedPostingData = [
      ...postingData,
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
        emitNewReply({
          ...response.data.reply,
          topicId: topicId,
          userName: loginData.validuserone.userName,
          userId: loginData.validuserone._id,
        });

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

  const handleGeneratedResult = (data, originalPrompt) => {
    console.log("Handling generated result:", data);
    
    let newEntry = {
      userText: originalPrompt,
      aiText: "",
      prompt: "",
      imageUrl: "",
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
      <UserAndModel />
      
      <form>
        <div className="flex mb-2">
          <input
            type="text"
            className="flex-1 border border-gray-200 rounded-md p-3 mr-2 text-sm"
            placeholder="Write your reply..."
            value={newReply}
            onChange={(e) => setNewReply(e.target.value)}
            disabled={isLoading || loading}
          />
          
          {/* Generate Button */}
          <button
            type="button"
            onClick={handleGenerateSubmit}
            className="bg-green-600 text-white rounded-md px-4 py-2 text-sm hover:bg-green-700 disabled:opacity-50 mr-2"
            disabled={loading || !newReply.trim()}
          >
            {loading ? "Generating..." : `Generate ${modelType === 'image' ? 'Image' : 'Text'}`}
          </button>
          
          {/* Post Button */}
          <button
            type="button"
            onClick={handleSubmit}
            className="bg-blue-600 text-white rounded-md px-4 py-2 text-sm hover:bg-blue-700 disabled:opacity-50"
            disabled={isLoading || !newReply.trim() && postingData.length === 0}
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
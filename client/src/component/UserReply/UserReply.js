import React, { useContext, useEffect, useState } from "react";
import { ForumContext } from "../ContextProvider/ModelContext";
import UserAndModel from "./Component/UserAndModel";
import ShowSelectedFile from "./Component/ShowSelectedFiie";
import {
  AttachIcon,
  BrainIcon,
  Pallete,
  PenIcon,
  SparkIcon,
} from "../../asset/icons";
import axios from "axios";
import ShowGeneratedContent from "./Component/ShowGeneratedContent";
import { LoginContext } from "../ContextProvider/context";
import { useParams } from "react-router-dom";
import { REPLIES_URL,getAuthHeaders, handleAuthError } from "../AiForumPage/components/ForumUtils";
import { useWebSocket } from "../AiForumPage/components/WebSocketContext";

const UserReply = () => {
  const token = localStorage.getItem('userdatatoken');
  console.log(token,"this is my otken");
  const {loginData} = useContext(LoginContext);
  const { replyIdForContext } = useContext(ForumContext);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState();
  const { emitNewReply } = useWebSocket();
  
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [newReply, setNewReply] = useState("");
  const {topicId} = useParams();
  const [postingData, setPostingData] = useState({
    userText: [],
    AiText: [],
    prompt: [],
    imageUrl: [],
  });

 

  const [formData, setFormData] = useState({
    textPrompt: "",
    controlBits: {
      enhancePrompt: false,
      generateText: false,
      generateImage: false,
      processContextAware: false,
    },
    contextType: "forumReply",
    entityId: "",
  });
  const anyControlBitTrue = Object.values(formData.controlBits).some(Boolean);

  // setting replyIdForContext
  useEffect(() => {
    if (replyIdForContext !== null) {
      setFormData((prev) => ({
        ...prev,
        entityId: replyIdForContext, // update entityId here
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        entityId: "", // update entityId here
      }));
    }
  }, [replyIdForContext]);

  // function handling file
  const handleFileSelect = (e) => {
    setSelectedFiles(Array.from(e.target.files));
  };



  // toggle between generate and post
  const toggleControl = (name) => {
    setFormData((prev) => ({
      ...prev,
      controlBits: {
        ...prev.controlBits,
        [name]: !prev.controlBits[name],
      },
    }));
  };

  const resetFormData = () => {
    setFormData({
      textPrompt: "",
      controlBits: {
        enhancePrompt: false,
        generateText: false,
        generateImage: false,
        processContextAware: false,
      },
    });
  };

  const resetPostingData = () =>{
    setPostingData({
      userText:[],
      AiText:[],
      prompt:[],
      imageUrl:[]
    });
  }



  // handle generate Submit
  const handleGenerateSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // set textPrompt manually
    const payload = {
      ...formData,
      textPrompt: newReply.length > 0 ? newReply : formData.textPrompt,
    };
    console.log(payload, "this is my formdata");
    try {
      const response = await axios.post(
        "http://localhost:8099/stateselection",
        payload
      );
      handleGeneratedResult(response.data.result);
      console.log("this is my data",response.data.result);
      setNewReply("");
      resetFormData();
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "An error occurred while processing your request"
      );
    } finally {
      setLoading(false);
    }
  };

  // handle submit to post
   const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newReply.trim()) return;
    setIsLoading(true);
    setError(null);

    const updatedPostingData = {
      ...postingData,
      userText: [...postingData.userText, newReply.trim()]
    };

    try {
      const formData = new FormData();
      formData.append('content', JSON.stringify(updatedPostingData));
      formData.append('topicId', topicId);
      formData.append('userId', loginData.validuserone._id);
      formData.append('userName', loginData.validuserone.userName);
      if (replyIdForContext) {
        formData.append('parentReplyId', replyIdForContext);
      }

      // Append files if any
      selectedFiles.forEach(file => {
        formData.append('media', file);
      });

      const response = await axios.post(REPLIES_URL, formData, {
        headers: {
          ...getAuthHeaders(),  // Fixed: Call getAuthHeaders as a function
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 201) {
        emitNewReply({
          ...response.data.reply,
          topicId: topicId,
          userName: loginData.validuserone.userName,
          userId: loginData.validuserone._id
        });
        
        setNewReply('');
        setSelectedFiles([]);
        resetPostingData();
      }
    } catch (err) {
      console.error('Error posting reply:', err);
      if (handleAuthError(err, setError)) {
        return;
      }
      setError('Failed to post reply. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratedResult = (result) => {
    const { originalPrompt, currentText, prompt, generatedImageUrl } = result || {};

    setPostingData((prev) => ({
      ...prev,
      userText:
        originalPrompt != null
          ? [...prev.userText, originalPrompt]
          : prev.userText,
      AiText: currentText != null ? [...prev.AiText, currentText] : prev.AiText,
      prompt: prompt != null ? [...prev.prompt, prompt] : prev.prompt,
      imageUrl:
        generatedImageUrl != null
          ? [...(prev.imageUrl || []), generatedImageUrl]
          : prev.imageUrl || [],
    }));
  };

  return (
    <div className="relative bottom-0 left-0 right-0 bg-bg_comment_box shadow-lg  z-50 p-2">
      {/* for showing user generated content */}
      <div className="max-h-[500px] overflow-y-auto">
         <ShowGeneratedContent postingData={postingData} />
      </div>
      {/* for showing model and userName you want to */}
      <UserAndModel />
      <form >
        <div className="flex mb-2">
          <input
            type="text"
            className="flex-1 border border-gray-200 rounded-md p-3 mr-2 text-sm"
            placeholder="Write your reply..."
            value={newReply}
            onChange={(e) => setNewReply(e.target.value)}
            disabled={isLoading}
          />
          {!anyControlBitTrue && (
            <button
            type="submit"
            onClick={handleSubmit}
              className="bg-blue-600 text-white rounded-md px-4 py-2 text-sm hover:bg-blue-700 disabled:opacity-50"
              disabled={isLoading || !newReply.trim()}
            >
              {isLoading ? "Posting..." : "Post"}
            </button>
          )}
          {anyControlBitTrue && (
            <button
              type="submit"
              onClick={handleGenerateSubmit}
              className="bg-green-600 text-white rounded-md px-4 py-2 text-sm hover:bg-blue-700 disabled:opacity-50"
              disabled={loading || !newReply.trim()}
            >
              {loading ? "Generating..." : "Generate"}
            </button>
          )}
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-0.5">
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

            <div className="flex flex-wrap gap-0.5">
              <button
                type="button"
                onClick={() => toggleControl("enhancePrompt")}
                className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm transition-colors ${
                  formData.controlBits.enhancePrompt
                    ? "bg-blue-100 text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <SparkIcon />
                Enhanced Prompt
              </button>

              <button
                type="button"
                onClick={() => toggleControl("generateText")}
                className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm transition-colors ${
                  formData.controlBits.generateText
                    ? "bg-blue-100 text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <PenIcon />
                Generate Text
              </button>

              <button
                type="button"
                onClick={() => toggleControl("generateImage")}
                className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm transition-colors ${
                  formData.controlBits.generateImage
                    ? "bg-blue-100 text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Pallete />
                Generate Image
              </button>

              <button
                type="button"
                onClick={() => toggleControl("processContextAware")}
                className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm transition-colors ${
                  formData.controlBits.processContextAware
                    ? "bg-blue-100 text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <BrainIcon />
                Context Aware
              </button>
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

// contextAwareResponse
// :
// null
// currentText
// :
// "Absolutely, I would love to assist you with content creation! However, I need a bit more information to ensure that what I generate aligns with your needs. Could you please provide more details like the topic, target audience, format (blog, social media post, article), and any specific points you want me to include in the content? The more details you provide, the better I can assist you!"
// enhancedPrompt
// :
// null
// generatedImage
// :
// null
// generatedImageUrl
// :
// null
// generatedText
// :
// "Absolutely, I would love to assist you with content creation! However, I need a bit more information to ensure that what I generate aligns with your needs. Could you please provide more details like the topic, target audience, format (blog, social media post, article), and any specific points you want me to include in the content? The more details you provide, the better I can assist you!"
// originalPrompt
// :
// "generate my content"
// processingSteps
// :
// ['textSuggestion']

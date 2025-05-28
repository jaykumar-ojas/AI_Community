import React, { useContext, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from 'axios';
import { useParams } from "react-router-dom";

import { getAuthHeaders, handleAuthError, REPLIES_URL } from "../../AiForumPage/components/ForumUtils";
import { LoginContext } from "../../ContextProvider/context";
import { useWebSocket } from "../../AiForumPage/components/WebSocketContext";
import ImageGenerator from "../../TopicComponent/components/ImageGenerator";
import AiTextContent from "../../TopicComponent/components/AiTextContent";
import { ForumContext } from "../../ContextProvider/ModelContext";
import { AttachIcon,AiResponseIcon,GenerateIcon } from "../../../asset/icons";


const ReplyCommentBox = ({onClose}) => {
  const {setReplyIdForContext,model,setModel} = useContext(ForumContext);
  const { topicId } = useParams();
  const { loginData } = useContext(LoginContext);
  const { emitNewReply } = useWebSocket();

  const [newReply, setNewReply] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState();
  const [showImageGenerator, setShowImageGenerator] = useState(false);
  const [showAITextResponse, setShowAITextResponse] = useState();
  const {replyIdForContext,userName} = useContext(ForumContext);

  const handleFileSelect = (e) => {
    setSelectedFiles(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newReply.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('content', newReply);
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
          ...getAuthHeaders(),
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 201) {
        console.log('Emitting new reply:', response.data.reply);
        // Emit the new reply event with the complete reply object
        emitNewReply({
          ...response.data.reply,
          topicId: topicId,
          userName: loginData.validuserone.userName,
          userId: loginData.validuserone._id
        });
        
        // Clear the form
        setNewReply('');
        setSelectedFiles([]);
        if (onClose) onClose();
      }
    } catch (err) {
      if (handleAuthError(err, setError)) {
        return;
      }
      console.error('Error posting reply:', err);
      setError('Failed to post reply. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>     
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ duration: 0.4 }}
        className="relative bottom-0 left-0 right-0 bg-bg_comment_box shadow-lg border-t border-gray-200 z-50 p-4"
      >
          <div className="pb-4 text-sm text-gray-700 flex justify-between items-center">
            <span>
            {replyIdForContext && (
                <span>
                  Replying to <span className="font-medium text-blue-600">@{userName}</span>
                </span>
              )}
              {model && <span className="inline-flex items-center font-medium  ml-4 rounded-lg text-green-600 bg-gray-200 border border-gray-400">
                @{model}
                <button
                  onClick={() => setModel(null)}
                  className="ml-2 text-gray-600 hover:text-red-600 font-bold"
                  aria-label="Remove model"
                >
                  ×
                </button>
              </span>}
            </span>
          </div>
        <form onSubmit={handleSubmit}>
          <div className="flex mb-2">
            <input
              type="text"
              className="flex-1 border border-gray-200 rounded-md p-3 mr-2 text-sm"
              placeholder="Write your reply..."
              value={newReply}
              onChange={(e) => setNewReply(e.target.value)}
              disabled={isLoading}
            />
            <button
              type="submit"
              className="bg-blue-600 text-white rounded-md px-4 py-2 text-sm hover:bg-blue-700 disabled:opacity-50"
              disabled={isLoading || !newReply.trim()}
            >
              {isUploading ? "Posting..." : "Post"}
            </button>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <label className="text-gray-500 hover:text-gray-700 cursor-pointer mr-3 text-sm flex items-center">
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

              <button
                type="button"
                onClick={() => setShowImageGenerator(true)}
                className="text-gray-500 hover:text-gray-700 text-sm flex items-center mr-3"
                disabled={isLoading}
              >
                <GenerateIcon /> Generate Image
              </button>

              <button
                type="button"
                onClick={() => setShowAITextResponse(true)}
                className="text-gray-500 hover:text-gray-700 text-sm flex items-center"
                disabled={isLoading}
              >
                <AiResponseIcon /> AI Response
              </button>
            </div>

            <button
              onClick={onClose}
              type="button"
              className="text-sm text-red-500 hover:underline"
            >
              Close
            </button>
          </div>

          {selectedFiles.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {selectedFiles.map((file, index) => (
                <div key={index} className="text-xs bg-gray-100 p-1 rounded flex items-center">
                  <span className="truncate max-w-[100px]">{file.name}</span>
                  <button
                    type="button"
                    className="ml-1 text-gray-500 hover:text-red-500"
                    onClick={() => setSelectedFiles(files => files.filter((_, i) => i !== index))}
                  >×</button>
                </div>
              ))}
            </div>
          )}
        </form>

        {showImageGenerator && (
          <ImageGenerator onClose={setShowImageGenerator} setNewReply={setNewReply} setSelectedFiles={setSelectedFiles} />
        )}
        {showAITextResponse && (
          <AiTextContent onClose={setShowAITextResponse} setNewReply={setNewReply} />
        )}
      </motion.div>
    
    </AnimatePresence>
  );
};

export default ReplyCommentBox;



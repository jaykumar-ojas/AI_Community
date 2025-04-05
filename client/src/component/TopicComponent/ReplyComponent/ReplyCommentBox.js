import React, { useContext, useState } from "react";
import { getAuthHeaders, handleAuthError, REPLIES_URL } from "../../AiForumPage/components/ForumUtils";
import axios from 'axios';
import { LoginContext } from "../../ContextProvider/context";
import { useWebSocket } from "../../AiForumPage/components/WebSocketContext";
import ImageGenerator from "../components/ImageGenerator";
import AiTextContent from "../components/AiTextContent";
import { useParams } from "react-router-dom";

const ReplyCommentBox =({replyId})=>{
    const {topicId} = useParams();
    const [newReply,setNewReply] = useState("");
    const {loginData} = useContext(LoginContext);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [isLoading,setIsLoading] = useState(false);
    const [isUploading,setIsUploading] = useState(false);
    const [error,setError] = useState();
    const [showImageGenerator,setShowImageGenerator] = useState(false);
    const {emitNewReply} = useWebSocket();
    const [showAITextResponse, setShowAITextResponse] = useState();

    const handleFileSelect = (e, isReply = false) => {
        const files = Array.from(e.target.files);
        if (isReply) {
        //   setReplySelectedFiles(files);
        } else {
          setSelectedFiles(files);
        }
    };

    const handlePostReply = async () => {
        if (!loginData || !loginData.validuserone) {
          alert('Please log in to reply');
          return;
        }
    
        const content = newReply;
        const files = selectedFiles;
    
        if (!content.trim()) {
          alert  ('Please enter a reply');
          return;
        }
    
        setIsLoading(true);
        setIsUploading(true);
        setError(null);
        
        try {
          const formData = new FormData();
          formData.append('content', content);
          formData.append('topicId', topicId);
          formData.append('userId', loginData.validuserone._id);
          formData.append('userName', loginData.validuserone.userName);
          formData.append('parentReplyId', replyId);
    
          // Append media files if any
          files.forEach(file => {
            if (file.url) {
              // If it's an S3 URL, append it directly
              formData.append('mediaUrls', file.url);
            } else {
              // If it's a regular file, append it as before
              formData.append('media', file);
            }
          });
    
          const response = await axios.post(REPLIES_URL, formData, { 
            headers: {
              ...getAuthHeaders(),
              'Content-Type': 'multipart/form-data'
            }
          });     
          
          // Emit socket event for new reply
          emitNewReply(response.data.reply);
          setNewReply('');
          setSelectedFiles([]);
        } catch (err) {
          if (handleAuthError(err, setError)) {
            return;
          }
          console.error('Error posting reply:', err);
          setError('Failed to post reply. Please try again later.');
        } finally {
          setIsLoading(false);
          setIsUploading(false);
        }
      };

    return (
        <div className="p-4 bg-white border-t border-gray-200">
        <form onSubmit={(e) => {
          e.preventDefault();
          if (newReply.trim()) {
            handlePostReply();
          }
        }}>
          <div className="flex flex-col">
            <div className="flex mb-2">
              <input
                id="mainReplyInput"
                type="text"
                className="flex-1 border border-gray-200 rounded-md p-3 mr-2 text-sm"
                placeholder="Write your reply..."
                value={newReply}
                onChange={(e) => setNewReply(e.target.value)}
                disabled={isLoading}
              />
              <button 
                type="submit"
                className="bg-blue-600 text-white rounded-md px-4 py-2 text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center"
                disabled={isLoading || !newReply.trim() || !loginData}
              >
                {isUploading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Posting...
                  </>
                ) : (
                  'Post'
                )}
              </button>
            </div>
            
            <div className="flex items-center justify-between">
               <div className="flex items-center">
                <label className="text-gray-500 hover:text-gray-700 cursor-pointer mr-3 flex items-center text-sm">
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*,audio/*"
                    onChange={(e) => handleFileSelect(e, false)}
                    className="hidden"
                    disabled={isLoading}
                  />
                  <AttachIcon />
                  Attach
                </label>
                
                
                <button
                  type="button"
                  onClick={() => setShowImageGenerator(true)}
                  className="text-gray-500 hover:text-gray-700 flex items-center text-sm mr-3"
                  disabled={isLoading}
                >
                 <GenerateIcon/>
                  Generate Image
                </button>

        
                <button
                  type="button"
                  onClick={() =>setShowAITextResponse(true)}
                  className="text-gray-500 hover:text-gray-700 flex items-center text-sm"
                  disabled={isLoading}
                >
                 <AiResponseIcon/>
                  AI Response
                </button>
              </div>
              
              {selectedFiles.length > 0 && (
                <div className="text-xs text-gray-500">
                  {selectedFiles.length} file(s) selected
                </div>
              )}
            </div>
            
            {selectedFiles.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="relative group">
                    <div className="bg-gray-100 rounded p-1 text-xs flex items-center">
                      <span className="truncate max-w-[100px]">{file.name}</span>
                      <button 
                        type="button"
                        className="ml-1 text-gray-500 hover:text-red-500"
                        onClick={() => setSelectedFiles(files => files.filter((_, i) => i !== index))}
                      >
                        ×
                      </button>
                    </div>
                    {file.type.startsWith('image/') && (
                      <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-10">
                        <img 
                          src={file.url} 
                          alt="Preview" 
                          className="max-w-[150px] max-h-[150px] rounded shadow-lg border border-gray-200" 
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>
        {showImageGenerator && <ImageGenerator onClose = {setShowImageGenerator} setNewReply= {setNewReply} setSelectedFiles = {setSelectedFiles}/> }
        {showAITextResponse && <AiTextContent onClose = {setShowAITextResponse} setNewReply= {setNewReply} /> }

      </div>
    )
};

export default ReplyCommentBox;


const AttachIcon =()=>{
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
        </svg>
    )
};

const AiResponseIcon =()=>{
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    )
};

const GenerateIcon =()=>{
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    )
};
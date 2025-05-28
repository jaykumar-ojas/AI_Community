import React, { useState } from 'react';
import axios from 'axios';
import { getAuthHeaders, handleAuthError, REPLIES_URL } from '../ForumUtils';

const ReplyForm = ({
  content,
  setContent,
  selectedFiles,
  setSelectedFiles,
  isReplyingToComment = false,
  parentUserName = null,
  loginData,
  topic,
  parentReplyId = null,
  emitNewReply,
  setError,
  onReplyComplete,
  threadColor = 'border-blue-400' // Default thread color
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
  };

  // Handle posting a reply
  const handlePostReply = async () => {
    if (!loginData || !loginData.validuserone) {
      alert('Please log in to reply');
      return;
    }

    if (!content.trim() || !topic) {
      alert('Please enter a reply');
      return;
    }

    setIsLoading(true);
    setIsUploading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('content', content);
      formData.append('topicId', topic._id);
      formData.append('userId', loginData.validuserone._id);
      formData.append('userName', loginData.validuserone.userName);
      if (parentReplyId) {
        formData.append('parentReplyId', parentReplyId);
      }

      // Append media files if any
      selectedFiles.forEach(file => {
        formData.append('media', file);
      });

      // Create a temporary reply for immediate UI update
      const tempReply = {
        _id: `temp-${Date.now()}`, // Temporary ID that will be replaced
        content: content,
        topicId: topic._id,
        userId: loginData.validuserone._id,
        userName: loginData.validuserone.userName,
        parentReplyId: parentReplyId || null,
        createdAt: new Date().toISOString(),
        likes: [],
        dislikes: [],
        mediaAttachments: selectedFiles.map(file => ({
          fileName: file.name,
          fileType: file.type,
          signedUrl: URL.createObjectURL(file)
        }))
      };

      // Emit the temporary reply for immediate UI update
      emitNewReply(tempReply);
      
      // Reset form and call completion handler immediately
      setContent('');
      setSelectedFiles([]);
      if (onReplyComplete) {
        onReplyComplete();
      }

      // Now make the actual API call
      const response = await axios.post(REPLIES_URL, formData, { 
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // The server response will come through the WebSocket event
      // We've already updated the UI with the temporary reply
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

  const handleCancel = () => {
    if (onReplyComplete) {
      onReplyComplete();
    }
  };

  // Get text color from border color
  const getTextColor = () => {
    return threadColor.replace('border', 'text');
  };

  return (
    <div className={`${isReplyingToComment ? 'p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm transition-shadow duration-300 hover:shadow-md' : ''}`}>
      {isReplyingToComment && parentUserName && (
        <div className="text-xs text-gray-600 mb-2 font-medium">
          Replying to <span className={`font-semibold ${getTextColor()} hover:underline cursor-pointer`}>{parentUserName}</span>
        </div>
      )}
      
      {isReplyingToComment ? (
        <textarea
          className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 ${threadColor.replace('border', 'ring')} resize-none text-sm transition-all duration-200`}
          rows="3"
          placeholder="Write your reply..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={isLoading}
        />
      ) : (
        <div className="flex">
          <input
            id="mainReplyInput"
            type="text"
            className="flex-1 border border-gray-200 rounded-l-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200"
            placeholder="Write your reply..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isLoading}
          />
          <button
            onClick={handlePostReply}
            className="bg-blue-600 text-white font-medium rounded-r-md px-4 py-2 flex items-center hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
            disabled={isLoading || !content.trim() || !loginData}
          >
            {isUploading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading...
              </>
            ) : (
              'Send'
            )}
          </button>
        </div>
      )}
      
      <div className="mt-2">
        <div className="relative group">
          <input
            type="file"
            multiple
            accept="image/*,video/*,audio/*"
            onChange={handleFileSelect}
            className={`w-full px-2 py-1 border rounded-md focus:outline-none focus:ring-2 ${threadColor.replace('border', 'ring')} text-sm transition-all duration-200 file:mr-4 file:py-1 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer`}
            disabled={isLoading}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-white opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300"></div>
        </div>
        {selectedFiles.length > 0 && (
          <div className="mt-2">
            <p className="text-xs text-gray-600">Selected files:</p>
            <div className="flex flex-wrap gap-2 mt-1">
              {selectedFiles.map((file, index) => (
                <div key={index} className={`text-xs bg-gray-100 rounded px-2 py-1 flex items-center border ${threadColor} transition-all duration-200 hover:shadow-sm`}>
                  {file.name.substring(0, 15)}{file.name.length > 15 ? '...' : ''} 
                  <button 
                    className="ml-1 text-gray-500 hover:text-red-500 transition-colors duration-200"
                    onClick={() => setSelectedFiles(files => files.filter((_, i) => i !== index))}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {isReplyingToComment && (
        <div className="flex justify-end mt-2 space-x-2">
          <button
            className="px-3 py-1 text-gray-600 text-sm hover:text-gray-800 transition-colors duration-200 hover:bg-gray-100 rounded"
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button
            className={`px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center transition-colors duration-200`}
            onClick={handlePostReply}
            disabled={isLoading || !content.trim() || !loginData}
          >
            {isUploading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading...
              </>
            ) : (
              'Reply'
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default ReplyForm;

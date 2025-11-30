import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { LoginContext } from '../../ContextProvider/context';
import { useWebSocket } from './WebSocketContext';
import { getAuthHeaders, handleAuthError, TOPICS_URL } from './ForumUtils';
import AiContentGenerator from './AiContentGenerator';
import { useNavigate } from 'react-router-dom';
import { encodeId } from '../../../utils/hashids';
import { AttachIcon, SparklesIcon } from "../../../asset/icons";

const NewTopicModal = ({ onClose }) => {
  const { loginData } = useContext(LoginContext);
  const { emitNewTopic } = useWebSocket();
  const [showAiContent, setShowAiContent] = useState(false);
  const [newTopic, setNewTopic] = useState({ title: '', content: '' });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [aiGeneratedContent, setAiGeneratedContent] = useState({ title: '', content: '' });
  const [modelInfo, setModelInfo] = useState(null);



  // Update form when AI-generated content is provided
  useEffect(() => {
    if (aiGeneratedContent.title && aiGeneratedContent.content) {
      setNewTopic({
        title: aiGeneratedContent.title,
        content: aiGeneratedContent.content
      });
    }
  }, [aiGeneratedContent]);

  // Handle AI content generation completion
  const handleAiContentGenerated = (content, modelData) => {
    setAiGeneratedContent(content);
    setModelInfo(modelData);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
  };
  const navigate = useNavigate();

  const handleCreateTopic = async () => {
    if (!loginData || !loginData.validuserone) {
      alert('Please log in to create a topic');
      return;
    }

    if (!newTopic.title.trim() || !newTopic.content.trim()) {
      alert('Please provide both title and content for your topic');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('title', newTopic.title);
      formData.append('content', newTopic.content);
      formData.append('userId', loginData.validuserone._id);
      formData.append('userName', loginData.validuserone.userName);

      // If there's a generated image URL, add it to the form data
      if (newTopic.imageUrl) {
        formData.append('imageUrl', newTopic.imageUrl);
      }

      // Append media files if any
      selectedFiles.forEach(file => {
        formData.append('media', file);
      });

      const response = await axios.post(TOPICS_URL, formData, {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'multipart/form-data'
        }
      });

      // Emit socket event for new topic
      emitNewTopic(response.data.topic);
      navigate(`/forum/topic/${encodeId(response.data.topic._id)}`);
      // Reset form and close modal
      setNewTopic({ title: '', content: '' });
      setSelectedFiles([]);
      onClose();
    } catch (err) {
      if (handleAuthError(err, setError)) {
        return;
      }
      setError('Failed to create topic. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-opacity-50 bg-black/80 z-50 flex items-center justify-center overflow-y-auto">
      <div className="bg-nav_hover text-low_text font-playfair rounded-lg shadow-xl w-full max-w-2xl my-8 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-4 pb-0">
          <h3 className="text-2xl font-bold">Create A Community</h3>
          <div className='flex gap-2'>
            <button
              onClick={() => setShowAiContent(true)}
              className="py-1 px-2 bg-pink-600 text-white font-playfair font-semibold rounded-lg hover:bg-pink-800 flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Generate with AI
            </button>
            <button onClick={onClose} className="hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {error && (
          <div className="mx-4 mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="p-4 overflow-y-auto flex-grow">
          <div className="mb-2">
            <label className="block text-xl font-semibold mb-1">Title</label>
            <textarea
              type="text"
              className="w-full px-2 py-1 min-h-16 bg-nav_hover2 font-poppins text-low_text text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-theme_color4"
              placeholder="Topic title"
              value={newTopic.title}
              onChange={(e) => setNewTopic({ ...newTopic, title: e.target.value })}
            />
          </div>
          <div className="mb-4">
            <label className="block text-xl font-semibold mb-1">Content</label>
            <div className="relative">
              <textarea
                className="w-full px-3 py-2 font-poppins bg-nav_hover2 text-low_text text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-theme_color4 min-h-28"
                value={newTopic.content}
                onChange={(e) => setNewTopic({ ...newTopic, content: e.target.value })}
              />
            </div>
            {newTopic.imageUrl && (
              <div className="mt-2">
                <img
                  src={newTopic.imageUrl}
                  alt="Generated topic image"
                  className="w-20 h-20 inline-block"
                />
              </div>
            )}
          </div>

          <label className='flex'>
            <input
              type="file"
              multiple
              accept="image/*,video/*,audio/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className='flex cursor-pointer p-1 px-2 gap-1 rounded-lg bg-nav_hover3 hover:bg-nav_hover2'>
              <AttachIcon height={8} smHeight={5} />
              Attach
            </div>

          </label>
          {selectedFiles.length > 0 && (
            <div className="mt-2">
              <p className="text-sm text-gray-600">Selected files:</p>
              <ul className="mt-1 space-y-1">
                {selectedFiles.map((file, index) => (
                  <li key={index} className="text-sm text-gray-500">
                    {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>

        <div className="flex justify-end gap-2 p-4 ">
          <button onClick={onClose} className="px-4 py-2 font-manrope font-semibold text-black bg-gray-100 rounded-lg hover:bg-gray-200">
            Cancel
          </button>
          <button
            onClick={handleCreateTopic}
            className="px-4 py-2 text-black font-semibold font-manrope bg-theme_color2 rounded-lg hover:bg-theme_color"
            disabled={!newTopic.title.trim() || !newTopic.content.trim() || isLoading}
          >
            {isLoading ? "Creating..." : "Create Topic"}
          </button>
        </div>
      </div>

      {showAiContent && (
        <AiContentGenerator
          onClose={() => setShowAiContent(false)}
          setNewTopic={(content) => {
            setNewTopic(content);
            // If content has modelInfo, store it
            if (content.modelInfo) {
              setModelInfo(content.modelInfo);
            }
          }}
        />
      )}
    </div>
  );
};

export default NewTopicModal;

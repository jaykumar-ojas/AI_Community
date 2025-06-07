import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { LoginContext } from '../../ContextProvider/context';
import { useWebSocket } from './WebSocketContext';
import { getAuthHeaders, handleAuthError, TOPICS_URL } from './ForumUtils';
import AiContentGenerator from './AiContentGenerator';

const NewTopicModal = ({ onClose }) => {
  const { loginData } = useContext(LoginContext);
  const { emitNewTopic } = useWebSocket();
  const [showAiContent, setShowAiContent] = useState(false);
  const [newTopic, setNewTopic] = useState({ title: '', content: '' });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [aiGeneratedContent, setAiGeneratedContent] = useState({ title: '', content: '' });

  console.log("AI Content Modal State:", showAiContent);

  useEffect(() => {
    console.log("NewTopicModal Mounted");
  }, []);

  // Update form when AI-generated content is provided
  useEffect(() => {
    if (aiGeneratedContent.title && aiGeneratedContent.content) {
      setNewTopic({
        title: aiGeneratedContent.title,
        content: aiGeneratedContent.content
      });
    }
  }, [aiGeneratedContent]);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
  };

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

      // Reset form and close modal
      setNewTopic({ title: '', content: '' });
      setSelectedFiles([]);
      onClose();
    } catch (err) {
      if (handleAuthError(err, setError)) {
        return;
      }
      console.error('Error creating topic:', err);
      setError('Failed to create topic. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 mt-20 flex items-center justify-center overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-xl my-8 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">Create New Topic</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mx-4 mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="p-4 overflow-y-auto flex-grow">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              className="w-full px-3  border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Topic title"
              value={newTopic.title}
              onChange={(e) => setNewTopic({ ...newTopic, title: e.target.value })}
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
            <div
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
              contentEditable={true}
              onInput={(e) => setNewTopic({ ...newTopic, content: e.currentTarget.textContent })}
              dangerouslySetInnerHTML={{ __html: newTopic.content }}
            />
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

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Media Attachments</label>
            <input
              type="file"
              multiple
              accept="image/*,video/*,audio/*"
              onChange={handleFileSelect}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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

          {/* AI Content Generation Button */}
          <div className="mb-4 border-t pt-4">
            <button
              onClick={() => setShowAiContent(true)}
              className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Generate Content with AI
            </button>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Let AI help you create engaging content for your topic
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t mt-auto">
          <button onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
            Cancel
          </button>
          <button
            onClick={handleCreateTopic}
            className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            disabled={!newTopic.title.trim() || !newTopic.content.trim() || isLoading}
          >
            {isLoading ? "Creating..." : "Create Topic"}
          </button>
        </div>
      </div>

      {showAiContent && <AiContentGenerator onClose={() => setShowAiContent(false)} setNewTopic = {setNewTopic} />}
    </div>
  );
};

export default NewTopicModal;

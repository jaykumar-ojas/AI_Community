import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { LoginContext } from '../ContextProvider/context';
import { formatDate, getAuthHeaders, handleAuthError, API_BASE_URL } from '../AiForumPage/components/ForumUtils';
import TopicContent from '../TopicComponent/TopicContent';

// Component for AI models in the sidebar
function ModelItem({ name, active = false, onClick }) {
  return (
    <li 
      className={`px-2 py-2 rounded-md cursor-pointer transition-colors ${active ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'}`}
      onClick={() => onClick(name)}
    >
      <div>{name}</div>
    </li>
  );
}

// Component for forum messages
function ForumMessage({ message, isCommand = false, isAI = false, userName = '', timestamp = null }) {
  return (
    <div className={`mb-4 ${isAI ? 'bg-blue-50' : 'bg-white'} p-4 rounded-lg shadow-sm`}>
      {userName && (
        <div className="flex items-center mb-2">
          <span className="font-medium text-blue-600 mr-2">{userName}</span>
          {timestamp && <span className="text-xs text-gray-500">{formatDate(timestamp)}</span>}
        </div>
      )}
      <div className="text-sm leading-relaxed">
        {isCommand ? (
          <div className="text-gray-500">{message}</div>
        ) : (
          <div>{message}</div>
        )}
      </div>
    </div>
  );
}

const ChatBotForum = ({ topicId = null, onBack }) => {
  const { loginData } = useContext(LoginContext);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [topic, setTopic] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedModel, setSelectedModel] = useState('GPT-4');
  
  // Fetch topic and replies when topicId changes
  // Handle model selection
  const handleModelSelect = (modelName) => {
    setSelectedModel(modelName);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-60 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-5 font-semibold text-lg border-b border-gray-200">
          chat bot forum
        </div>
        
        {/* AI Models Section */}
        <div className="p-4">
          <div className="font-semibold mb-2 text-sm">all ai's</div>
          <ul className="space-y-1">
            <ModelItem name="GPT-4" active={selectedModel === "GPT-4"} onClick={handleModelSelect} />
            <ModelItem name="DALL-E" active={selectedModel === "DALL-E"} onClick={handleModelSelect} />
            <ModelItem name="Claude" active={selectedModel === "Claude"} onClick={handleModelSelect} />
            <ModelItem name="Stable Diffusion" active={selectedModel === "Stable Diffusion"} onClick={handleModelSelect} />
            <ModelItem name="Midjourney" active={selectedModel === "Midjourney"} onClick={handleModelSelect} />
          </ul>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header with back button for topic view */}
        {topicId && (
          <div className="bg-white border-b border-gray-200 p-4 flex items-center">
            <button 
              onClick={onBack} 
              className="mr-3 text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h2 className="font-semibold text-lg">{topic?.title || 'Topic Discussion'}</h2>
          </div>
        )}
        
        {/* Chat Container */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <TopicContent/>
        </div>
      </div>
    </div>
  );
}

export default ChatBotForum;
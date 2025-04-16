import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { LoginContext } from '../ContextProvider/context';
import { formatDate, getAuthHeaders, handleAuthError, API_BASE_URL } from '../AiForumPage/components/ForumUtils';
import TopicContent from '../TopicComponent/TopicContent';
import { ForumContext } from '../ContextProvider/ModelContext';
import ReplyCommentBox from './Component/ReplyCommentBox';
import ModelList from './Component/ModelList';

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
  const {viewBox,setViewBox,replyId,model,replyIdForContext,setReplyIdForContext} = useContext(ForumContext);
  
  
  // Fetch topic and replies when topicId changes
  // Handle model selection
  const handleModelSelect = (modelName) => {
    setSelectedModel(modelName);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <ModelList></ModelList>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        
        {/* Chat Container */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <TopicContent/>
        </div>
        <div className="relative w-full">
        {viewBox && <ReplyCommentBox onClose={()=>{
          setReplyIdForContext(null);
          setViewBox(false);
          }} />}
        </div>
      </div>
    </div>
  );
}

export default ChatBotForum;
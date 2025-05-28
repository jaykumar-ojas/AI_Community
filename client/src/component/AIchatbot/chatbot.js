import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { LoginContext } from '../ContextProvider/context';
import { formatDate, getAuthHeaders, handleAuthError, API_BASE_URL } from '../AiForumPage/components/ForumUtils';
import TopicContent from '../TopicComponent/TopicContent';
import { ForumContext } from '../ContextProvider/ModelContext';
import ReplyCommentBox from './Component/ReplyCommentBox';
import ModelList from './Component/ModelList';
import PopularTopics from '../AiForumPage/components/PopularTopics';

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
    <div className="flex h-screen bg-bg_comment">
      {/* Sidebar */}
      <div className='w-[15%]'>
        <ModelList></ModelList>
      </div>
      
      
      {/* Main Content */}
      <div className="flex-1 min-h-screen flex flex-col w-[60%]">
        
        {/* Chat Container */}
        <div className="flex-1">
          <TopicContent/>
        </div>
      </div>
      <div className="text-lg text-text_header h-[calc(100vh-3.5rem)] w-[20%] flex flex-col">
  <div className="font-semibold text-lg mb-2">
    Popular discussions you may like
  </div>
  <div className="flex-1 overflow-y-auto no-scrollbar">
    <PopularTopics />
  </div>
</div>


    </div>
  );
}

export default ChatBotForum;
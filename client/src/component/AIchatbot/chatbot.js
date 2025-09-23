import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { LoginContext } from '../ContextProvider/context';
import { formatDate, getAuthHeaders, handleAuthError, API_BASE_URL } from '../AiForumPage/components/ForumUtils';
import TopicContent from '../TopicComponent/TopicContent';
import { ForumContext } from '../ContextProvider/ModelContext';
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
  const [showModels, setShowModels] = useState(false);
  const [showPopular, setShowPopular] = useState(false);
  
  
  // Fetch topic and replies when topicId changes
  // Handle model selection
  const handleModelSelect = (modelName) => {
    setSelectedModel(modelName);
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] relative overflow-hidden bg-transparent">
      <div className='hidden md:block h-[calc(100vh-3.5rem)] bg-neutral-100 dark:bg-bg_sidebar/50 border-r border-gray-300 dark:border-gray-800 w-[18%]'>
        <ModelList forum={true} />
      </div>

      <div className="flex-1 px-2 sm:px-4 flex flex-col">
        {/* <div className="md:hidden sticky top-0 z-10 bg-black/40 backdrop-blur-sm border-b border-gray-800 px-2 py-2 flex gap-2">
          <button
            onClick={() => setShowModels(true)}
            className="flex-1 py-2 text-sm rounded-md bg-btn_bg text-text_header"
          >
            Models
          </button>
          <button
            onClick={() => setShowPopular(true)}
            className="flex-1 py-2 text-sm rounded-md bg-btn_bg text-text_header"
          >
            Popular
          </button>
        </div> */}

        <div className="flex-1 mb-8 md:mb-0 overflow-y-auto">
          <TopicContent />
        </div>
      </div>

      <div className="hidden md:flex text-lg text-gray-800 dark:text-text_header h-[calc(100vh-3.5rem)] bg-neutral-100 dark:bg-bg_sidebar/50 border-l border-gray-300 dark:border-gray-800 w-[22%] flex-col">
        <div className="font-semibold text-lg p-2">Popular discussions you may like</div>
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <PopularTopics />
        </div>
      </div>

      {/* {showPopular && (
        <div className="md:hidden fixed inset-0 z-20">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowPopular(false)} />
          <div className="absolute right-0 top-0 h-full w-10/12 max-w-sm bg-bg_sidebar/95 border-l border-black shadow-xl flex flex-col">
            <div className="flex items-center justify-between p-3 border-b border-gray-800">
              <div className="text-text_header">Popular</div>
              <button className="text-text_header" onClick={() => setShowPopular(false)}>✕</button>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar">
              <PopularTopics />
            </div>
          </div>
        </div>
      )} */}
    </div>
  );
}

export default ChatBotForum;
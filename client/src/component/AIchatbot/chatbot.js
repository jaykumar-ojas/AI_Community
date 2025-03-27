import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { LoginContext } from '../ContextProvider/context';
import { formatDate, getAuthHeaders, handleAuthError, API_BASE_URL } from '../AiForumPage/components/ForumUtils';

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
  useEffect(() => {
    if (topicId) {
      fetchTopic(topicId);
      fetchReplies(topicId);
    } else {
      // Default messages for new chat
      setMessages([
        { content: "Welcome to the AI chatbot. How can I help you today?", isAI: true }
      ]);
    }
  }, [topicId]);

  // Fetch topic details
  const fetchTopic = async (id) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_BASE_URL}/forum/topics/${id}`, {
        headers: getAuthHeaders()
      });
      
      setTopic(response.data.topic);
      
      // Add topic as first message
      setMessages([
        {
          content: response.data.topic.content,
          userName: response.data.topic.userName,
          timestamp: response.data.topic.createdAt,
          isAI: false
        }
      ]);
    } catch (err) {
      if (handleAuthError(err, setError)) {
        return;
      }
      console.error('Error fetching topic:', err);
      setError('Failed to load topic. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch replies for a topic
  const fetchReplies = async (id) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_BASE_URL}/forum/replies?topicId=${id}`, {
        headers: getAuthHeaders()
      });
      
      // Add replies to messages
      if (response.data.replies && response.data.replies.length > 0) {
        setMessages(prevMessages => [
          ...prevMessages,
          ...response.data.replies.map(reply => ({
            content: reply.content,
            userName: reply.userName,
            timestamp: reply.createdAt,
            isAI: reply.isAI || false,
            replyId: reply._id
          }))
        ]);
      }
    } catch (err) {
      if (handleAuthError(err, setError)) {
        return;
      }
      console.error('Error fetching replies:', err);
      setError('Failed to load replies. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle posting a reply
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const isCommand = inputValue.startsWith('/');
    
    // Add user message to chat
    setMessages([...messages, { 
      content: inputValue, 
      isCommand,
      userName: loginData?.validuserone?.userName || 'You',
      timestamp: new Date(),
      isAI: false
    }]);
    
    // Clear input
    setInputValue('');
    
    // If this is a topic view, post reply to backend
    if (topicId && !isCommand) {
      await postReply(inputValue);
    }
    
    // If it's a command or not a topic view, simulate AI response
    if (isCommand || !topicId) {
      // Simulate AI thinking
      setTimeout(() => {
        let aiResponse = "I'm processing your request...";
        
        if (isCommand) {
          if (inputValue.startsWith('/dalle')) {
            aiResponse = "DALL-E is generating an image based on your prompt: " + inputValue.substring(7);
          } else if (inputValue.startsWith('/gpt')) {
            aiResponse = "GPT is thinking about your question: " + inputValue.substring(5);
          } else {
            aiResponse = "Unknown command. Available commands: /dalle, /gpt";
          }
        } else {
          aiResponse = `As ${selectedModel}, I'd be happy to help with that! What specific information are you looking for?`;
        }
        
        // Add AI response
        setMessages(prevMessages => [...prevMessages, { 
          content: aiResponse, 
          isAI: true,
          userName: selectedModel,
          timestamp: new Date()
        }]);
      }, 1000);
    }
  };

  // Post reply to backend
  const postReply = async (content) => {
    if (!loginData || !loginData.validuserone) {
      setError('Please log in to reply');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('content', content);
      formData.append('topicId', topicId);
      formData.append('userId', loginData.validuserone._id);
      formData.append('userName', loginData.validuserone.userName);
      formData.append('isAI', false);

      await axios.post(`${API_BASE_URL}/forum/replies`, formData, { 
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Simulate AI response for topic replies
      setTimeout(() => {
        const aiResponse = `As ${selectedModel}, I've analyzed your message. Would you like me to elaborate on any specific aspect?`;
        
        // Add AI response and post to backend
        setMessages(prevMessages => [...prevMessages, { 
          content: aiResponse, 
          isAI: true,
          userName: selectedModel,
          timestamp: new Date()
        }]);
        
        // Post AI reply to backend
        postAIReply(aiResponse);
      }, 1500);
      
    } catch (err) {
      if (handleAuthError(err, setError)) {
        return;
      }
      console.error('Error posting reply:', err);
      setError('Failed to post reply. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Post AI reply to backend
  const postAIReply = async (content) => {
    try {
      const formData = new FormData();
      formData.append('content', content);
      formData.append('topicId', topicId);
      formData.append('userId', 'ai-system');
      formData.append('userName', selectedModel);
      formData.append('isAI', true);

      await axios.post(`${API_BASE_URL}/forum/replies`, formData, { 
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'multipart/form-data'
        }
      });
    } catch (err) {
      console.error('Error posting AI reply:', err);
    }
  };

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
        <div className="flex-1 p-5 overflow-y-auto bg-gray-50">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          {isLoading && messages.length === 0 ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            messages.map((msg, index) => (
              <ForumMessage 
                key={index} 
                message={msg.content} 
                isCommand={msg.isCommand} 
                isAI={msg.isAI}
                userName={msg.userName}
                timestamp={msg.timestamp}
              />
            ))
          )}
        </div>
        
        {/* Input Container */}
        <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-gray-200">
          <div className="flex">
            <input 
              type="text"
              className="flex-1 border border-gray-200 rounded-md p-3 mr-2 text-sm"
              placeholder={`Type a message${topicId ? '' : ' or command (e.g. /dalle)'}...`}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <button 
              type="submit"
              className="bg-blue-600 text-white font-medium rounded-md px-4 py-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                'Send'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ChatBotForum;
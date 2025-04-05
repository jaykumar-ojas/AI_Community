import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { LoginContext } from '../../ContextProvider/context';
import { useWebSocket } from './WebSocketContext';
import { getAuthHeaders, handleAuthError, TOPICS_URL } from './ForumUtils';
import TopicList from './TopicList';

const MyTopics = () => {
  const { loginData } = useContext(LoginContext);
  const { emitDeleteTopic, subscribeToEvent } = useWebSocket();
  
  const [topics, setTopics] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch my topics on mount
  useEffect(() => {
    fetchTopics();
  }, [loginData]);

  // Listen for topic deletion

  const fetchTopics = async () => {
    if (!loginData?.validuserone) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const userId = loginData.validuserone._id;
      const response = await axios.get(`${TOPICS_URL}?userId=${userId}`, { headers: getAuthHeaders() });
      setTopics(response.data.topics || []);
    } catch (err) {
      if (handleAuthError(err, setError)) {
        return;
      }
      console.error('Error fetching my topics:', err);
      setError('Failed to load topics. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };


  if (!loginData?.validuserone) {
    return (
      <div className="text-center text-gray-500 py-8">
        Please log in to view your topics
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">{error}</div>
    );
  }

  return (
    <TopicList 
      topics={topics} 
      emptyMessage="You haven't created any topics yet"
    />
  );
};

export default MyTopics; 
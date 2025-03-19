import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { LoginContext } from '../../ContextProvider/context';
import { useWebSocket } from './WebSocketContext';
import { getAuthHeaders, handleAuthError, TOPICS_URL } from './ForumUtils';
import TopicList from './TopicList';

const PopularTopics = ({ onSelectTopic }) => {
  const { loginData } = useContext(LoginContext);
  const { emitDeleteTopic, subscribeToEvent } = useWebSocket();
  
  const [topics, setTopics] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch popular topics on mount
  useEffect(() => {
    fetchTopics();
  }, [loginData]);

  // Listen for topic deletion
  useEffect(() => {
    const unsubscribe = subscribeToEvent('topic_deleted', (deletedTopicId) => {
      setTopics(prevTopics => prevTopics.filter(topic => topic._id !== deletedTopicId));
    });
    
    return () => {
      unsubscribe();
    };
  }, []);

  const fetchTopics = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(TOPICS_URL, { headers: getAuthHeaders() });
      setTopics(response.data.topics || []);
    } catch (err) {
      if (handleAuthError(err, setError)) {
        return;
      }
      console.error('Error fetching topics:', err);
      setError('Failed to load topics. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTopic = async (topicId) => {
    if (!loginData || !loginData.validuserone) {
      setError('You must be logged in to delete a topic');
      return;
    }

    // Ask for confirmation before deleting
    if (!window.confirm("Are you sure you want to delete this topic? This will also delete all replies. This action cannot be undone.")) {
      return;
    }

    try {
      setIsLoading(true);
      
      const response = await axios.delete(`${TOPICS_URL}/${topicId}`, {
        headers: getAuthHeaders()
      });

      if (response.status === 200) {
        // Emit socket event for topic deletion
        emitDeleteTopic(topicId);
        
        // Refresh the topics list
        fetchTopics();
      }
    } catch (error) {
      console.error('Error deleting topic:', error);
      if (!handleAuthError(error, setError)) {
        if (error.response && error.response.status === 403) {
          setError('You are not authorized to delete this topic');
        } else {
          setError('Failed to delete topic. Please try again.');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

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
      onSelectTopic={onSelectTopic} 
      onDeleteTopic={handleDeleteTopic}
      emptyMessage="No popular topics available"
    />
  );
};

export default PopularTopics; 
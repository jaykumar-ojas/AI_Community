import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { LoginContext } from '../../ContextProvider/context';
import { useWebSocket } from './WebSocketContext';
import { getAuthHeaders, handleAuthError, TOPICS_URL } from './ForumUtils';
import TopicList from './TopicList';

const RecentTopics = () => {
  const { loginData } = useContext(LoginContext);
  const { emitDeleteTopic, subscribeToEvent } = useWebSocket();
  
  const [topics, setTopics] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch recent topics on mount
  useEffect(() => {
    fetchTopics();
  }, [loginData]);

  // Listen for new topics and topic deletion
  useEffect(() => {
    const unsubscribeNew = subscribeToEvent('topic_created', (newTopic) => {
      setTopics(prevTopics => [newTopic, ...prevTopics]);
    });
    
    const unsubscribeDelete = subscribeToEvent('topic_deleted', (deletedTopicId) => {
      setTopics(prevTopics => prevTopics.filter(topic => topic._id !== deletedTopicId));
    });
    
    return () => {
      unsubscribeNew();
      unsubscribeDelete();
    };
  }, []);

  const fetchTopics = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${TOPICS_URL}?sort=recent`, { headers: getAuthHeaders() });
      setTopics(response.data.topics || []);
    } catch (err) {
      if (handleAuthError(err, setError)) {
        return;
      }
      console.error('Error fetching recent topics:', err);
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
      onDeleteTopic={handleDeleteTopic}
      emptyMessage="No recent topics available"
    />
  );
};

export default RecentTopics; 
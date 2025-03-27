import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LoginContext } from '../../component/ContextProvider/context';
import { useWebSocket } from '../../component/AiForumPage/components/WebSocketContext';
import { formatDate, getAuthHeaders, handleAuthError, API_BASE_URL } from '../../component/AiForumPage/components/ForumUtils';
import TopicDetail from '../../component/AiForumPage/components/TopicDetail';

const ForumTopicPage = () => {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const { loginData } = useContext(LoginContext);
  const [topic, setTopic] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTopic = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/forum/topics/${topicId}`, {
          headers: getAuthHeaders()
        });
        setTopic(response.data.topic);
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

    if (topicId) {
      fetchTopic();
    }
  }, [topicId]);

  const handleBack = () => {
    navigate('/');
  };

  const handleDeleteTopic = async (topicId) => {
    if (!loginData || !loginData.validuserone) {
      setError('You must be logged in to delete a topic');
      return;
    }

    if (!window.confirm("Are you sure you want to delete this topic? This will also delete all replies. This action cannot be undone.")) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.delete(`${API_BASE_URL}/forum/topics/${topicId}`, {
        headers: getAuthHeaders()
      });

      if (response.status === 200) {
        navigate('/forum');
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
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">{error}</div>
    );
  }

  if (!topic) {
    return (
      <div className="p-4 text-center text-gray-500">Topic not found</div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <TopicDetail 
        topic={topic} 
        onBack={handleBack}
        onDeleteTopic={handleDeleteTopic}
      />
    </div>
  );
};

export default ForumTopicPage; 
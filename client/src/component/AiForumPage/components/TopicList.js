import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LoginContext } from '../../ContextProvider/context';
import { useWebSocket } from './WebSocketContext';
import { formatDate, getAuthHeaders, handleAuthError, API_BASE_URL, TOPICS_URL } from './ForumUtils';

const TopicList = ({ topics: initialTopics, onDeleteTopic, emptyMessage }) => {
  const { loginData } = useContext(LoginContext);
  const {emitDeleteTopic,subscribeToEvent} = useWebSocket();
  const navigate = useNavigate();
  //  const [topics, setTopics] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
  const [topics, setTopics] = useState(initialTopics);

  useEffect(() => {
    const unsubscribe = subscribeToEvent('topic_deleted', (deletedTopicId) => {
      setTopics(prevTopics => prevTopics.filter(topic => topic._id !== deletedTopicId));
    });
    
    return () => {
      unsubscribe();
    };
  }, []);


  // Update topics when initialTopics changes
  useEffect(() => {
    setTopics(initialTopics);
  }, [initialTopics]);

  // Handle topic click
  const handleTopicClick = (topic) => {
    navigate(`/forum/topic/${topic._id}`);
  };

  // Handle topic like
  const handleTopicLike = async (topicId, e) => {
    e.stopPropagation();
    if (!loginData || !loginData.validuserone) {
      alert('Please log in to like topics');
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/forum/topics/${topicId}/like`, {}, {
        headers: getAuthHeaders()
      });
      
      if (response.status === 200) {
        // Update the topic in the list
        setTopics(prevTopics => prevTopics.map(topic => {
          if (topic._id === topicId) {
            return {
              ...topic,
              likes: response.data.liked ? 
                [...topic.likes, loginData.validuserone._id] : 
                topic.likes.filter(id => id !== loginData.validuserone._id),
              dislikes: topic.dislikes.filter(id => id !== loginData.validuserone._id)
            };
          }
          return topic;
        }));
      }
    } catch (error) {
      console.error('Error liking topic:', error);
      if (!handleAuthError(error)) {
        alert('Failed to like topic. Please try again.');
      }
    }
  };

  // Handle topic dislike
  const handleTopicDislike = async (topicId, e) => {
    e.stopPropagation();
    if (!loginData || !loginData.validuserone) {
      alert('Please log in to dislike topics');
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/forum/topics/${topicId}/dislike`, {}, {
        headers: getAuthHeaders()
      });
      
      if (response.status === 200) {
        // Update the topic in the list
        setTopics(prevTopics => prevTopics.map(topic => {
          if (topic._id === topicId) {
            return {
              ...topic,
              dislikes: response.data.disliked ? 
                [...topic.dislikes, loginData.validuserone._id] : 
                topic.dislikes.filter(id => id !== loginData.validuserone._id),
              likes: topic.likes.filter(id => id !== loginData.validuserone._id)
            };
          }
          return topic;
        }));
      }
    } catch (error) {
      console.error('Error disliking topic:', error);
      if (!handleAuthError(error)) {
        alert('Failed to dislike topic. Please try again.');
      }
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

  return (
    <div className="divide-y">
      {topics.length > 0 ? (
        topics.map(topic => {
          const isLiked = topic.likes?.includes(loginData?.validuserone?._id);
          const isDisliked = topic.dislikes?.includes(loginData?.validuserone?._id);
          const isAuthor = loginData?.validuserone?._id.toString() === topic.userId.toString();
          const isAdmin = loginData?.validuserone?.role === 'admin';
          const canDelete = isAuthor || isAdmin;

          return (
            <div
              key={topic._id}
              className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => handleTopicClick(topic)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 mb-1">{topic.title}</h3>
                  <p className="text-gray-600 text-sm line-clamp-2">{topic.content}</p>
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <span>Posted by {topic.userName}</span>
                    <span className="mx-2">•</span>
                    <span>{formatDate(topic.createdAt)}</span>
                    <span className="mx-2">•</span>
                    <span>{topic.replyCount} replies</span>
                    <span className="mx-2">•</span>
                    <span>{topic.viewCount/2} views</span>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => handleTopicLike(topic._id, e)}
                      className={`p-1 rounded-full hover:bg-gray-100 ${
                        isLiked ? 'text-blue-500' : 'text-gray-500'
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                      </svg>
                    </button>
                    <span className="text-sm text-gray-500">{topic.likes?.length || 0}</span>
                    <button
                      onClick={(e) => handleTopicDislike(topic._id, e)}
                      className={`p-1 rounded-full hover:bg-gray-100 ${
                        isDisliked ? 'text-red-500' : 'text-gray-500'
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.43a2 2 0 00-1.105-1.79l-.05-.025A4 4 0 0011.055 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.866a4 4 0 00.8-2.4z" />
                      </svg>
                    </button>
                    <span className="text-sm text-gray-500">{topic.dislikes?.length || 0}</span>
                  </div>
                  {canDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTopic(topic._id)
                      }}
                      className="p-1 text-red-500 hover:bg-red-50 rounded-full"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })
      ) : (
        <div className="p-4 text-center text-gray-500">{emptyMessage}</div>
      )}
    </div>
  );
};

export default TopicList; 
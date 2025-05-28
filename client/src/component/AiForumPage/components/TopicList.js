import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LoginContext } from '../../ContextProvider/context';
import { useWebSocket } from './WebSocketContext';
import { formatDate, getAuthHeaders, handleAuthError, API_BASE_URL, TOPICS_URL } from './ForumUtils';
import { DisLikeIcon, LikeIcon } from '../../../asset/icons';
import UserIconCard from '../../Card/UserIconCard';

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
              className="p-4 hover:bg-bg_comment_box transition-colors cursor-pointer"
              onClick={() => handleTopicClick(topic)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-md font-medium text-text_comment mb-1">{topic.title}</h3>
                  <p className="text-text_header text-sm  line-clamp-2">{topic.content}</p>
                  <div className="mt-2 flex flex-row items-center text-sm justify-between">
                    <div className='w-6 h-6 flex-shrink-0'><UserIconCard id={topic?.userId}/></div>
                    <div className="">•</div>
                    <div className='text-text_header text-xs'>{topic.userName}</div>
                    <div className="">•</div>
                    <div className='text-time_header text-xs'>{formatDate(topic.createdAt)}</div>
                    <div className="">•</div>
                    <div className='text-text_header text-xs'>{topic.replyCount} replies</div>
                    <div className="">•</div>
                    <div className='text-time_header text-xs'>{topic.viewCount/2} views</div>
                  </div>
                </div>
                <div className="flex items-center space-x-4 ">
                  <div className="flex items-center space-x-1 bg-btn_bg rounded-lg px-2 py-0.5">
                    <button
                      onClick={(e) => handleTopicLike(topic._id, e)}
                      className={`rounded-full  hover:bg-bg_comment ${
                        isLiked ? 'text-like_color' : 'none'
                      }`}
                    >
                      <LikeIcon isLiked={isLiked}/>
                    </button>
                    <span className="text-xs text-gray-500">{topic.likes?.length || 0}</span>
                    <button
                      onClick={(e) => handleTopicDislike(topic._id, e)}
                      className={`p-1 rounded-full hover:bg-gray-100 ${
                        isDisliked ? 'text-red-500' : 'text-gray-500'
                      }`}
                    >
                     <DisLikeIcon isDisliked={isDisliked}/>
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
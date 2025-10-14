import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LoginContext } from '../../ContextProvider/context';
import { useWebSocket } from './WebSocketContext';
import { formatDate, getAuthHeaders, handleAuthError, API_BASE_URL, TOPICS_URL } from './ForumUtils';
import { DisLikeIcon, LikeIcon, UpvoteIcon, DownvoteIcon, CommentIcon } from '../../../asset/icons';
import UserIconCard from '../../Card/UserIconCard';
import UserNameCard from '../../Card/UserNameCard';
import { encodeId } from '../../../utils/hashids';
import { EyeIcon } from 'lucide-react';
import LikeDislike from '../../Card/LikeDislike';
import { useNotification } from '../../ContextProvider/NotificationContext';

import '../../../asset/IconImage/ComponetCSS/LikeDisLike.css'


const TopicList = ({ topics: initialTopics, onDeleteTopic, emptyMessage }) => {
  const {showNotification} = useNotification();
  const { loginData } = useContext(LoginContext);
  const {emitDeleteTopic,subscribeToEvent} = useWebSocket();
  const navigate = useNavigate();
  //  const [topics, setTopics] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
  const [topics, setTopics] = useState(initialTopics);
  const [openMenuId, setOpenMenuId] = useState(null);

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
    
    navigate(`/forum/topic/${encodeId(topic._id)}`);
  };

  // Handle topic like
  const handleTopicLike = async (topicId, e) => {
    e.stopPropagation();
    if (!loginData || !loginData.validuserone) {
      showNotification('Please log in to like topics');
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
        showNotification("failed to like. please try again","info");
    }
  };

  // Handle topic dislike
  const handleTopicDislike = async (topicId, e) => {
    e.stopPropagation();
    if (!loginData || !loginData.validuserone) {
      showNotification('Please log in to dislike topics');
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
      // console.error('Error disliking topic:', error);
        showNotification('Failed to dislike topic. Please try again.');
    }
  };


  const handleDeleteTopic = async (topicId) => {
    if (!loginData || !loginData.validuserone) {
      showNotification("please login to proceed","warning");
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
        if (error.response && error.response.status === 403) {
          showNotification('You are not authorized to delete this topic',"warning");
        } else {
          showNotification('Failed to delete. Please try again.',"warning");
        }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid gap-2 grid-cols-1">
  {topics.length > 0 ? (
    topics.map((topic) => {
      const isLiked = topic.likes?.includes(loginData?.validuserone?._id);
      const isDisliked = topic.dislikes?.includes(loginData?.validuserone?._id);
      const isAuthor =
        loginData?.validuserone?._id.toString() === topic.userId.toString();
      const isAdmin = loginData?.validuserone?.role === "admin";
      const canDelete = isAuthor || isAdmin;

      return (
        <div
          key={topic._id}
          onClick={() => handleTopicClick(topic)}
          className="group relative bg-white dark:bg-nav_hover border border-gray-200 dark:border-gray-900 rounded-2xl p-3 shadow-sm hover:shadow-md hover:border-blue-400 transition-all duration-300 cursor-pointer overflow-hidden"
        >
          {/* Hover gradient overlay */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-r from-blue-500 to-purple-500 transition duration-300 rounded-2xl"></div>

          {/* Title */}
          <div className="flex justify-between items-start">
            <h2 className="text-[17px] font-semibold font-merriweather text-gray-900  dark:text-low_text line-clamp-2 group-hover:text-theme_color2 transition">
              {topic.title}
            </h2>

            {/* Options Menu */}
            {canDelete && (
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenuId(openMenuId === topic._id ? null : topic._id);
                  }}
                  className="p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <circle cx="10" cy="4" r="1.5" />
                    <circle cx="10" cy="10" r="1.5" />
                    <circle cx="10" cy="16" r="1.5" />
                  </svg>
                </button>

                {openMenuId === topic._id && (
                  <div
                    className="absolute right-0 mt-2 w-28 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => {
                        handleDeleteTopic(topic._id);
                        setOpenMenuId(null);
                      }}
                      className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/40 rounded-xl"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Content Preview */}
          <p className="text-[13px] font-jetbrain text-gray-600 dark:text-gray-200 line-clamp-2 mb-3">
            {topic.content}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between w-full text-xs overflow-hidden">
            {/* Left Section (User + Date + Replies) */}
            <div className="flex items-center min-w-0 gap-1 overflow-hidden">
              <div className="flex-shrink-0 w-6 h-6">
                <UserIconCard id={topic?.userId} />
              </div>

              <span className="truncate max-w-[90px] sm:max-w-[120px] bg-blue-100 text-blue-700 dark:bg-nav_hover2 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium">
                <UserNameCard id={topic?.userId} hover={false} size={5} />
              </span>

              <span className="bg-gray-100 text-gray-700 dark:bg-nav_hover2 dark:text-low_text px-2 py-0.5 rounded-full flex-shrink-0">
                {formatDate(topic.createdAt)}
              </span>

              {topic.replyCount > 0 && (
                <span className="bg-purple-100 text-purple-700 dark:bg-nav_hover2 dark:text-low_text px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0">
                  {topic.replyCount} <CommentIcon h={4} w={4} />
                </span>
              )}
            </div>

            {/* Right Section (Views + Like/Dislike) */}
            <div className="flex items-center flex-shrink-0 gap-2">
              <div className="bg-gray-100 dark:bg-nav_hover2 text-gray-700 dark:text-low_text px-2 py-0.5 rounded-full flex items-center gap-1">
                {topic.viewCount} <EyeIcon size={12} />
              </div>
              <div className="bg-gray-100 dark:bg-nav_hover2 text-gray-700 dark:text-low_text px-2 py-0.5 rounded-full flex items-center gap-1">
                {topic.likes?.length} <Like />
              </div>
              <div className="bg-gray-100 dark:bg-nav_hover2 text-gray-700 dark:text-low_text px-2 py-0.5 rounded-full flex items-center gap-1">
                {topic?.dislikes?.length} <DisLike />
              </div>
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


const Like = ({ size = 14 }) => {
  return (
    <svg 
      className="svgs-like" 
      width={size} 
      height={size} 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 512 512"
      fill="currentColor"
    >
      <path d="M313.4 32.9c26 5.2 42.9 30.5 37.7 56.5l-2.3 11.4c-5.3 26.7-15.1 52.1-28.8 75.2H464c26.5 0 48 21.5 48 48c0 18.5-10.5 34.6-25.9 42.6C497 275.4 504 288.9 504 304c0 23.4-16.8 42.9-38.9 47.1c4.4 7.3 6.9 15.8 6.9 24.9c0 21.3-13.9 39.4-33.1 45.6c.7 3.3 1.1 6.8 1.1 10.4c0 26.5-21.5 48-48 48H294.5c-19 0-37.5-5.6-53.3-16.1l-38.5-25.7C176 420.4 160 390.4 160 358.3V320 272 247.1c0-29.2 13.3-56.7 36-75l7.4-5.9c26.5-21.2 44.6-51 51.2-84.2l2.3-11.4c5.2-26 30.5-42.9 56.5-37.7zM32 192H96c17.7 0 32 14.3 32 32V448c0 17.7-14.3 32-32 32H32c-17.7 0-32-14.3-32-32V224c0-17.7 14.3-32 32-32z"></path>
    </svg>
  );
};

const DisLike = ({ size = 14 }) => {
  return (
    <svg 
      className="svgs-dislike" 
      width={size} 
      height={size} 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 512 512"
      fill="currentColor"
      style={{ transform: 'rotate(180deg)' }}
    >
      <path d="M313.4 32.9c26 5.2 42.9 30.5 37.7 56.5l-2.3 11.4c-5.3 26.7-15.1 52.1-28.8 75.2H464c26.5 0 48 21.5 48 48c0 18.5-10.5 34.6-25.9 42.6C497 275.4 504 288.9 504 304c0 23.4-16.8 42.9-38.9 47.1c4.4 7.3 6.9 15.8 6.9 24.9c0 21.3-13.9 39.4-33.1 45.6c.7 3.3 1.1 6.8 1.1 10.4c0 26.5-21.5 48-48 48H294.5c-19 0-37.5-5.6-53.3-16.1l-38.5-25.7C176 420.4 160 390.4 160 358.3V320 272 247.1c0-29.2 13.3-56.7 36-75l7.4-5.9c26.5-21.2 44.6-51 51.2-84.2l2.3-11.4c5.2-26 30.5-42.9 56.5-37.7zM32 192H96c17.7 0 32 14.3 32 32V448c0 17.7-14.3 32-32 32H32c-17.7 0-32-14.3-32-32V224c0-17.7 14.3-32 32-32z"></path>
    </svg>
  );
};
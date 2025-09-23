import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LoginContext } from '../../ContextProvider/context';
import { useWebSocket } from './WebSocketContext';
import { formatDate, getAuthHeaders, handleAuthError, API_BASE_URL, TOPICS_URL } from './ForumUtils';
import { DisLikeIcon, LikeIcon, UpvoteIcon, DownvoteIcon, CommentIcon } from '../../../asset/icons';
import UserIconCard from '../../Card/UserIconCard';
import { encodeId } from '../../../utils/hashids';
import { EyeIcon } from 'lucide-react';
import LikeDislike from '../../Card/LikeDislike';
import { useNotification } from '../../ContextProvider/NotificationContext';

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
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
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
          className="p-1 w-full  hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-gray-800 dark:hover:to-gray-700 transition-colors cursor-pointer"
          onClick={() => handleTopicClick(topic)}
        >
          <div className="flex flex-col w-full justify-between">
            {/* this is first one */}
              <div className="flex justify-between items-center">
                <div className="text-sm font-semibold  text-gray-900 dark:text-white line-clamp-2 hover:text-blue-600 transition">
                  {topic.title}
                </div>

                <div className='flex items-center justify-center'>
                  <div className="bg-green-100 h-5 text-green-700 text-xs dark:bg-green-900/40 dark:text-green-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                  {topic.viewCount} <EyeIcon size={12}/>
                </div>
                 {canDelete && (
                  <div className="relative">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === topic._id ? null : topic._id);
                      }}
                      className="p-1 text-gray-500 hover:bg-blue-100 dark:hover:bg-gray-700 rounded-full"
                      aria-label="Open menu"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <circle cx="10" cy="4" r="1.5" />
                        <circle cx="10" cy="10" r="1.5" />
                        <circle cx="10" cy="16" r="1.5" />
                      </svg>
                    </button>
                    {openMenuId === topic._id && (
                      <div
                        className="absolute right-0 mt-2 w-28 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-lg z-10"
                        onClick={e => e.stopPropagation()}
                      >
                        <button
                          onClick={() => {
                            handleDeleteTopic(topic._id);
                            setOpenMenuId(null);
                          }}
                          className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/40"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
                </div>
               
              </div>
            {/* this is content one */}
              <p className="text-gray-600 dark:text-gray-400 text-xs line-clamp-1">
                {topic.content}
              </p>


            {/* Bottom Row */}
            <div className="flex flex-row items-center justify-between gap-1 w-full mt-1">
              
              {/* Meta Info */}
              <div className="flex flex-wrap items-center text-xs ">
                <div className="w-6 h-6 flex-shrink-0"><UserIconCard id={topic?.userId}/></div>

                <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 px-2 py-0.5 rounded-full">
                  {topic.userName}
                </span>

                <span className="bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-full">
                  {formatDate(topic.createdAt)}
                </span>

                <span className="bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                  {topic.replyCount} <CommentIcon h={4} w={4}/>
                </span>

              </div>

              {/* Vote Buttons */}
              <LikeDislike topic={topic} like = {handleTopicLike} dislike={handleTopicDislike}/>
              {/* <div className="flex items-center gap-2 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-gray-800 dark:to-gray-700 rounded-full px-3 py-1 self-start sm:self-auto">
                <button
                  onClick={(e) => handleTopicLike(topic._id, e)}
                  className={`p-1 rounded-full transition transform hover:scale-110 ${
                    isLiked ? 'text-green-600' : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  <UpvoteIcon isLiked={isLiked}/>
                </button>
                <span className="text-xs text-gray-700 dark:text-gray-300">{topic.likes?.length || 0}</span>

                <button
                  onClick={(e) => handleTopicDislike(topic._id, e)}
                  className={`p-1 rounded-full transition transform hover:scale-110 ${
                    isDisliked ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  <DownvoteIcon isDisliked={isDisliked}/>
                </button>
                <span className="text-xs text-gray-700 dark:text-gray-300">{topic.dislikes?.length || 0}</span>
              </div> */}
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
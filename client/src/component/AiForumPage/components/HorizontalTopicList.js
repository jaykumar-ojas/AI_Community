import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { LoginContext } from '../../ContextProvider/context';
import { useWebSocket } from './WebSocketContext';
import { formatDate, getAuthHeaders, handleAuthError, TOPICS_URL } from './ForumUtils';
import { encodeId } from '../../../utils/hashids';
import { EyeIcon, MessageSquare, ThumbsUp, ThumbsDown } from 'lucide-react';
import UserIconCard from '../../Card/UserIconCard';
import UserNameCard from '../../Card/UserNameCard';

const HorizontalTopicList = ({ sortType = 'popular', limit = 10 }) => {
  const { loginData } = useContext(LoginContext);
  const { subscribeToEvent } = useWebSocket();
  const navigate = useNavigate();
  const [topics, setTopics] = useState([]);

  const fetchTopics = async () => {
    try {
      const response = await axios.get(`${TOPICS_URL}?sort=${sortType}&limit=${limit}`, {
        headers: getAuthHeaders(),
      });
      return response.data.topics || [];
    } catch (error) {
      if (!handleAuthError(error)) {
        console.error('Error fetching topics:', error);
      }
      return [];
    }
  };

  const { data: fetchedTopics = [], isLoading } = useQuery({
    queryKey: ['horizontalTopics', sortType, limit],
    queryFn: fetchTopics,
    staleTime: 1000 * 60 * 2,
    retry: false,
  });

  useEffect(() => {
    setTopics(fetchedTopics);
  }, [fetchedTopics]);

  useEffect(() => {
    const unsubscribe = subscribeToEvent('topic_deleted', (deletedTopicId) => {
      setTopics(prevTopics => prevTopics.filter(topic => topic._id !== deletedTopicId));
    });
    
    return () => {
      unsubscribe();
    };
  }, []);

  const handleTopicClick = (topic) => {
    navigate(`/forum/topic/${encodeId(topic._id)}`);
  };

  if (isLoading) {
    return (
      <div className="mb-4">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-80 h-32 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (topics.length === 0) {
    return null;
  }

  return (
    <div className="mb-3 sm:mb-4">
      <div className="flex items-center justify-between mb-2 sm:mb-3 px-1 sm:px-2">
        <h2 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 dark:text-low_text font-inter">
          {sortType === 'popular' ? '🔥 Popular Discussions' : '🕐 Recent Discussions'}
        </h2>
        <button
          onClick={() => navigate('/forum')}
          className="text-xs sm:text-sm text-theme_color hover:text-theme_color2 font-medium transition-colors flex-shrink-0 ml-2"
        >
          View All →
        </button>
      </div>
      
      <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent -mx-1 sm:-mx-2 px-1 sm:px-2">
        {topics.map((topic) => {
          const isLiked = topic.likes?.includes(loginData?.validuserone?._id);
          const isDisliked = topic.dislikes?.includes(loginData?.validuserone?._id);

          return (
            <div
              key={topic._id}
              onClick={() => handleTopicClick(topic)}
              className="flex-shrink-0 w-64 sm:w-72 md:w-80 bg-white dark:bg-[#2b2d31] border border-gray-200 dark:border-gray-700 rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm hover:shadow-lg hover:border-theme_color hover:bg-gray-50 dark:hover:bg-[#36393f] transition-all duration-300 cursor-pointer group"
            >
              {/* Title */}
              <h3 className="text-sm sm:text-base font-semibold font-merriweather text-gray-900 dark:text-white line-clamp-2 mb-1.5 sm:mb-2 group-hover:text-theme_color transition">
                {topic.title}
              </h3>

              {/* Content Preview */}
              <p className="text-xs sm:text-sm font-jetbrain text-gray-600 dark:text-gray-300 line-clamp-2 mb-2 sm:mb-3">
                {topic.content}
              </p>

              {/* Footer */}
              <div className="flex items-center justify-between text-[10px] sm:text-xs gap-1 sm:gap-2">
                {/* Left: User Info */}
                <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
                  <div className="flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5">
                    <UserIconCard id={topic?.userId} />
                  </div>
                  <span className="truncate max-w-[60px] sm:max-w-[100px] text-gray-700 dark:text-gray-300">
                    <UserNameCard id={topic?.userId} hover={false} size={4} />
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 flex-shrink-0 hidden sm:inline">
                    {formatDate(topic.createdAt)}
                  </span>
                </div>

                {/* Right: Stats */}
                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                  {topic.replyCount > 0 && (
                    <div className="flex items-center gap-0.5 sm:gap-1 text-gray-600 dark:text-gray-400">
                      <MessageSquare className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      <span className="hidden sm:inline">{topic.replyCount}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-0.5 sm:gap-1 text-gray-600 dark:text-gray-400">
                    <EyeIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    <span className="hidden sm:inline">{topic.viewCount || 0}</span>
                  </div>
                  <div className={`flex items-center gap-0.5 sm:gap-1 ${isLiked ? 'text-blue-500' : 'text-gray-600 dark:text-gray-400'}`}>
                    <ThumbsUp className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    <span className="hidden sm:inline">{topic.likes?.length || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HorizontalTopicList;


import React, { useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { LoginContext } from '../../ContextProvider/context';
import { useWebSocket } from './WebSocketContext';
import { formatDate, getAuthHeaders, handleAuthError, API_BASE_URL } from './ForumUtils';

const TopicList = ({ topics: initialTopics, onSelectTopic, onDeleteTopic, emptyMessage }) => {
  const { loginData } = useContext(LoginContext);
  const [topics, setTopics] = useState(initialTopics);

  // Update topics when initialTopics changes
  useEffect(() => {
    setTopics(initialTopics);
  }, [initialTopics]);

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
              className="p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 cursor-pointer" onClick={() => onSelectTopic(topic)}>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">{topic.title}</h3>
                  <p className="text-gray-600 text-sm line-clamp-2">{topic.content}</p>
                  <div className="flex items-center mt-2 text-sm text-gray-500">
                    <span className="font-medium text-blue-600 mr-2">{topic.userName}</span>
                    <span className="mr-4">{formatDate(topic.createdAt)}</span>
                    <span className="flex items-center mr-4">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      {topic.replyCount || 0}
                    </span>
                    <div className="flex items-center">
                      <button
                        onClick={(e) => handleTopicLike(topic._id, e)}
                        className={`flex items-center text-sm ${isLiked ? 'text-blue-600' : 'text-gray-500'} hover:text-blue-600 mr-2`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill={isLiked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                        </svg>
                        {topic.likes?.length || 0}
                      </button>
                      <button
                        onClick={(e) => handleTopicDislike(topic._id, e)}
                        className={`flex items-center text-sm ${isDisliked ? 'text-red-600' : 'text-gray-500'} hover:text-red-600`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill={isDisliked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018c.163 0 .326.02.485.06L17 4m-7 5v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 5h2m5 0v2a2 2 0 01-2 2h-2.5" />
                        </svg>
                        {topic.dislikes?.length || 0}
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Delete button for topic owner or admin */}
                {canDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteTopic(topic._id);
                    }}
                    className="text-red-500 hover:text-red-700 ml-4"
                    title="Delete topic"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          );
        })
      ) : (
        <div className="text-center text-gray-500 py-8">
          {emptyMessage || "No topics available"}
        </div>
      )}
    </div>
  );
};

export default TopicList; 
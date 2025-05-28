import React from 'react';
import axios from 'axios';
import { getAuthHeaders, handleAuthError, API_BASE_URL } from '../ForumUtils';

const TopicHeader = ({
  topic,
  onBack,
  isThreadView,
  handleBackFromThread,
  topicLikes,
  setTopicLikes,
  topicDislikes,
  setTopicDislikes,
  loginData,
  setError
}) => {
  // Check if the topic is liked or disliked by the current user
  const isTopicLiked = topicLikes.includes(loginData?.validuserone?._id);
  const isTopicDisliked = topicDislikes.includes(loginData?.validuserone?._id);

  // Handle topic like
  const handleTopicLike = async () => {
    if (!loginData || !loginData.validuserone) {
      alert('Please log in to like topics');
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/forum/topics/${topic._id}/like`, {}, {
        headers: getAuthHeaders()
      });
      
      if (response.status === 200) {
        setTopicLikes(response.data.liked ? [...topicLikes, loginData.validuserone._id] : 
          topicLikes.filter(id => id !== loginData.validuserone._id));
        setTopicDislikes(topicDislikes.filter(id => id !== loginData.validuserone._id));
      }
    } catch (error) {
      console.error('Error liking topic:', error);
      if (!handleAuthError(error, setError)) {
        setError('Failed to like topic. Please try again.');
      }
    }
  };

  // Handle topic dislike
  const handleTopicDislike = async () => {
    if (!loginData || !loginData.validuserone) {
      alert('Please log in to dislike topics');
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/forum/topics/${topic._id}/dislike`, {}, {
        headers: getAuthHeaders()
      });
      
      if (response.status === 200) {
        setTopicDislikes(response.data.disliked ? [...topicDislikes, loginData.validuserone._id] : 
          topicDislikes.filter(id => id !== loginData.validuserone._id));
        setTopicLikes(topicLikes.filter(id => id !== loginData.validuserone._id));
      }
    } catch (error) {
      console.error('Error disliking topic:', error);
      if (!handleAuthError(error, setError)) {
        setError('Failed to dislike topic. Please try again.');
      }
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 p-4 flex items-center sticky top-0 z-10">
      <button
        onClick={isThreadView ? handleBackFromThread : onBack}
        className="mr-3 text-gray-500 hover:text-gray-700"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </button>
      <h2 className="font-semibold text-lg flex-1">{isThreadView ? 'Thread' : topic.title}</h2>
      {!isThreadView && (
        <div className="flex items-center space-x-2">
          <button
            onClick={handleTopicLike}
            className={`flex items-center ${isTopicLiked ? 'text-blue-600' : 'text-gray-500'} hover:text-blue-600`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill={isTopicLiked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
            </svg>
          </button>
          <button
            onClick={handleTopicDislike}
            className={`flex items-center ${isTopicDisliked ? 'text-red-600' : 'text-gray-500'} hover:text-red-600`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill={isTopicDisliked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018c.163 0 .326.02.485.06L17 4m-7 5v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 5h2m5 0v2a2 2 0 01-2 2h-2.5" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default TopicHeader;

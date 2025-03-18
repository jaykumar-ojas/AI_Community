import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { LoginContext } from '../../ContextProvider/context';
import { useWebSocket } from './WebSocketContext';
import { formatDate, getAuthHeaders, handleAuthError, organizeReplies, REPLIES_URL, API_BASE_URL } from './ForumUtils';

const TopicDetail = ({ topic, onBack, onDeleteTopic }) => {
  const { loginData } = useContext(LoginContext);
  const { joinTopic, leaveTopic, emitNewReply, emitDeleteReply, subscribeToEvent } = useWebSocket();
  
  const [replies, setReplies] = useState([]);
  const [newReply, setNewReply] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [topicLikes, setTopicLikes] = useState(topic?.likes || []);
  const [topicDislikes, setTopicDislikes] = useState(topic?.dislikes || []);

  // Join topic room on mount, leave on unmount
  useEffect(() => {
    if (topic) {
      joinTopic(topic._id);
      fetchReplies(topic._id);
      setTopicLikes(topic.likes || []);
      setTopicDislikes(topic.dislikes || []);
    }
    
    return () => {
      if (topic) {
        leaveTopic(topic._id);
      }
    };
  }, [topic?._id]);

  // Listen for new replies
  useEffect(() => {
    if (!topic) return;
    
    const unsubscribe = subscribeToEvent('reply_created', (newReply) => {
      if (topic._id === newReply.topicId) {
        setReplies(prevReplies => [...prevReplies, newReply]);
      }
    });
    
    const unsubscribeDelete = subscribeToEvent('reply_deleted', (deletedReplyId) => {
      setReplies(prevReplies => prevReplies.filter(reply => reply._id !== deletedReplyId));
    });
    
    return () => {
      unsubscribe();
      unsubscribeDelete();
    };
  }, [topic]);

  // Fetch replies for a selected topic
  const fetchReplies = async (topicId) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${REPLIES_URL}?topicId=${topicId}`, { headers: getAuthHeaders() });
      setReplies(response.data.replies || []);
    } catch (err) {
      if (handleAuthError(err, setError)) {
        return;
      }
      console.error('Error fetching replies:', err);
      setError('Failed to load replies. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle posting a reply
  const handlePostReply = async (parentReplyId = null) => {
    if (!loginData || !loginData.validuserone) {
      alert('Please log in to reply');
      return;
    }

    const content = parentReplyId ? replyContent : newReply;

    if (!content.trim() || !topic) {
      alert('Please enter a reply');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(REPLIES_URL, {
        content: content,
        topicId: topic._id,
        userId: loginData.validuserone._id,
        userName: loginData.validuserone.userName,
        parentReplyId: parentReplyId
      }, { headers: getAuthHeaders() });
      
      // Emit socket event for new reply
      emitNewReply(response.data.reply);
      
      // Reset form
      if (parentReplyId) {
        setReplyContent('');
        setReplyingTo(null);
      } else {
        setNewReply('');
      }
    } catch (err) {
      if (handleAuthError(err, setError)) {
        return;
      }
      console.error('Error posting reply:', err);
      setError('Failed to post reply. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle deleting a reply
  const handleDeleteReply = async (replyId) => {
    if (!loginData || !loginData.validuserone) {
      setError('You must be logged in to delete a reply');
      return;
    }

    // Ask for confirmation before deleting
    if (!window.confirm("Are you sure you want to delete this reply? This action cannot be undone.")) {
      return;
    }

    try {
      setIsLoading(true);
      
      const response = await axios.delete(`${REPLIES_URL}/${replyId}`, {
        headers: getAuthHeaders()
      });

      if (response.status === 200) {
        // Emit socket event for reply deletion
        emitDeleteReply(replyId, topic._id);
      }
    } catch (error) {
      console.error('Error deleting reply:', error);
      if (!handleAuthError(error, setError)) {
        if (error.response && error.response.status === 403) {
          setError('You are not authorized to delete this reply');
        } else {
          setError('Failed to delete reply. Please try again.');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

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

  // Handle reply like
  const handleReplyLike = async (replyId) => {
    if (!loginData || !loginData.validuserone) {
      alert('Please log in to like replies');
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/forum/replies/${replyId}/like`, {}, {
        headers: getAuthHeaders()
      });
      
      if (response.status === 200) {
        setReplies(prevReplies => 
          prevReplies.map(reply => {
            if (reply._id === replyId) {
              return {
                ...reply,
                likes: response.data.liked ? 
                  [...reply.likes, loginData.validuserone._id] : 
                  reply.likes.filter(id => id !== loginData.validuserone._id),
                dislikes: reply.dislikes.filter(id => id !== loginData.validuserone._id)
              };
            }
            return reply;
          })
        );
      }
    } catch (error) {
      console.error('Error liking reply:', error);
      if (!handleAuthError(error, setError)) {
        setError('Failed to like reply. Please try again.');
      }
    }
  };

  // Handle reply dislike
  const handleReplyDislike = async (replyId) => {
    if (!loginData || !loginData.validuserone) {
      alert('Please log in to dislike replies');
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/forum/replies/${replyId}/dislike`, {}, {
        headers: getAuthHeaders()
      });
      
      if (response.status === 200) {
        setReplies(prevReplies => 
          prevReplies.map(reply => {
            if (reply._id === replyId) {
              return {
                ...reply,
                dislikes: response.data.disliked ? 
                  [...reply.dislikes, loginData.validuserone._id] : 
                  reply.dislikes.filter(id => id !== loginData.validuserone._id),
                likes: reply.likes.filter(id => id !== loginData.validuserone._id)
              };
            }
            return reply;
          })
        );
      }
    } catch (error) {
      console.error('Error disliking reply:', error);
      if (!handleAuthError(error, setError)) {
        setError('Failed to dislike reply. Please try again.');
      }
    }
  };

  // Render a single reply and its children recursively
  const renderReply = (reply, depth = 0) => {
    const isReplying = replyingTo === reply._id;
    const isLiked = reply.likes?.includes(loginData?.validuserone?._id);
    const isDisliked = reply.dislikes?.includes(loginData?.validuserone?._id);
    
    // Check if the current user is the author or an admin
    const isAuthor = loginData?.validuserone?._id.toString() === reply.userId.toString();
    const isAdmin = loginData?.validuserone?.role === 'admin';
    const canDelete = isAuthor || isAdmin;
    
    return (
      <div key={reply._id} className={`pl-${depth * 4} mb-4`}>
        <div className="bg-white rounded-lg border p-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <span className="font-medium text-blue-600">{reply.userName}</span>
              <span className="text-gray-400 text-sm ml-2">{formatDate(reply.createdAt)}</span>
            </div>
            <div className="flex items-center">
              {canDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteReply(reply._id);
                  }}
                  className="text-red-500 hover:text-red-700 mr-3"
                  title="Delete reply"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
              <div className="flex items-center mr-3">
                <button
                  onClick={() => handleReplyLike(reply._id)}
                  className={`flex items-center text-sm ${isLiked ? 'text-blue-600' : 'text-gray-500'} hover:text-blue-600`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill={isLiked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                  </svg>
                  {reply.likes?.length || 0}
                </button>
                <button
                  onClick={() => handleReplyDislike(reply._id)}
                  className={`flex items-center text-sm ml-2 ${isDisliked ? 'text-red-600' : 'text-gray-500'} hover:text-red-600`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill={isDisliked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018c.163 0 .326.02.485.06L17 4m-7 5v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 5h2m5 0v2a2 2 0 01-2 2h-2.5" />
                  </svg>
                  {reply.dislikes?.length || 0}
                </button>
              </div>
              <button
                onClick={() => {
                  if (isReplying) {
                    setReplyingTo(null);
                    setReplyContent('');
                  } else {
                    setReplyingTo(reply._id);
                    setReplyContent('');
                  }
                }}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {isReplying ? 'Cancel' : 'Reply'}
              </button>
            </div>
          </div>
          
          <div className="text-gray-700 whitespace-pre-wrap">{reply.content}</div>
          
          {isReplying && (
            <div className="mt-4 pl-4 border-l-2 border-blue-100">
              <textarea
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows="3"
                placeholder="Write your reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
              />
              <div className="flex justify-end mt-2">
                <button
                  className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  onClick={() => {
                    if (replyContent.trim()) {
                      handlePostReply(reply._id);
                    }
                  }}
                  disabled={!loginData || !replyContent.trim()}
                >
                  Post Reply
                </button>
              </div>
            </div>
          )}
        </div>
        
        {reply.children && reply.children.length > 0 && (
          <div className="mt-2 pl-4 border-l-2 border-gray-100">
            {reply.children.map(childReply => renderReply(childReply, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (!topic) return null;

  const isTopicLiked = topicLikes.includes(loginData?.validuserone?._id);
  const isTopicDisliked = topicDislikes.includes(loginData?.validuserone?._id);

  return (
    <div className="space-y-4">
      {/* Topic Header */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{topic.title}</h2>
            <div className="flex items-center mt-2">
              <span className="text-gray-600">Posted by {topic.userName}</span>
              <span className="text-gray-400 mx-2">•</span>
              <span className="text-gray-600">{formatDate(topic.createdAt)}</span>
            </div>
          </div>
          <div className="flex items-center">
            <div className="flex items-center mr-4">
              <button
                onClick={handleTopicLike}
                className={`flex items-center text-sm ${isTopicLiked ? 'text-blue-600' : 'text-gray-500'} hover:text-blue-600`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill={isTopicLiked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                </svg>
                {topicLikes.length}
              </button>
              <button
                onClick={handleTopicDislike}
                className={`flex items-center text-sm ml-2 ${isTopicDisliked ? 'text-red-600' : 'text-gray-500'} hover:text-red-600`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill={isTopicDisliked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018c.163 0 .326.02.485.06L17 4m-7 5v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 5h2m5 0v2a2 2 0 01-2 2h-2.5" />
                </svg>
                {topicDislikes.length}
              </button>
            </div>
            <button
              onClick={onBack}
              className="text-gray-600 hover:text-gray-800"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="text-gray-700 whitespace-pre-wrap">{topic.content}</div>
        
        {topic.tags && topic.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {topic.tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Replies Section */}
      <div className="space-y-4">
        {replies.length > 0 ? (
          organizeReplies(replies).map(reply => renderReply(reply))
        ) : (
          <div className="text-center text-gray-500 py-4">No replies yet. Be the first to reply!</div>
        )}
      </div>

      {/* Reply Input */}
      <div className="mt-4 bg-white rounded-lg border p-4">
        <textarea
          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows="3"
          placeholder={loginData ? "Write your reply..." : "Please login to reply"}
          value={newReply}
          onChange={(e) => setNewReply(e.target.value)}
          disabled={!loginData}
        />
        <div className="flex justify-end mt-2">
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            onClick={() => handlePostReply()}
            disabled={!loginData || !newReply.trim()}
          >
            {loginData ? "Post Reply" : "Login to Reply"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TopicDetail; 
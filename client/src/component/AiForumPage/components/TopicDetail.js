import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { LoginContext } from '../../ContextProvider/context';
import { useWebSocket } from './WebSocketContext';
import { formatDate, getAuthHeaders, handleAuthError, organizeReplies, REPLIES_URL } from './ForumUtils';

const TopicDetail = ({ topic, onBack, onDeleteTopic }) => {
  const { loginData } = useContext(LoginContext);
  const { joinTopic, leaveTopic, emitNewReply, emitDeleteReply, subscribeToEvent } = useWebSocket();
  
  const [replies, setReplies] = useState([]);
  const [newReply, setNewReply] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Join topic room on mount, leave on unmount
  useEffect(() => {
    if (topic) {
      joinTopic(topic._id);
      fetchReplies(topic._id);
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

  // Render a single reply and its children recursively
  const renderReply = (reply, depth = 0) => {
    const isReplying = replyingTo === reply._id;
    
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

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Topics
        </button>
        
        {/* Delete button for topic owner or admin */}
        {(loginData?.validuserone?._id.toString() === topic.userId.toString() || loginData?.validuserone?.role === 'admin') && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteTopic(topic._id);
            }}
            className="text-red-500 hover:text-red-700 flex items-center"
            title="Delete topic"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete Topic
          </button>
        )}
      </div>
      
      <div className="bg-white rounded-lg border p-4 mb-4">
        <h3 className="text-xl font-semibold mb-2">{topic.title}</h3>
        <div className="flex items-center text-sm text-gray-500 mb-3">
          <span className="font-medium text-blue-600 mr-2">{topic.userName}</span>
          <span>{formatDate(topic.createdAt)}</span>
        </div>
        <p className="text-gray-700 whitespace-pre-wrap">{topic.content}</p>
      </div>

      {/* Error message */}
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
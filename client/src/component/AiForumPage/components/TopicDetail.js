import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { LoginContext } from '../../ContextProvider/context';
import { useWebSocket } from './WebSocketContext';
import { formatDate, getAuthHeaders, handleAuthError, organizeReplies, REPLIES_URL, API_BASE_URL } from './ForumUtils';

// Message component for chat-style display
const Message = ({ 
  content, 
  userName, 
  timestamp, 
  mediaAttachments = [], 
  isAuthor = false, 
  onDelete = null, 
  onLike, 
  onDislike, 
  likes = [], 
  dislikes = [], 
  currentUserId,
  replyId,
  onReply,
  depth = 0,
  hasChildren = false,
  showViewMoreButton = false,
  onViewMore = null,
  parentUserName = null
}) => {
  const isLiked = likes?.includes(currentUserId);
  const isDisliked = dislikes?.includes(currentUserId);
  const maxDepth = 3; // Maximum depth to show before pagination
  
  return (
    <div className={`mb-4 ${depth > 0 ? `ml-${Math.min(depth * 4, 12)}` : ''} relative`}>
      {/* Vertical connecting line for nested replies */}
      {depth > 0 && (
        <div 
          className="absolute left-0 top-0 bottom-0 border-l-2 border-gray-200" 
          style={{ height: '100%', left: `${(depth-1) * 16}px` }}
        ></div>
      )}
      
      {/* Horizontal connecting line for nested replies */}
      {depth > 0 && (
        <div 
          className="absolute border-t-2 border-gray-200" 
          style={{ width: '16px', top: '24px', left: `${(depth-1) * 16}px` }}
        ></div>
      )}
      
      {/* Reply indicator */}
      {parentUserName && depth > 0 && (
        <div className="text-xs text-gray-500 mb-1 ml-2">
          Replying to <span className="font-medium text-blue-600">{parentUserName}</span>
        </div>
      )}
      
      <div className={`rounded-lg shadow-sm p-3 ${isAuthor ? 'bg-blue-50' : 'bg-white'} ${depth > 0 ? 'border-l border-gray-200' : ''}`}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center">
            <span className="font-medium text-blue-600 text-sm">{userName}</span>
            <span className="text-gray-400 text-xs ml-2">{formatDate(timestamp)}</span>
          </div>
          {onDelete && (
            <button
              onClick={onDelete}
              className="text-red-500 hover:text-red-700 ml-2"
              title="Delete"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
        
        <div className="text-gray-700 whitespace-pre-wrap text-sm">{content}</div>
        
        {/* Display media attachments */}
        {mediaAttachments && Array.isArray(mediaAttachments) && mediaAttachments.length > 0 && (
          <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
            {mediaAttachments.map((attachment, index) => (
              <div key={index} className="relative overflow-hidden rounded-md shadow-sm border border-gray-200 bg-gray-50" style={{ maxWidth: '120px', height: 'auto' }}>
                {attachment.fileType && attachment.fileType.startsWith('image/') ? (
                  <div className="relative" style={{ minHeight: '80px', maxHeight: '120px' }}>
                    <img
                      src={attachment.signedUrl}
                      alt={attachment.fileName}
                      className="w-full h-auto object-contain hover:scale-105 transition-transform duration-300"
                      style={{ maxHeight: '120px' }}
                      loading="lazy"
                      onError={(e) => {
                        console.error('Error loading image:', attachment.signedUrl);
                        e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Found';
                      }}
                    />
                  </div>
                ) : attachment.fileType && attachment.fileType.startsWith('video/') ? (
                  <div className="relative" style={{ minHeight: '80px', maxHeight: '120px' }}>
                    <video
                      controls
                      className="w-full h-auto"
                      style={{ maxHeight: '120px' }}
                      src={attachment.signedUrl}
                      preload="metadata"
                      onError={(e) => {
                        console.error('Error loading video:', attachment.signedUrl);
                      }}
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                ) : attachment.fileType && attachment.fileType.startsWith('audio/') ? (
                  <div className="p-2 bg-white rounded-md">
                    <audio
                      controls
                      className="w-full"
                      src={attachment.signedUrl}
                      preload="metadata"
                      onError={(e) => {
                        console.error('Error loading audio:', attachment.signedUrl);
                      }}
                    >
                      Your browser does not support the audio tag.
                    </audio>
                  </div>
                ) : (
                  <div className="p-2 flex items-center justify-center bg-white">
                    <a
                      href={attachment.signedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors duration-200 text-xs"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="truncate max-w-[60px]">{attachment.fileName}</span>
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        <div className="flex items-center mt-2 text-xs">
          <button
            onClick={onLike}
            className={`flex items-center mr-3 ${isLiked ? 'text-blue-600' : 'text-gray-500'} hover:text-blue-600`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill={isLiked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
            </svg>
            {likes?.length || 0}
          </button>
          <button
            onClick={onDislike}
            className={`flex items-center mr-3 ${isDisliked ? 'text-red-600' : 'text-gray-500'} hover:text-red-600`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill={isDisliked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018c.163 0 .326.02.485.06L17 4m-7 5v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 5h2m5 0v2a2 2 0 01-2 2h-2.5" />
            </svg>
            {dislikes?.length || 0}
          </button>
          <button
            onClick={() => onReply(replyId, userName)}
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            Reply
          </button>
        </div>
      </div>
      
      {/* View more button for deep nesting */}
      {showViewMoreButton && (
        <button 
          onClick={onViewMore}
          className="mt-2 text-sm text-blue-600 hover:text-blue-800 flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          Continue this thread
        </button>
      )}
    </div>
  );
};

const TopicDetail = ({ topic, onBack, onDeleteTopic }) => {
  const { loginData } = useContext(LoginContext);
  const { joinTopic, leaveTopic, emitNewReply, emitDeleteReply, subscribeToEvent } = useWebSocket();
  
  const [replies, setReplies] = useState([]);
  const [newReply, setNewReply] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [replySelectedFiles, setReplySelectedFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [topicLikes, setTopicLikes] = useState(topic?.likes || []);
  const [topicDislikes, setTopicDislikes] = useState(topic?.dislikes || []);
  const [parentUserName, setParentUserName] = useState(null);
  const [expandedThreads, setExpandedThreads] = useState({});
  const [threadView, setThreadView] = useState(null);
  
  // Maximum depth to display before showing "Continue thread" button
  const MAX_VISIBLE_DEPTH = 3;

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

  const handleFileSelect = (e, isReply = false) => {
    const files = Array.from(e.target.files);
    if (isReply) {
      setReplySelectedFiles(files);
    } else {
      setSelectedFiles(files);
    }
  };

  // Handle posting a reply
  const handlePostReply = async (parentReplyId = null) => {
    if (!loginData || !loginData.validuserone) {
      alert('Please log in to reply');
      return;
    }

    const content = parentReplyId ? replyContent : newReply;
    const files = parentReplyId ? replySelectedFiles : selectedFiles;

    if (!content.trim() || !topic) {
      alert('Please enter a reply');
      return;
    }

    setIsLoading(true);
    setIsUploading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('content', content);
      formData.append('topicId', topic._id);
      formData.append('userId', loginData.validuserone._id);
      formData.append('userName', loginData.validuserone.userName);
      if (parentReplyId) {
        formData.append('parentReplyId', parentReplyId);
      }

      // Append media files if any
      files.forEach(file => {
        formData.append('media', file);
      });

      const response = await axios.post(REPLIES_URL, formData, { 
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Emit socket event for new reply
      emitNewReply(response.data.reply);
      
      // Reset form
      if (parentReplyId) {
        setReplyContent('');
        setReplySelectedFiles([]);
        setReplyingTo(null);
      } else {
        setNewReply('');
        setSelectedFiles([]);
      }
    } catch (err) {
      if (handleAuthError(err, setError)) {
        return;
      }
      console.error('Error posting reply:', err);
      setError('Failed to post reply. Please try again later.');
    } finally {
      setIsLoading(false);
      setIsUploading(false);
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

  // Handle opening a thread in a dedicated view
  const handleViewThread = (replyId) => {
    setThreadView(replyId);
  };

  // Handle going back from thread view
  const handleBackFromThread = () => {
    setThreadView(null);
  };

  // Toggle expanded state for a thread
  const toggleThreadExpansion = (replyId) => {
    setExpandedThreads(prev => ({
      ...prev,
      [replyId]: !prev[replyId]
    }));
  };

  // Recursive function to render a reply and its children
  const renderReplyWithChildren = (reply, depth = 0, parentReply = null) => {
    const isAuthor = loginData?.validuserone?._id === reply.userId;
    const canDelete = isAuthor || loginData?.validuserone?.role === 'admin';
    const hasChildren = reply.children && reply.children.length > 0;
    const isExpanded = expandedThreads[reply._id];
    const isDeep = depth >= MAX_VISIBLE_DEPTH;
    const showViewMore = hasChildren && isDeep && !isExpanded;
    
    return (
      <React.Fragment key={reply._id}>
        <Message
          content={reply.content}
          userName={reply.userName}
          timestamp={reply.createdAt}
          mediaAttachments={reply.mediaAttachments}
          isAuthor={isAuthor}
          onDelete={canDelete ? () => handleDeleteReply(reply._id) : null}
          onLike={() => handleReplyLike(reply._id)}
          onDislike={() => handleReplyDislike(reply._id)}
          likes={reply.likes}
          dislikes={reply.dislikes}
          currentUserId={loginData?.validuserone?._id}
          replyId={reply._id}
          onReply={(replyId, userName) => {
            setReplyingTo(replyId);
            setReplyContent('');
            setReplySelectedFiles([]);
            setParentUserName(userName);
          }}
          depth={depth}
          hasChildren={hasChildren}
          showViewMoreButton={showViewMore}
          onViewMore={() => isDeep ? handleViewThread(reply._id) : toggleThreadExpansion(reply._id)}
          parentUserName={parentReply ? parentReply.userName : null}
        />
        
        {/* Show reply form if replying to this message */}
        {replyingTo === reply._id && (
          <div className={`mb-4 ml-${Math.min((depth + 1) * 4, 16)} relative`}>
            {/* Connecting line */}
            <div 
              className="absolute left-0 top-0 bottom-0 border-l-2 border-gray-200" 
              style={{ height: '100%', left: `${depth * 16}px` }}
            ></div>
            <div 
              className="absolute border-t-2 border-gray-200" 
              style={{ width: '16px', top: '24px', left: `${depth * 16}px` }}
            ></div>
            
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-xs text-gray-500 mb-2">
                Replying to <span className="font-medium text-blue-600">{parentUserName}</span>
              </div>
              <textarea
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                rows="3"
                placeholder="Write your reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                disabled={isLoading}
              />
              <div className="mt-2">
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*,audio/*"
                  onChange={(e) => handleFileSelect(e, true)}
                  className="w-full px-2 py-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  disabled={isLoading}
                />
                {replySelectedFiles.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-600">Selected files:</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {replySelectedFiles.map((file, index) => (
                        <div key={index} className="text-xs bg-gray-100 rounded px-2 py-1 flex items-center">
                          {file.name.substring(0, 15)}{file.name.length > 15 ? '...' : ''} 
                          <button 
                            className="ml-1 text-gray-500 hover:text-red-500"
                            onClick={() => setReplySelectedFiles(files => files.filter((_, i) => i !== index))}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-end mt-2 space-x-2">
                <button
                  className="px-3 py-1 text-gray-600 text-sm hover:text-gray-800"
                  onClick={() => {
                    setReplyingTo(null);
                    setReplyContent('');
                    setReplySelectedFiles([]);
                    setParentUserName(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
                  onClick={() => {
                    if (replyContent.trim()) {
                      handlePostReply(reply._id);
                    }
                  }}
                  disabled={isLoading || !replyContent.trim() || !loginData}
                >
                  {isUploading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Uploading...
                    </>
                  ) : (
                    'Reply'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Render children if expanded or not too deep */}
        {hasChildren && (!isDeep || isExpanded) && (
          <div className="ml-4">
            {reply.children.map(childReply => renderReplyWithChildren(childReply, depth + 1, reply))}
          </div>
        )}
      </React.Fragment>
    );
  };

  // Render replies with proper nesting
  const renderReplies = () => {
    // If we're in thread view, only render that specific thread
    if (threadView) {
      const thread = findReplyById(replies, threadView);
      if (thread) {
        return (
          <div className="thread-view">
            <div className="mb-4 flex items-center">
              <button
                onClick={handleBackFromThread}
                className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to main discussion
              </button>
            </div>
            {renderReplyWithChildren(thread, 0)}
          </div>
        );
      }
      return null;
    }
    
    // Otherwise render all top-level replies
    const organizedReplies = organizeReplies(replies);
    return organizedReplies.map(reply => renderReplyWithChildren(reply, 0));
  };
  
  // Helper function to find a reply by ID in the nested structure
  const findReplyById = (replies, replyId) => {
    for (const reply of replies) {
      if (reply._id === replyId) {
        return reply;
      }
      if (reply.children && reply.children.length > 0) {
        const found = findReplyById(reply.children, replyId);
        if (found) return found;
      }
    }
    return null;
  };

  if (!topic) return null;

  const isTopicLiked = topicLikes.includes(loginData?.validuserone?._id);
  const isTopicDisliked = topicDislikes.includes(loginData?.validuserone?._id);

  return (
    <div className="flex flex-col h-full">
      {/* Header with back button */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center sticky top-0 z-10">
        <button
          onClick={threadView ? handleBackFromThread : onBack}
          className="mr-3 text-gray-500 hover:text-gray-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <h2 className="font-semibold text-lg flex-1">{threadView ? 'Thread' : topic.title}</h2>
        {!threadView && (
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
      
      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {/* Topic as first message (only in main view) */}
        {!threadView && (
          <Message
            content={topic.content}
            userName={topic.userName}
            timestamp={topic.createdAt}
            mediaAttachments={topic.mediaAttachments}
            isAuthor={loginData?.validuserone?._id === topic.userId}
            onLike={handleTopicLike}
            onDislike={handleTopicDislike}
            likes={topicLikes}
            dislikes={topicDislikes}
            currentUserId={loginData?.validuserone?._id}
            replyId="topic"
            onReply={() => {
              setReplyingTo(null);
              setReplyContent('');
              setReplySelectedFiles([]);
              setParentUserName(null);
              document.getElementById('mainReplyInput').focus();
            }}
          />
        )}
        
        {/* Replies as nested messages */}
        {renderReplies()}
      </div>
      
      {/* Input Container (only show in main view, not thread view) */}
      {!threadView && !replyingTo && (
        <div className="p-4 bg-white border-t border-gray-200">
          <form onSubmit={(e) => {
            e.preventDefault();
            if (newReply.trim()) {
              handlePostReply();
            }
          }}>
            <div className="flex flex-col">
              <div className="flex mb-2">
                <input
                  id="mainReplyInput"
                  type="text"
                  className="flex-1 border border-gray-200 rounded-md p-3 mr-2 text-sm"
                  placeholder="Write your reply..."
                  value={newReply}
                  onChange={(e) => setNewReply(e.target.value)}
                  disabled={isLoading}
                />
                <button 
                  type="submit"
                  className="bg-blue-600 text-white font-medium rounded-md px-4 py-2 flex items-center"
                  disabled={isLoading || !newReply.trim() || !loginData}
                >
                  {isUploading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Uploading...
                    </>
                  ) : (
                    'Send'
                  )}
                </button>
              </div>
              <input
                type="file"
                multiple
                accept="image/*,video/*,audio/*"
                onChange={(e) => handleFileSelect(e)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                disabled={isLoading}
              />
              {selectedFiles.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-600">Selected files:</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="text-xs bg-gray-100 rounded px-2 py-1 flex items-center">
                        {file.name.substring(0, 15)}{file.name.length > 15 ? '...' : ''} 
                        <button 
                          className="ml-1 text-gray-500 hover:text-red-500"
                          onClick={() => setSelectedFiles(files => files.filter((_, i) => i !== index))}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default TopicDetail;
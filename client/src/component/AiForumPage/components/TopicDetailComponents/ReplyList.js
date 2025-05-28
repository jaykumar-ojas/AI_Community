import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Message from './Message';
import InlineReplyForm from './InlineReplyForm';
import { getAuthHeaders, handleAuthError, API_BASE_URL } from '../ForumUtils';

const ReplyList = ({
  replies,
  setReplies,
  loginData,
  setReplyingTo,
  setReplyContent,
  setReplySelectedFiles,
  setParentUserName,
  expandedThreads,
  setError,
  MAX_VISIBLE_DEPTH,
  handleViewThread,
  emitDeleteReply,
  topicId,
  setExpandedThreads,
  replyingTo,
  replyContent,
  replySelectedFiles,
  topic,
  emitNewReply
}) => {
  // State to track which threads have loaded more replies
  const [loadedThreads, setLoadedThreads] = useState({});
  // State to track loading status for each thread
  const [loadingThreads, setLoadingThreads] = useState({});
  // Track if there are more replies to load for each thread
  const [hasMoreReplies, setHasMoreReplies] = useState({});
  // Track the page number for pagination
  const [threadPages, setThreadPages] = useState({});
  // Reference to the thread container for scroll detection
  const threadContainerRef = useRef(null);

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
      const response = await axios.delete(`${API_BASE_URL}/forum/replies/${replyId}`, {
        headers: getAuthHeaders()
      });

      if (response.status === 200) {
        // Emit socket event for reply deletion
        emitDeleteReply(replyId, topicId);
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
    }
  };

  // Toggle expanded state for a thread
  const toggleThreadExpansion = (replyId) => {
    setExpandedThreads(prev => ({
      ...prev,
      [replyId]: !prev[replyId]
    }));
  };

  // Load more replies for a specific thread
  const loadMoreReplies = async (parentReplyId) => {
    if (loadingThreads[parentReplyId]) return;
    
    setLoadingThreads(prev => ({ ...prev, [parentReplyId]: true }));
    
    try {
      const page = threadPages[parentReplyId] || 1;
      const response = await axios.get(
        `${API_BASE_URL}/forum/replies/thread/${parentReplyId}?page=${page}&limit=10`, 
        { headers: getAuthHeaders() }
      );
      
      if (response.data.replies && response.data.replies.length > 0) {
        // Update the replies state with the newly loaded replies
        const newReplies = response.data.replies;
        
        // Update the replies in the state
        setReplies(prevReplies => {
          // Create a deep copy of the replies array
          const updatedReplies = JSON.parse(JSON.stringify(prevReplies));
          
          // Find the parent reply and add the new replies to its children
          const updateReplyChildren = (replies, parentId) => {
            for (let i = 0; i < replies.length; i++) {
              if (replies[i]._id === parentId) {
                // If the parent has no children yet, initialize the array
                if (!replies[i].children) {
                  replies[i].children = [];
                }
                // Add the new replies to the children array
                replies[i].children = [...replies[i].children, ...newReplies];
                return true;
              }
              // Recursively search in children
              if (replies[i].children && replies[i].children.length > 0) {
                if (updateReplyChildren(replies[i].children, parentId)) {
                  return true;
                }
              }
            }
            return false;
          };
          
          updateReplyChildren(updatedReplies, parentReplyId);
          return updatedReplies;
        });
        
        // Update the page number for this thread
        setThreadPages(prev => ({ ...prev, [parentReplyId]: page + 1 }));
        
        // Mark this thread as having loaded more replies
        setLoadedThreads(prev => ({ ...prev, [parentReplyId]: true }));
        
        // Check if there are more replies to load
        setHasMoreReplies(prev => ({ 
          ...prev, 
          [parentReplyId]: response.data.hasMore 
        }));
      } else {
        // No more replies to load
        setHasMoreReplies(prev => ({ ...prev, [parentReplyId]: false }));
      }
    } catch (error) {
      console.error('Error loading more replies:', error);
      if (!handleAuthError(error, setError)) {
        setError('Failed to load more replies. Please try again.');
      }
    } finally {
      setLoadingThreads(prev => ({ ...prev, [parentReplyId]: false }));
    }
  };

  // Calculate the depth of a reply in the thread structure
  const calculateReplyDepth = (replyId, replies, currentDepth = 0) => {
    for (const reply of replies) {
      if (reply._id === replyId) {
        return currentDepth;
      }
      if (reply.children && reply.children.length > 0) {
        const foundDepth = calculateReplyDepth(replyId, reply.children, currentDepth + 1);
        if (foundDepth !== -1) {
          return foundDepth;
        }
      }
    }
    return -1;
  };

  // Recursive function to render a reply and its children
  const renderReplyWithChildren = (reply, depth = 0, parentReply = null) => {
    const isAuthor = loginData?.validuserone?._id === reply.userId;
    const canDelete = isAuthor || loginData?.validuserone?.role === 'admin';
    const hasChildren = reply.children && reply.children.length > 0;
    const isExpanded = expandedThreads[reply._id];
    const isDeep = depth >= MAX_VISIBLE_DEPTH;
    const showLoadMore = hasMoreReplies[reply._id] && isExpanded && !isDeep;
    const showContinueThread = hasChildren && isDeep;
    const isRepliedTo = replyingTo === reply._id;
    
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
          showViewMoreButton={!isExpanded && hasChildren && !isDeep}
          onViewMore={() => {
            if (isDeep) {
              handleViewThread(reply._id);
            } else {
              toggleThreadExpansion(reply._id);
              if (!loadedThreads[reply._id] && hasChildren) {
                loadMoreReplies(reply._id);
              }
            }
          }}
          parentUserName={parentReply ? parentReply.userName : null}
        />
        
        {/* Show inline reply form right after this message if replying to it */}
        {isRepliedTo && (
          <InlineReplyForm
            replyingTo={replyingTo}
            replyContent={replyContent}
            setReplyContent={setReplyContent}
            replySelectedFiles={replySelectedFiles}
            setReplySelectedFiles={setReplySelectedFiles}
            loginData={loginData}
            parentUserName={reply.userName}
            depth={depth}
            topic={topic}
            emitNewReply={emitNewReply}
            setError={setError}
            setReplyingTo={setReplyingTo}
            setParentUserName={setParentUserName}
          />
        )}
        
        {/* Show "Continue this thread" button for deep threads */}
        {showContinueThread && (
          <div className="ml-4 my-3">
            <button
              onClick={() => handleViewThread(reply._id)}
              className="px-4 py-2 rounded-md text-sm bg-gray-100 text-blue-600 hover:bg-gray-200 transition-colors duration-200 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
              Continue this thread
            </button>
          </div>
        )}
        
        {/* Render children if expanded and not too deep */}
        {hasChildren && isExpanded && !isDeep && (
          <div className="ml-4" ref={threadContainerRef}>
            {reply.children.map(childReply => renderReplyWithChildren(childReply, depth + 1, reply))}
            
            {/* Load more button */}
            {showLoadMore && (
              <div className="flex justify-center my-3">
                <button
                  onClick={() => loadMoreReplies(reply._id)}
                  disabled={loadingThreads[reply._id]}
                  className={`px-4 py-2 rounded-md text-sm ${
                    loadingThreads[reply._id] 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                  } transition-colors duration-200`}
                >
                  {loadingThreads[reply._id] ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Loading...
                    </span>
                  ) : (
                    'Load more replies'
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </React.Fragment>
    );
  };

  return (
    <div>
      {replies.map(reply => renderReplyWithChildren(reply, 0))}
    </div>
  );
};

export default ReplyList;

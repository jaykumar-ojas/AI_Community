import React, { useState, useRef } from 'react';
import axios from 'axios';
import Message from './Message';
import InlineReplyForm from './InlineReplyForm';
import { getAuthHeaders, handleAuthError, API_BASE_URL } from '../ForumUtils';

const ThreadView = ({ 
  thread, 
  onBack,
  loginData,
  handleReplyLike,
  handleReplyDislike,
  handleDeleteReply,
  setReplyingTo,
  setReplyContent,
  setReplySelectedFiles,
  setParentUserName,
  expandedThreads,
  toggleThreadExpansion,
  MAX_VISIBLE_DEPTH,
  setError
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
  // Local copy of the thread to manage pagination
  const [threadData, setThreadData] = useState(thread || null);
  // State to track which thread is currently being viewed in a nested view
  const [nestedThreadView, setNestedThreadView] = useState(null);
  // State to track which reply is being replied to
  const [localReplyingTo, setLocalReplyingTo] = useState(null);
  // State for reply content
  const [localReplyContent, setLocalReplyContent] = useState('');
  // State for reply selected files
  const [localReplySelectedFiles, setLocalReplySelectedFiles] = useState([]);
  // State for parent user name
  const [localParentUserName, setLocalParentUserName] = useState(null);
  
  if (!thread) return null;

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
        
        // Update the thread data in the state
        setThreadData(prevThread => {
          // Create a deep copy of the thread
          const updatedThread = JSON.parse(JSON.stringify(prevThread));
          
          // Find the parent reply and add the new replies to its children
          const updateReplyChildren = (reply, parentId) => {
            if (reply._id === parentId) {
              // If the parent has no children yet, initialize the array
              if (!reply.children) {
                reply.children = [];
              }
              // Add the new replies to the children array
              reply.children = [...reply.children, ...newReplies];
              return true;
            }
            
            // Recursively search in children
            if (reply.children && reply.children.length > 0) {
              for (let i = 0; i < reply.children.length; i++) {
                if (updateReplyChildren(reply.children[i], parentId)) {
                  return true;
                }
              }
            }
            return false;
          };
          
          updateReplyChildren(updatedThread, parentReplyId);
          return updatedThread;
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

  // Handle viewing a nested thread
  const handleViewNestedThread = (replyId) => {
    // Find the reply in the thread data
    const findReply = (reply, targetId) => {
      if (reply._id === targetId) {
        return reply;
      }
      
      if (reply.children && reply.children.length > 0) {
        for (const childReply of reply.children) {
          const found = findReply(childReply, targetId);
          if (found) return found;
        }
      }
      
      return null;
    };
    
    const nestedReply = findReply(threadData, replyId);
    if (nestedReply) {
      setNestedThreadView(nestedReply);
    }
  };
  
  // Go back from nested thread view
  const handleBackFromNestedView = () => {
    setNestedThreadView(null);
  };

  // Handle reply to a specific message
  const handleReply = (replyId, userName) => {
    setLocalReplyingTo(replyId);
    setLocalReplyContent('');
    setLocalReplySelectedFiles([]);
    setLocalParentUserName(userName);
    
    // Also update parent component state if needed
    if (setReplyingTo) setReplyingTo(replyId);
    if (setReplyContent) setReplyContent('');
    if (setReplySelectedFiles) setReplySelectedFiles([]);
    if (setParentUserName) setParentUserName(userName);
  };

  // Handle completion of a reply
  const handleReplyComplete = () => {
    setLocalReplyingTo(null);
    setLocalReplyContent('');
    setLocalReplySelectedFiles([]);
    setLocalParentUserName(null);
    
    // Also update parent component state if needed
    if (setReplyingTo) setReplyingTo(null);
    if (setReplyContent) setReplyContent('');
    if (setReplySelectedFiles) setReplySelectedFiles([]);
    if (setParentUserName) setParentUserName(null);
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
    const isRepliedTo = localReplyingTo === reply._id;
    
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
          onReply={(replyId, userName) => handleReply(replyId, userName)}
          depth={depth}
          hasChildren={hasChildren}
          showViewMoreButton={!isExpanded && hasChildren && !isDeep}
          onViewMore={() => {
            if (isDeep) {
              handleViewNestedThread(reply._id);
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
            replyingTo={localReplyingTo}
            replyContent={localReplyContent}
            setReplyContent={setLocalReplyContent}
            replySelectedFiles={localReplySelectedFiles}
            setReplySelectedFiles={setLocalReplySelectedFiles}
            loginData={loginData}
            parentUserName={reply.userName}
            depth={depth}
            topic={{ _id: thread.topicId }}
            emitNewReply={(replyData) => {
              // Add the new reply to the thread data
              setThreadData(prevThread => {
                const updatedThread = JSON.parse(JSON.stringify(prevThread));
                
                const addReplyToChildren = (reply, parentId) => {
                  if (reply._id === parentId) {
                    if (!reply.children) {
                      reply.children = [];
                    }
                    reply.children.push(replyData);
                    return true;
                  }
                  
                  if (reply.children && reply.children.length > 0) {
                    for (let i = 0; i <reply.children.length; i++) {
                      if (addReplyToChildren(reply.children[i], parentId)) {
                        return true;
                      }
                    }
                  }
                  return false;
                };
                
                addReplyToChildren(updatedThread, localReplyingTo);
                return updatedThread;
              });
              
              // Clear the reply form
              handleReplyComplete();
            }}
            setError={setError}
            setReplyingTo={setLocalReplyingTo}
            setParentUserName={setLocalParentUserName}
          />
        )}
        
        {/* Show "Continue this thread" button for deep threads */}
        {showContinueThread && (
          <div className="ml-4 my-3">
            <button
              onClick={() => handleViewNestedThread(reply._id)}
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
    <div className="thread-view">
      <div className="mb-4 flex items-center">
        <button
          onClick={nestedThreadView ? handleBackFromNestedView : onBack}
          className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {nestedThreadView ? 'Back to previous thread' : 'Back to main discussion'}
        </button>
      </div>
      {nestedThreadView ? renderReplyWithChildren(nestedThreadView, 0) : (threadData && renderReplyWithChildren(threadData, 0))}
    </div>
  );
};

export default ThreadView;

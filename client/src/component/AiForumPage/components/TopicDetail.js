import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { LoginContext } from '../../ContextProvider/context';
import { useWebSocket } from './WebSocketContext';
import { getAuthHeaders, handleAuthError, organizeReplies, REPLIES_URL, API_BASE_URL } from './ForumUtils';
import Message from './Message';
import ImageGenerator from './ImageGenerator';
import AITextResponse from './AITextResponse';
import ReplyForm from './ReplyForm';

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
  
  // Image generation states
  const [showImageGenerator, setShowImageGenerator] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState('');
  const [isInReplyImageGenerator, setIsInReplyImageGenerator] = useState(false);
  
  // Add new state for AI text response
  const [showAITextResponse, setShowAITextResponse] = useState(false);
  const [aiTextPrompt, setAiTextPrompt] = useState('');
  
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
        setReplies(prevReplies => {
          // Check if the reply already exists
          const replyExists = prevReplies.some(reply => reply._id === newReply._id);
          if (replyExists) {
            return prevReplies;
          }
          return [...prevReplies, newReply];
        });
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
        if (file.url) {
          // If it's an S3 URL, append it directly
          formData.append('mediaUrls', file.url);
        } else {
          // If it's a regular file, append it as before
          formData.append('media', file);
        }
      });

      const response = await axios.post(REPLIES_URL, formData, { 
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Create a new reply object with the response data
      const newReplyData = {
        ...response.data.reply,
        likes: [],
        dislikes: [],
        children: []
      };

      // Update the replies state immediately
      setReplies(prevReplies => {
        if (parentReplyId) {
          // If this is a reply to another reply, find the parent and add this as a child
          const updatedReplies = prevReplies.map(reply => {
            if (reply._id === parentReplyId) {
              return {
                ...reply,
                children: [...(reply.children || []), newReplyData]
              };
            }
            return reply;
          });
          return updatedReplies;
        } else {
          // If this is a top-level reply, add it to the main replies array
          return [...prevReplies, newReplyData];
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
            
            <ReplyForm
              isReplyForm={true}
              content={replyContent}
              setContent={setReplyContent}
              selectedFiles={replySelectedFiles}
              setSelectedFiles={setReplySelectedFiles}
              handleFileSelect={handleFileSelect}
              handlePostReply={() => handlePostReply(reply._id)}
              isLoading={isLoading}
              isUploading={isUploading}
              loginData={loginData}
              parentUserName={parentUserName}
              setReplyingTo={setReplyingTo}
              setReplyContent={setReplyContent}
              setReplySelectedFiles={setReplySelectedFiles}
              setParentUserName={setParentUserName}
              setShowImageGenerator={setShowImageGenerator}
              setIsInReplyImageGenerator={setIsInReplyImageGenerator}
              setShowAITextResponse={setShowAITextResponse}
            />
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
              setTimeout(() => {
                const textarea = document.getElementById('mainReplyTextarea');
                if (textarea) {
                  textarea.focus();
                }
              }, 100);
            }}
          />
        )}
        
        {/* Replies as nested messages */}
        {renderReplies()}
      </div>
      
      {/* Input Container (only show in main view, not thread view) */}
      {!threadView && !replyingTo && (
        <ReplyForm
          content={newReply}
          setContent={setNewReply}
          selectedFiles={selectedFiles}
          setSelectedFiles={setSelectedFiles}
          handleFileSelect={handleFileSelect}
          handlePostReply={handlePostReply}
          isLoading={isLoading}
          isUploading={isUploading}
          loginData={loginData}
          setShowImageGenerator={setShowImageGenerator}
          setIsInReplyImageGenerator={setIsInReplyImageGenerator}
          setShowAITextResponse={setShowAITextResponse}
          autoFocus={!replyingTo}
        />
      )}
      
      {/* Reply form for nested replies */}
      {replyingTo && (
        <ReplyForm
          isReplyForm={true}
          content={replyContent}
          setContent={setReplyContent}
          selectedFiles={replySelectedFiles}
          setSelectedFiles={setReplySelectedFiles}
          handleFileSelect={handleFileSelect}
          handlePostReply={() => handlePostReply(replyingTo)}
          isLoading={isLoading}
          isUploading={isUploading}
          loginData={loginData}
          parentUserName={parentUserName}
          setReplyingTo={setReplyingTo}
          setReplyContent={setReplyContent}
          setReplySelectedFiles={setReplySelectedFiles}
          setParentUserName={setParentUserName}
          setShowImageGenerator={setShowImageGenerator}
          setIsInReplyImageGenerator={setIsInReplyImageGenerator}
          setShowAITextResponse={setShowAITextResponse}
          autoFocus={true}
        />
      )}
      
      {/* Add the image generator modal */}
      <ImageGenerator
        showImageGenerator={showImageGenerator}
        setShowImageGenerator={setShowImageGenerator}
        imagePrompt={imagePrompt}
        setImagePrompt={setImagePrompt}
        generatedImageUrl={generatedImageUrl}
        setGeneratedImageUrl={setGeneratedImageUrl}
        setError={setError}
        setSelectedFiles={setSelectedFiles}
        setReplySelectedFiles={setReplySelectedFiles}
        setNewReply={setNewReply}
        setReplyContent={setReplyContent}
        isInReplyImageGenerator={isInReplyImageGenerator}
        replyingTo={replyingTo}
      />

      {/* Add the AI text response modal */}
      <AITextResponse
        showAITextResponse={showAITextResponse}
        setShowAITextResponse={setShowAITextResponse}
        aiTextPrompt={aiTextPrompt}
        setAiTextPrompt={setAiTextPrompt}
        setError={setError}
        setNewReply={setNewReply}
        setReplyContent={setReplyContent}
        isInReplyImageGenerator={isInReplyImageGenerator}
        replyingTo={replyingTo}
        topicContent={topic.content}
      />
    </div>
  );
};

export default TopicDetail;
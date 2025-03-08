import React, { useState, useEffect, useCallback, useRef, useContext } from 'react';
import axios from 'axios';
import { LoginContext } from '../ContextProvider/context';

// Reply form component with focus management
const ReplyForm = ({ commentId, initialContent = '', onSubmit, onCancel }) => {
  const [content, setContent] = useState(initialContent);
  const textareaRef = useRef(null);
  
  // Focus the textarea when the component mounts
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);
  
  const handleChange = (e) => {
    setContent(e.target.value);
  };
  
  const handleSubmit = () => {
    if (content.trim()) {
      onSubmit(commentId, content);
      setContent('');
    }
  };
  
  return (
    <div className="mt-2">
      <textarea
        ref={textareaRef}
        className="bg-gray-100 rounded border border-gray-400 leading-normal resize-none w-full h-16 py-2 px-3 font-medium placeholder-gray-400 focus:outline-none focus:bg-white text-sm"
        placeholder="Write a reply..."
        value={content}
        onChange={handleChange}
      ></textarea>
      <div className="flex justify-end mt-1">
        <button
          className="px-2 py-1 rounded-md text-white bg-blue-500 text-sm mr-2"
          onClick={handleSubmit}
        >
          Post Reply
        </button>
        <button
          className="px-2 py-1 rounded-md text-gray-500 bg-gray-200 text-sm"
          onClick={() => onCancel(commentId)}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

const Discussion = ({ postId }) => {
  const { loginData } = useContext(LoginContext);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyStates, setReplyStates] = useState({});
  const [replyContent, setReplyContent] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState({
    id: '',
    name: ''
  });

  const API_URL = 'http://localhost:8099/comments';

  // Set current user from login data
  useEffect(() => {
    if (loginData && loginData.validuserone) {
      setCurrentUser({
        id: loginData.validuserone._id,
        name: loginData.validuserone.userName
      });
    }
  }, [loginData]);

  // Fetch comments from API
  useEffect(() => {
    const fetchComments = async () => {
      try {
        setLoading(true);
        console.log("Fetching comments for postId:", postId);
        const response = await axios.get(`${API_URL}?postId=${postId}`);
        console.log("Comments API response:", response.data);
        if (response.data && response.data.comments) {
          // Transform the nested object structure into an array for rendering
          const commentsArray = transformCommentsToArray(response.data.comments);
          console.log("Transformed comments array:", commentsArray);
          setComments(commentsArray);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching comments:', error);
        setLoading(false);
      }
    };

    if (postId) {
      console.log("PostId is available, fetching comments:", postId);
      fetchComments();
    } else {
      console.log("PostId is not available, skipping comment fetch");
    }
  }, [postId]);

  // Transform the nested object structure from MongoDB into a flat array with reply references
  const transformCommentsToArray = (commentsObj) => {
    const result = [];
    
    // Process top-level comments first
    Object.keys(commentsObj).forEach(key => {
      const comment = commentsObj[key];
      const commentData = {
        _id: comment._id,
        author: comment.author,
        commentText: comment.commentText,
        depth: comment.depth,
        postedDate: new Date(comment.postedDate),
        parentId: comment.parentId,
        replies: []
      };
      
      // Process children/replies recursively
      if (comment.children && Object.keys(comment.children).length > 0) {
        commentData.replies = transformCommentsToArray(comment.children);
      }
      
      result.push(commentData);
    });
    
    return result;
  };

  // Handle posting new comments
  const handlePostComment = async () => {
    if (newComment.trim() && postId && currentUser.id) {
      try {
        const response = await axios.post(API_URL, {
          id: currentUser.id,
          name: currentUser.name,
          commentText: newComment,
          postId: postId
        });
        
        if (response.data && response.data.comment) {
          // Refresh comments after posting
          const updatedResponse = await axios.get(`${API_URL}?postId=${postId}`);
          if (updatedResponse.data && updatedResponse.data.comments) {
            const commentsArray = transformCommentsToArray(updatedResponse.data.comments);
            setComments(commentsArray);
          }
        }
        setNewComment('');
      } catch (error) {
        console.error('Error posting comment:', error);
      }
    } else if (!currentUser.id) {
      alert("Please log in to post a comment");
    }
  };

  // Handle deleting a comment
  const handleDeleteComment = async (commentId) => {
    if (!currentUser.id) {
      alert("Please log in to delete comments");
      return;
    }

    // Ask for confirmation before deleting
    if (!window.confirm("Are you sure you want to delete this comment? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await axios.delete(`${API_URL}/${commentId}`, {
        data: { userId: currentUser.id }
      });
      
      if (response.status === 200) {
        // Refresh comments after deletion
        const updatedResponse = await axios.get(`${API_URL}?postId=${postId}`);
        if (updatedResponse.data && updatedResponse.data.comments) {
          const commentsArray = transformCommentsToArray(updatedResponse.data.comments);
          setComments(commentsArray);
        } else {
          // If no comments left, set empty array
          setComments([]);
        }
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      if (error.response && error.response.status === 403) {
        alert("You are not authorized to delete this comment");
      } else {
        alert("Error deleting comment. Please try again.");
      }
    }
  };

  // Toggle reply form visibility
  const toggleReplyForm = useCallback((commentId) => {
    if (!currentUser.id) {
      alert("Please log in to reply to comments");
      return;
    }
    
    setReplyStates(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  }, [currentUser.id]);

  // Cancel reply
  const handleCancelReply = useCallback((commentId) => {
    setReplyStates(prev => ({
      ...prev,
      [commentId]: false
    }));
  }, []);

  // Submit reply to a comment
  const handleSubmitReply = async (commentId, replyText) => {
    if (replyText.trim() && currentUser.id) {
      try {
        // Find the parent comment to get its depth
        const findComment = (comments, id) => {
          for (const comment of comments) {
            if (comment._id === id) {
              return comment;
            }
            if (comment.replies && comment.replies.length > 0) {
              const found = findComment(comment.replies, id);
              if (found) return found;
            }
          }
          return null;
        };
        
        const parentComment = findComment(comments, commentId);
        if (!parentComment) return;
        
        const response = await axios.post(API_URL, {
          id: currentUser.id,
          name: currentUser.name,
          commentText: replyText,
          parentId: commentId,
          depth: parentComment.depth + 1,
          postId: postId
        });
        
        if (response.data && response.data.comment) {
          // Refresh comments after posting reply
          const updatedResponse = await axios.get(`${API_URL}?postId=${postId}`);
          if (updatedResponse.data && updatedResponse.data.comments) {
            const commentsArray = transformCommentsToArray(updatedResponse.data.comments);
            setComments(commentsArray);
          }
        }
        
        // Hide reply form
        setReplyStates(prev => ({
          ...prev,
          [commentId]: false
        }));
      } catch (error) {
        console.error('Error posting reply:', error);
      }
    } else if (!currentUser.id) {
      alert("Please log in to reply to comments");
    }
  };

  // Format date for display
  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  // Handle reply input change
  const handleReplyChange = (commentId, value) => {
    setReplyContent(prev => ({
      ...prev,
      [commentId]: value
    }));
  };

  // Recursive component to render comments and their replies
  const CommentComponent = ({ comment, level = 0 }) => {
    // Check if the current user is the author of this comment
    const isAuthor = currentUser.id === comment.author.id;
    
    return (
      <div key={comment._id} className={`mt-${level > 0 ? 2 : 0}`}>
        <div className={`flex w-full justify-between border rounded-md ${level > 0 ? 'ml-5' : ''}`}>
          <div className="p-3 w-full">
            <div className="flex gap-3 items-center justify-between">
              <div className="flex gap-3 items-center">
                <img
                  src="https://avatars.githubusercontent.com/u/22263436?v=4"
                  alt="avatar"
                  className="object-cover w-10 h-10 rounded-full border-2 border-emerald-400 shadow-emerald-400"
                />
                <div className="flex flex-col">
                  <h3 className="font-bold">{comment.author.name}</h3>
                  <span className="text-xs text-gray-400">{formatDate(comment.postedDate)}</span>
                </div>
              </div>
              
              {/* Delete button - only visible to the author */}
              {isAuthor && (
                <button 
                  className="text-red-500 hover:text-red-700 text-sm"
                  onClick={() => handleDeleteComment(comment._id)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
            <p className="text-gray-600 mt-2">{comment.commentText}</p>
            <div className="flex justify-between items-center mt-2">
              <button 
                className="text-blue-500 text-sm"
                onClick={() => toggleReplyForm(comment._id)}
              >
                Reply
              </button>
              <span className="text-xs text-gray-400">Depth: {comment.depth}</span>
            </div>
            
            {/* Reply form */}
            {replyStates[comment._id] && (
              <ReplyForm
                commentId={comment._id}
                onSubmit={handleSubmitReply}
                onCancel={handleCancelReply}
              />
            )}
          </div>
        </div>

        {/* Render replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="ml-5">
            {level === 0 && <div className="text-gray-300 font-bold pl-6">|</div>}
            {comment.replies.map(reply => (
              <CommentComponent key={reply._id} comment={reply} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-lg border p-1 md:p-3">
      <h3 className="font-semibold p-1">Discussion</h3>
      <div
        className="flex flex-col gap-3 m-3 overflow-y-auto"
        style={{ maxHeight: '500px' }}
      >
        {loading ? (
          <div className="text-center text-gray-500 py-4">Loading comments...</div>
        ) : comments.length > 0 ? (
          comments.map(comment => (
            <CommentComponent key={comment._id} comment={comment} />
          ))
        ) : (
          <div className="text-center text-gray-500 py-4">No comments yet. Be the first to comment!</div>
        )}
      </div>

      <div className="w-full px-3 mb-2 mt-6">
        <textarea
          className="bg-gray-100 rounded border border-gray-400 leading-normal resize-none w-full h-20 py-2 px-3 font-medium placeholder-gray-400 focus:outline-none focus:bg-white"
          name="body"
          placeholder="Add a comment..."
          required
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
        ></textarea>
      </div>

      <div className="w-full flex justify-end px-3 my-3">
        <button
          className="px-2.5 py-1.5 rounded-md text-white text-sm bg-indigo-500"
          onClick={handlePostComment}
          disabled={!currentUser.id}
        >
          {currentUser.id ? "Post Comment" : "Login to Comment"}
        </button>
      </div>
    </div>
  );
};

export default Discussion;
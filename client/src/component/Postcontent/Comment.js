import React, { useState, useEffect, useCallback, useRef, useContext } from 'react';
import axios from 'axios';
import { LoginContext } from '../ContextProvider/context';

// Reply form component with focus management
const ReplyForm = ({ commentId, initialContent = '', onSubmit, onCancel }) => {
  const [content, setContent] = useState(initialContent);
  const [selectedFiles, setSelectedFiles] = useState([]);
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

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
  };
  
  const handleSubmit = () => {
    if (content.trim() || selectedFiles.length > 0) {
      onSubmit(commentId, content, selectedFiles);
      setContent('');
      setSelectedFiles([]);
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
      <div className="mt-2">
        <input
          type="file"
          multiple
          accept="image/*,video/*,audio/*"
          onChange={handleFileSelect}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {selectedFiles.length > 0 && (
          <div className="mt-2">
            <p className="text-sm text-gray-600">Selected files:</p>
            <ul className="mt-1 space-y-1">
              {selectedFiles.map((file, index) => (
                <li key={index} className="text-sm text-gray-500">
                  {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div className="flex justify-end mt-2">
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
  const [selectedFiles, setSelectedFiles] = useState([]);
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
    console.log("Setting current user from loginData:", loginData);
    if (loginData) {
      // Extract user ID and name from loginData
      const userId = loginData.validuserone?._id || loginData.validateUser?._id;
      const userName = loginData.validuserone?.userName || loginData.validateUser?.userName;
      
      console.log("Extracted userId:", userId);
      console.log("Extracted userName:", userName);
      
      if (userId && userName) {
        setCurrentUser({
          id: userId,
          name: userName
        });
      }
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
        likes: comment.likes || [],
        dislikes: comment.dislikes || [],
        mediaAttachments: comment.mediaAttachments || [],
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

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
  };

  // Handle posting new comments
  const handlePostComment = async () => {
    if (!currentUser.id) {
      if (!loginData) {
        alert("Please log in to post a comment");
      } else {
        // User is logged in but the currentUser state hasn't been updated yet
        console.error("User is logged in but currentUser state is not set properly");
        // Try to use loginData directly
        const userId = loginData.validuserone?._id || loginData.validateUser?._id;
        const userName = loginData.validuserone?.userName || loginData.validateUser?.userName;
        
        if (userId && userName) {
          setCurrentUser({
            id: userId,
            name: userName
          });
        } else {
          alert("Unable to identify user. Please try refreshing the page.");
        }
      }
      return;
    }
    
    if ((newComment.trim() || selectedFiles.length > 0) && postId) {
      try {
        const formData = new FormData();
        formData.append('id', currentUser.id);
        formData.append('name', currentUser.name);
        formData.append('commentText', newComment);
        formData.append('postId', postId);

        // Append media files if any
        selectedFiles.forEach(file => {
          formData.append('media', file);
        });

        const response = await axios.post(API_URL, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
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
        setSelectedFiles([]);
      } catch (error) {
        console.error('Error posting comment:', error);
      }
    }
  };

  // Handle deleting a comment
  const handleDeleteComment = async (commentId) => {
    console.log("Delete comment triggered for ID:", commentId);
    console.log("Current user:", currentUser);
    
    if (!currentUser.id) {
      alert("Please log in to delete comments");
      return;
    }

    // Ask for confirmation before deleting
    if (!window.confirm("Are you sure you want to delete this comment? This action cannot be undone.")) {
      return;
    }

    try {
      console.log("Sending delete request with userId:", currentUser.id);
      const response = await axios.delete(`${API_URL}/${commentId}`, {
        data: { userId: currentUser.id }
      });
      
      console.log("Delete response:", response);
      
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

  // Handle liking a comment
  const handleLikeComment = async (commentId) => {
    if (!currentUser.id) {
      alert("Please log in to like comments");
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/${commentId}/like`, {
        userId: currentUser.id
      });
      
      if (response.status === 200) {
        // Refresh comments after liking
        const updatedResponse = await axios.get(`${API_URL}?postId=${postId}`);
        if (updatedResponse.data && updatedResponse.data.comments) {
          const commentsArray = transformCommentsToArray(updatedResponse.data.comments);
          setComments(commentsArray);
        }
      }
    } catch (error) {
      console.error('Error liking comment:', error);
      alert("Error liking comment. Please try again.");
    }
  };

  // Handle disliking a comment
  const handleDislikeComment = async (commentId) => {
    if (!currentUser.id) {
      alert("Please log in to dislike comments");
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/${commentId}/dislike`, {
        userId: currentUser.id
      });
      
      if (response.status === 200) {
        // Refresh comments after disliking
        const updatedResponse = await axios.get(`${API_URL}?postId=${postId}`);
        if (updatedResponse.data && updatedResponse.data.comments) {
          const commentsArray = transformCommentsToArray(updatedResponse.data.comments);
          setComments(commentsArray);
        }
      }
    } catch (error) {
      console.error('Error disliking comment:', error);
      alert("Error disliking comment. Please try again.");
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
  const handleSubmitReply = async (commentId, replyText, files) => {
    if ((replyText.trim() || files.length > 0) && currentUser.id) {
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
        
        const formData = new FormData();
        formData.append('id', currentUser.id);
        formData.append('name', currentUser.name);
        formData.append('commentText', replyText);
        formData.append('parentId', commentId);
        formData.append('depth', parentComment.depth + 1);
        formData.append('postId', postId);

        // Append media files if any
        files.forEach(file => {
          formData.append('media', file);
        });
        
        const response = await axios.post(API_URL, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
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

  // Check if user has liked or disliked a comment
  const hasUserLiked = (likes) => {
    return likes && currentUser.id && likes.includes(currentUser.id);
  };

  const hasUserDisliked = (dislikes) => {
    return dislikes && currentUser.id && dislikes.includes(currentUser.id);
  };

  // Recursive component to render comments and their replies
  const CommentComponent = ({ comment, level = 0 }) => {
    const [isReplying, setIsReplying] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const userLiked = hasUserLiked(comment.likes);
    const userDisliked = hasUserDisliked(comment.dislikes);

    // Check if current user is author of this comment, comparing as strings to ensure proper matching
    const isAuthor = currentUser && currentUser.id && 
                     comment.author && comment.author.id && 
                     String(currentUser.id) === String(comment.author.id);

    console.log("Comment author ID:", comment.author.id, "type:", typeof comment.author.id);
    console.log("Current user ID:", currentUser.id, "type:", typeof currentUser.id);
    console.log("Is author?", isAuthor);

    return (
      <div className="flex flex-col">
        <div className={`flex flex-col ${level > 0 ? 'ml-4' : ''}`}>
          <div className="flex items-start gap-2">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                <span className="text-gray-600 text-sm">
                  {comment.author.name.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            <div className="flex-grow">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{comment.author.name}</span>
                <span className="text-xs text-gray-500">
                  {formatDate(comment.postedDate)}
                </span>
                {isAuthor && (
                  <button
                    onClick={() => handleDeleteComment(comment._id)}
                    className="ml-auto bg-red-500 hover:bg-red-700 text-white px-2 py-1 rounded-md text-xs"
                    title="Delete comment"
                  >
                    Delete
                  </button>
                )}
              </div>
              <div className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">
                {comment.commentText}
              </div>
              
              {/* Display media attachments */}
              {comment.mediaAttachments && comment.mediaAttachments.length > 0 && (
                <div className="mt-2 space-y-2">
                  {comment.mediaAttachments.map((attachment, index) => (
                    <div key={index} className="relative">
                      {attachment.fileType.startsWith('image/') ? (
                        <img
                          src={attachment.fileUrl}
                          alt={attachment.fileName}
                          className="max-w-full h-auto rounded-lg"
                          onError={(e) => {
                            console.error('Error loading image:', attachment.fileUrl);
                            e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Found';
                          }}
                        />
                      ) : attachment.fileType.startsWith('video/') ? (
                        <video
                          controls
                          className="max-w-full rounded-lg"
                          src={attachment.fileUrl}
                          onError={(e) => {
                            console.error('Error loading video:', attachment.fileUrl);
                          }}
                        >
                          Your browser does not support the video tag.
                        </video>
                      ) : attachment.fileType.startsWith('audio/') ? (
                        <div className="flex flex-col items-center justify-center bg-gray-100 p-4 rounded-lg">
                          <div className="text-center mb-2">Audio File</div>
                          <audio
                            controls
                            className="w-full"
                            src={attachment.fileUrl}
                            onError={(e) => {
                              console.error('Error loading audio:', attachment.fileUrl);
                            }}
                          />
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-4 mt-2">
                <button
                  className={`flex items-center gap-1 text-sm ${userLiked ? 'text-blue-600' : 'text-gray-500'}`}
                  onClick={() => handleLikeComment(comment._id)}
                  title={userLiked ? "Remove like" : "Like this comment"}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill={userLiked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                  </svg>
                  <span>{comment.likes ? comment.likes.length : 0}</span>
                </button>
                <button
                  className={`flex items-center gap-1 text-sm ${userDisliked ? 'text-red-600' : 'text-gray-500'}`}
                  onClick={() => handleDislikeComment(comment._id)}
                  title={userDisliked ? "Remove dislike" : "Dislike this comment"}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill={userDisliked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                  </svg>
                  <span>{comment.dislikes ? comment.dislikes.length : 0}</span>
                </button>
                <button
                  onClick={() => setIsReplying(!isReplying)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {isReplying ? 'Cancel' : 'Reply'}
                </button>
              </div>
              <span className="text-xs text-gray-400">Depth: {comment.depth}</span>
            </div>
          </div>
          
          {/* Reply form */}
          {isReplying && (
            <ReplyForm
              commentId={comment._id}
              onSubmit={handleSubmitReply}
              onCancel={() => setIsReplying(false)}
            />
          )}
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
        <div className="mt-2">
          <input
            type="file"
            multiple
            accept="image/*,video/*,audio/*"
            onChange={handleFileSelect}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {selectedFiles.length > 0 && (
            <div className="mt-2">
              <p className="text-sm text-gray-600">Selected files:</p>
              <ul className="mt-1 space-y-1">
                {selectedFiles.map((file, index) => (
                  <li key={index} className="text-sm text-gray-500">
                    {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="w-full flex justify-end px-3 my-3">
        <button
          className="px-2.5 py-1.5 rounded-md text-white text-sm bg-indigo-500"
          onClick={handlePostComment}
          disabled={!currentUser.id && !loginData}
        >
          {currentUser.id || (loginData && (loginData.validuserone || loginData.validateUser)) 
            ? "Post Comment" 
            : "Login to Comment"}
        </button>
      </div>
    </div>
  );
};

export default Discussion;

import React, { useContext, useEffect, useState } from "react";
import { LoginContext } from "../ContextProvider/context";
import axios from "axios";

// SVG components for like and dislike icons
const HeartIcon = ({ filled = false }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="18" viewBox="0 0 24 24" className="inline-block">
    <path
      fill={filled ? "#ff4d4d" : "none"}
      stroke={filled ? "#ff4d4d" : "currentColor"}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M20.84 2.61a5.5 5.5 0 0 0-7.78 0L12 3.67l-1.06-1.06a5.501 5.501 0 0 0-7.78 7.78l1.06 1.06L12 19.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
    />
  </svg>
);

const ThumbsDownIcon = ({ filled = false }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" className="inline-block">
    <path 
      d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" 
      fill={filled ? "#3b82f6" : "none"}
      stroke={filled ? "#3b82f6" : "currentColor"}
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

const RenderUserPosts = () => {
  
  const { loginData } = useContext(LoginContext);  
  const [userPosts, setUserPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(false); 
  const [currentUser, setCurrentUser] = useState({
    id: '',
    name: ''
  });
  
  useEffect(() => {
    console.log("i ma here in useEffect");
    console.log("this is my login data",loginData);
    
    if (loginData && loginData.validuserone) {
      setCurrentUser({
        id: loginData.validuserone._id,
        name: loginData.validuserone.userName
      });
    }
    
    fetchUserPosts();
  },[loginData]);

  const handleDeletePost = async (postId, imgKey) => {
    if (!window.confirm("Are you sure you want to delete this post?")) {
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:8099/delete/${postId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imgKey }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        alert("Post deleted successfully");
        // Update the posts list
        fetchUserPosts();
      } else {
        alert("Failed to delete post: " + (result.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Error occurred while deleting post");
    }
  };

  const handleLikePost = async (postId) => {
    if (!currentUser.id) {
      alert("Please log in to like posts");
      return;
    }

    try {
      const response = await axios.post(`http://localhost:8099/${postId}/like`, {
        userId: currentUser.id
      });
      
      if (response.status === 200) {
        // Refresh posts to get updated like/dislike counts
        fetchUserPosts();
      }
    } catch (error) {
      console.error('Error liking post:', error);
      alert("Error liking post. Please try again.");
    }
  };

  const handleDislikePost = async (postId) => {
    if (!currentUser.id) {
      alert("Please log in to dislike posts");
      return;
    }

    try {
      const response = await axios.post(`http://localhost:8099/${postId}/dislike`, {
        userId: currentUser.id
      });
      
      if (response.status === 200) {
        // Refresh posts to get updated like/dislike counts
        fetchUserPosts();
      }
    } catch (error) {
      console.error('Error disliking post:', error);
      alert("Error disliking post. Please try again.");
    }
  };

  const fetchUserPosts = async () => {
    if (!loginData || !loginData.validuserone) {
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8099/get', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: loginData.validuserone._id }),
      });
      
      const data = await response.json();
      console.log("User posts:", data);
      
      if (data.status === 200) {
        setUserPosts(data.userposts);
      }
    } catch (error) {
      console.error("Error fetching user posts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if user has liked or disliked a post
  const hasUserLiked = (likes) => {
    return likes && currentUser.id && likes.includes(currentUser.id);
  };

  const hasUserDisliked = (dislikes) => {
    return dislikes && currentUser.id && dislikes.includes(currentUser.id);
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading your posts...</div>;
  }

  if (userPosts.length === 0) {
    return (
      <div className="text-center py-4">You haven't created any posts yet.</div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
      {userPosts.map((post) => {
        const userLiked = hasUserLiked(post.likes);
        const userDisliked = hasUserDisliked(post.dislikes);
        
        return (
          <div
            key={post._id}
            className="border rounded-lg shadow-md overflow-hidden bg-white"
          >
            <div className="p-2 bg-gray-100 flex justify-between items-center">
              <span className="font-medium">
                {new Date(post.createdAt || Date.now()).toLocaleDateString()}
              </span>
              <button
                onClick={() => handleDeletePost(post._id, post.imgKey)}
                className="text-red-600 hover:text-red-800"
              >
                Delete
              </button>
            </div>

            <div className="h-48 bg-gray-200 flex items-center justify-center overflow-hidden">
              {post.fileType === "image" && (
                <img
                  src={post.signedUrl}
                  alt="Post"
                  className="h-full w-full object-contain"
                  onError={(e) => {
                    e.target.src =
                      "https://via.placeholder.com/400x280?text=Image+Not+Available";
                  }}
                />
              )}
              {post.fileType === "video" && (
                <div className="relative w-full h-full bg-gradient-to-br from-blue-900 to-purple-900">
                  <video
                    src={post.signedUrl}
                    className="h-full w-full object-contain"
                    controls
                    preload="metadata"
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-black bg-opacity-40 rounded-full p-4 shadow-lg">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="40"
                        height="40"
                        viewBox="0 0 24 24"
                        fill="white"
                        stroke="white"
                        strokeWidth="1"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                      </svg>
                    </div>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                    Video
                  </div>
                </div>
              )}
              {post.fileType === "audio" && (
                <div className="flex flex-col items-center justify-center w-full h-full bg-gradient-to-br from-indigo-800 to-purple-700 p-4">
                  <div className="bg-white bg-opacity-20 p-5 rounded-full mb-3 shadow-lg">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="40"
                      height="40"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9 18V5l12-2v13"></path>
                      <circle cx="6" cy="18" r="3"></circle>
                      <circle cx="18" cy="16" r="3"></circle>
                    </svg>
                  </div>
                  <div className="w-full bg-white bg-opacity-10 p-2 rounded-lg">
                    <audio src={post.signedUrl} controls className="w-full" />
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                    Audio
                  </div>
                </div>
              )}
            </div>

            <div className="p-3">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-4">
                  {/* Like button */}
                  <button 
                    className="flex items-center gap-1"
                    onClick={() => handleLikePost(post._id)}
                    title={userLiked ? "Remove like" : "Like this post"}
                  >
                    <HeartIcon filled={userLiked} />
                    <span className="text-sm">{post.likes ? post.likes.length : 0}</span>
                  </button>
                  
                  {/* Dislike button */}
                  <button 
                    className="flex items-center gap-1"
                    onClick={() => handleDislikePost(post._id)}
                    title={userDisliked ? "Remove dislike" : "Dislike this post"}
                  >
                    <ThumbsDownIcon filled={userDisliked} />
                    <span className="text-sm">{post.dislikes ? post.dislikes.length : 0}</span>
                  </button>
                </div>
                <p className="text-xs text-gray-500">Type: {post.fileType}</p>
              </div>
              <p className="text-gray-700 line-clamp-2">{post.desc}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RenderUserPosts;

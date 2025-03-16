import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import React, { useEffect, useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { LoginContext } from "../ContextProvider/context";

const heartSvg = (filled = false) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="21" id="heart">
      <path
        fill={filled ? "#ff4d4d" : "none"}
        fillRule="evenodd"
        stroke={filled ? "#ff4d4d" : "#000"}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M20.84 2.61a5.5 5.5 0 0 0-7.78 0L12 3.67l-1.06-1.06a5.501 5.501 0 0 0-7.78 7.78l1.06 1.06L12 19.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
      ></path>
    </svg>
  );
};

const thumbsDownSvg = (filled = false) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={filled ? "#3b82f6" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" fill={filled ? "#3b82f6" : "none"}></path>
    </svg>
  );
};

const UserContent = ({ post }) => {
  const history = useNavigate();
  const { loginData } = useContext(LoginContext);
  const [currentUser, setCurrentUser] = useState({
    id: '',
    name: ''
  });
  const [postData, setPostData] = useState(post);
  const [userLiked, setUserLiked] = useState(false);
  const [userDisliked, setUserDisliked] = useState(false);

  useEffect(() => {
    console.log("UserContent received post:", post);
    if (post) {
      console.log("Post file URL:", post.signedUrl);
      console.log("Post file type:", post.fileType);
      console.log("Post user image:", post.image);
      setPostData(post);
      
      // Check if current user has liked or disliked this post
      if (loginData && loginData.validuserone && post.likes && post.dislikes) {
        const userId = loginData.validuserone._id;
        setUserLiked(post.likes.includes(userId));
        setUserDisliked(post.dislikes.includes(userId));
      }
    }
  }, [post]);

  // Set current user from login data
  useEffect(() => {
    if (loginData && loginData.validuserone) {
      setCurrentUser({
        id: loginData.validuserone._id,
        name: loginData.validuserone.userName
      });
      
      // Check if current user has liked or disliked this post
      if (postData && postData.likes && postData.dislikes) {
        const userId = loginData.validuserone._id;
        setUserLiked(postData.likes.includes(userId));
        setUserDisliked(postData.dislikes.includes(userId));
      }
    }
  }, [loginData, postData]);

  const handleDelete = async (postId, imgKey) => {
    // Ask for confirmation before deleting
    if (!window.confirm("Are you sure you want to delete this post?")) {
      return;
    }
    
    try {
      console.log("Deleting post:", postId, "with image key:", imgKey);
      
      const response = await fetch(`http://localhost:8099/delete/${postId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imgKey }), // Send imgKey in the request body
      });

      const result = await response.json();
      console.log("Delete response:", result);
      
      if (response.ok) {
        console.log("Post deleted successfully:", result);
        alert("Post deleted successfully");
        // Refresh the page or redirect
        window.location.reload();
      } else {
        console.error("Failed to delete post:", result.error);
        alert("Failed to delete post: " + (result.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error occurred while deleting post:", error);
      alert("Error occurred while deleting post. Please try again.");
    }
  };

  const handleLikePost = async () => {
    if (!currentUser.id) {
      alert("Please log in to like posts");
      return;
    }

    try {
      const response = await axios.post(`http://localhost:8099/${postData._id}/like`, {
        userId: currentUser.id
      });
      
      if (response.status === 200) {
        // Update local state to reflect the change
        const updatedPost = { ...postData };
        
        if (userLiked) {
          // Remove like
          updatedPost.likes = updatedPost.likes.filter(id => id !== currentUser.id);
        } else {
          // Add like and remove dislike if exists
          if (!updatedPost.likes) updatedPost.likes = [];
          if (!updatedPost.likes.includes(currentUser.id)) {
            updatedPost.likes.push(currentUser.id);
          }
          
          // Remove from dislikes if present
          if (updatedPost.dislikes && updatedPost.dislikes.includes(currentUser.id)) {
            updatedPost.dislikes = updatedPost.dislikes.filter(id => id !== currentUser.id);
          }
        }
        
        setPostData(updatedPost);
        setUserLiked(!userLiked);
        if (userDisliked) setUserDisliked(false);
      }
    } catch (error) {
      console.error('Error liking post:', error);
      alert("Error liking post. Please try again.");
    }
  };

  const handleDislikePost = async () => {
    if (!currentUser.id) {
      alert("Please log in to dislike posts");
      return;
    }

    try {
      const response = await axios.post(`http://localhost:8099/${postData._id}/dislike`, {
        userId: currentUser.id
      });
      
      if (response.status === 200) {
        // Update local state to reflect the change
        const updatedPost = { ...postData };
        
        if (userDisliked) {
          // Remove dislike
          updatedPost.dislikes = updatedPost.dislikes.filter(id => id !== currentUser.id);
        } else {
          // Add dislike and remove like if exists
          if (!updatedPost.dislikes) updatedPost.dislikes = [];
          if (!updatedPost.dislikes.includes(currentUser.id)) {
            updatedPost.dislikes.push(currentUser.id);
          }
          
          // Remove from likes if present
          if (updatedPost.likes && updatedPost.likes.includes(currentUser.id)) {
            updatedPost.likes = updatedPost.likes.filter(id => id !== currentUser.id);
          }
        }
        
        setPostData(updatedPost);
        setUserDisliked(!userDisliked);
        if (userLiked) setUserLiked(false);
      }
    } catch (error) {
      console.error('Error disliking post:', error);
      alert("Error disliking post. Please try again.");
    }
  };

  const openInNewTab = (url) => {
    window.open(url, "_blank", "noreferrer");
  };

  const handleMediaClick = () => {
    if (!postData?.signedUrl) return;
    
    if (postData.fileType === 'image') {
      openInNewTab(postData.signedUrl);
    }
    // For video and audio, we'll let the built-in controls handle playback
  };

  if (!postData) {
    return (
      <div className="w-full border rounded-lg bg-white shadow-lg p-4 flex items-center justify-center" style={{ height: "400px" }}>
        <div className="text-gray-500">Loading post content...</div>
      </div>
    );
  }

  // Render different media types
  const renderMedia = () => {
    if (!postData.signedUrl) {
      return (
        <div className="flex items-center justify-center h-full w-full text-gray-500">
          Media not available
        </div>
      );
    }

    const fileType = postData.fileType || 'image'; // Default to image if not specified

    if (fileType === 'image') {
      return (
        <img
          src={postData.signedUrl}
          className="w-full h-full object-cover"
          alt="Post content"
          onError={(e) => {
            console.error("Error loading image:", e);
            e.target.src = "https://via.placeholder.com/400x280?text=Image+Not+Available";
          }}
        />
      );
    } else if (fileType === 'video') {
      return (
        <div className="relative w-full h-full bg-gradient-to-br from-blue-900 to-purple-900">
          <video 
            src={postData.signedUrl} 
            className="w-full h-full object-contain"
            controls
            preload="metadata"
            onError={(e) => {
              console.error("Error loading video:", e);
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-black bg-opacity-50 rounded-full p-5 shadow-lg transform transition-transform hover:scale-110">
              <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
            </div>
          </div>
          <div className="absolute bottom-3 right-3 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm font-medium">
            Video
          </div>
        </div>
      );
    } else if (fileType === 'audio') {
      return (
        <div className="flex flex-col items-center justify-center h-full w-full bg-gradient-to-br from-indigo-800 to-purple-700 p-6">
          <div className="bg-white bg-opacity-20 p-6 rounded-full mb-4 shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="70" height="70" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18V5l12-2v13"></path>
              <circle cx="6" cy="18" r="3"></circle>
              <circle cx="18" cy="16" r="3"></circle>
            </svg>
          </div>
          <div className="w-3/4 bg-white bg-opacity-10 p-3 rounded-lg shadow-md">
            <audio 
              src={postData.signedUrl} 
              controls 
              className="w-full"
              onError={(e) => {
                console.error("Error loading audio:", e);
              }}
            />
          </div>
          <div className="absolute bottom-3 right-3 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm font-medium">
            Audio
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center h-full w-full text-gray-500">
        Unsupported media type
      </div>
    );
  };

  return (
    <div className="w-full border rounded-lg bg-white shadow-lg flex flex-col gap-0">
      {/* user header */}
      <div className=" flex justify-between items-center w-full h-full">
        <div className="flex jsutify-between">
          <div className="w-12 h-12  m-2 ">
            <img
              src={postData?.image}
              className="w-full h-full rounded-full"
              referrerPolicy="no-referrer"
              onError={(e) => {
                console.error("Error loading user image:", e);
                e.target.src = "https://via.placeholder.com/40";
              }}
            ></img>
          </div>
          {/* user name remiand */}
          <div className="font-bold text-red-700 m-2 flex items-center">
            {postData?.userName || "Unknown User"}
          </div>
        </div>

        {/* this is for openpanel */}
        <div className="p-3">
          <Menu as="div" className="relative z-10">
            <MenuButton className="flex gap-1 text-gray-700 font-extrabold items-center focus:outline-none">
              <p>.</p>
              <p>.</p>
              <p>.</p>
            </MenuButton>
            <MenuItems className="absolute right-0 mt-2 w-24 bg-white shadow-md rounded-md  ring-1 ring-black ring-opacity-5 focus:outline-none">
              <MenuItem>
                {({ active }) => (
                  <button
                    className={`block border rounded-md px-4 py-2 w-full text-sm font-extrabold text-red-700 ${
                      active ? "bg-red-100 border-red-300" : " text-gray-700"
                    }`}
                    onClick={()=>handleDelete(postData._id, postData.imgKey)}
                  >
                    Delete
                  </button>
                )}
              </MenuItem>
              <MenuItem>
                {({ active }) => (
                  <button
                    className={`block border rounded-md px-4 py-2 w-full text-sm font-extrabold text-red-700 ${
                      active ? "bg-red-100 border-red-300" : " text-gray-700"
                    }`}
                  >
                    check
                  </button>
                )}
              </MenuItem>
            </MenuItems>
          </Menu>
        </div>
      </div>
      {/* user media content */}
      <div
        className={`h-81 w-full bg-gray-200 flex items-center justify-center overflow-hidden ${postData.fileType === 'image' ? 'cursor-pointer' : ''}`}
        style={{ height: "280px" }}
        onClick={handleMediaClick}
      >
        {renderMedia()}
      </div>

      {/* user description and interaction */}
      <div className="">
        <div className="flex items-center gap-4 m-2">
          {/* Like button */}
          <button 
            className="flex items-center gap-1"
            onClick={handleLikePost}
            title={userLiked ? "Remove like" : "Like this post"}
          >
            {heartSvg(userLiked)}
            <span className="text-sm font-medium">{postData.likes ? postData.likes.length : 0}</span>
          </button>
          
          {/* Dislike button */}
          <button 
            className="flex items-center gap-1"
            onClick={handleDislikePost}
            title={userDisliked ? "Remove dislike" : "Dislike this post"}
          >
            {thumbsDownSvg(userDisliked)}
            <span className="text-sm font-medium">{postData.dislikes ? postData.dislikes.length : 0}</span>
          </button>
        </div>
        <div className="p-2 h-16">{postData?.desc || "No description available"}</div>
      </div>
    </div>
  );
};

export default UserContent;

import React, { useContext, useEffect, useState } from "react";
import { LoginContext } from "../ContextProvider/context";

const RenderUserPosts = () => {
  
  const { loginData } = useContext(LoginContext);  
  const [userPosts, setUserPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(false); 
  
  useEffect(()=>{
    console.log("i ma here in useEffect");
    console.log("this is my login data",loginData);
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
      {userPosts.map((post) => (
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
            <p className="text-gray-700 line-clamp-2">{post.desc}</p>
            <p className="text-xs text-gray-500 mt-1">Type: {post.fileType}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RenderUserPosts;

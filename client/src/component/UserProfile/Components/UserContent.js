import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LoginContext } from "../../ContextProvider/context";

const UserContent = ({ userData }) => {
  const { loginData } = useContext(LoginContext);
  const [activeTab, setActiveTab] = useState("all");
  const [filteredContent, setFilteredContent] = useState([]);
  const [userPosts, setUserPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Check if this is the user's own profile
  const isOwnProfile = !userData || userData._id === loginData?.validuserone?._id;

  useEffect(() => {
    const userId = userData?._id || loginData?.validuserone?._id;
    if (userId) {
      fetchUserPosts(userId);
    }
  }, [userData, loginData]);

  const fetchUserPosts = async (userId) => {
    if (!userId) {
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8099/get', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: userId }),
      });
      
      const data = await response.json();
      
      if (data.status === 200) {
        setUserPosts(data.userposts);
        setFilteredContent(data.userposts);
      }
    } catch (error) {
      console.error("Error fetching user posts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePost = async (postId, imgKey) => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:8099/delete/${postId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imgKey }),
      });
      
      const data = await response.json();
      
      if (data.status === 200) {
        // Remove the deleted post from state
        setUserPosts(prevPosts => prevPosts.filter(post => post._id !== postId));
        setFilteredContent(prevFiltered => prevFiltered.filter(post => post?._id !== postId));
        alert('Post deleted successfully');
      } else {
        alert('Failed to delete post');
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      alert('Error deleting post');
    }
  };

  // Render media based on file type
  const renderMedia = (post) => {
    if (!post?.signedUrl) return null;
    
    switch (post.fileType) {
      case 'image':
        return (
          <img 
            src={post?.signedUrl} 
            alt="Post" 
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
            }}
          />
        );
      case 'video':
        return (
          <video 
            src={post?.signedUrl} 
            className="w-full h-full object-contain"
            controls
            onError={(e) => {
              e.target.onerror = null;
              e.target.parentNode.innerHTML = '<div class="flex items-center justify-center h-full bg-gray-200"><p class="text-gray-500">Video Failed to Load</p></div>';
            }}
          />
        );
      case 'audio':
        return (
          <div className="flex flex-col items-center justify-center h-full bg-gray-100 p-4">
            <div className="text-center mb-2">Audio File</div>
            <audio 
              src={post?.signedUrl} 
              controls
              className="w-full"
              onError={(e) => {
                e.target.onerror = null;
                e.target.parentNode.innerHTML = '<div class="text-gray-500">Audio Failed to Load</div>';
              }}
            />
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center h-full bg-gray-200">
            <p className="text-gray-500">Unsupported Media</p>
          </div>
        );
    }
  };

  const filterContent = (tab) => {
    setActiveTab(tab);
    setFilteredContent(
      tab === "all"
        ? userPosts
        : userPosts.filter((item) => item.fileType === tab)
    );
  };

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
      <div className="flex border-b">
        <button
          className={`px-6 py-3 font-medium ${
            activeTab === "all" ? "text-blue-500 border-b-2 border-blue-500" : "text-gray-500"
          }`}
          onClick={() => filterContent("all")}
        >
          All
        </button>
        <button
          className={`px-6 py-3 font-medium ${
            activeTab === "image" ? "text-blue-500 border-b-2 border-blue-500" : "text-gray-500"
          }`}
          onClick={() => filterContent("image")}
        >
          Images
        </button>
        <button
          className={`px-6 py-3 font-medium ${
            activeTab === "video" ? "text-blue-500 border-b-2 border-blue-500" : "text-gray-500"
          }`}
          onClick={() => filterContent("video")}
        >
          Videos
        </button>
        <button
          className={`px-6 py-3 font-medium ${
            activeTab === "audio" ? "text-blue-500 border-b-2 border-blue-500" : "text-gray-500"
          }`}
          onClick={() => filterContent("audio")}
        >
          Audio
        </button>
      </div>

      {/* Content Grid */}
      <div className="p-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredContent.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContent.map((post) => (
              <div key={post?._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <Link to={`/userPost/${post?._id}`} className="block h-48 relative">
                  {renderMedia(post)}
                  {isOwnProfile && (
                    <div className="absolute top-2 right-2">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDeletePost(post?._id, post.imgKey);
                        }}
                        className="bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors duration-300"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                </Link>
                <div className="p-4">
                  <p className="text-gray-700 text-sm truncate">{post?.desc || "No description"}</p>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-gray-500 capitalize">{post?.fileType}</span>
                    <span className="text-xs text-gray-400">{new Date(post?.createdAt || Date.now()).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-gray-500 mb-4">No content posted yet</p>
            {isOwnProfile && (
              <Link
                to="/test2"
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors duration-300"
              >
                Create your first post
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserContent;
import React, { useContext, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LoginContext } from "../ContextProvider/context";
import { ValidUserForPage } from "../GlobalFunction/GlobalFunctionForResue";

const Uploader = () => {
  const {loginData,setLoginData} = useContext(LoginContext);
  const [userPosts, setUserPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showLogin,setShowLogin]= useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [filteredContent, setFilteredContent] = useState([]);
  const [profileFile, setProfileFile] = useState(null);
  const [backgroundFile, setBackgroundFile] = useState(null);
  const [profilePreview, setProfilePreview] = useState('');
  const [backgroundPreview, setBackgroundPreview] = useState('');
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingBackground, setUploadingBackground] = useState(false);
  const navigate = useNavigate();
  const validatePage = ValidUserForPage();

  // Fetch user posts when component mounts
  console.log(loginData);
  useEffect(() => {
    console.log("i m coming after refresh");
    validateUser();
    
    // Get the userId from loginData if available
    const userId = loginData?.validuserone?._id || loginData?.validateUser?._id;
    if (userId) {
      fetchUserPosts(userId);
    }
  }, [loginData]); // Add loginData as a dependency

  const validateUser = () => {
    if (!loginData) {
      const userData = validatePage();
      if (userData) {
        setLoginData({ validuserone: userData });
        console.log("i am already login");
      } else {
        console.log("i am come here after checking");
        // Redirect to login or show login modal
        setShowLogin(true);
      }
    }
  };
  
  
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
      console.log("User posts:", data);
      
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

  // Handle filtering content
  const filterContent = (tab) => {
    setActiveTab(tab);
    setFilteredContent(
      tab === "all"
        ? userPosts
        : userPosts.filter((item) => item.fileType === tab)
    );
  };

  // Handle delete post
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
        setFilteredContent(prevFiltered => prevFiltered.filter(post => post._id !== postId));
        alert('Post deleted successfully');
      } else {
        alert('Failed to delete post');
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      alert('Error deleting post');
    }
  };

  // Handle profile picture change
  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file type
    const fileType = file.type.split('/')[0];
    if (fileType !== 'image') {
      alert('Please select an image file');
      return;
    }
    
    setProfileFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };
  
  // Handle background image change
  const handleBackgroundImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file type
    const fileType = file.type.split('/')[0];
    if (fileType !== 'image') {
      alert('Please select an image file');
      return;
    }
    
    setBackgroundFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setBackgroundPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };
  
  // Upload profile picture
  const uploadProfilePicture = async () => {
    if (!profileFile) return;
    
    setUploadingProfile(true);
    try {
      const formData = new FormData();
      formData.append('file', profileFile);
      
      const response = await fetch('http://localhost:8099/upload-profile-picture', {
        method: 'POST',
        headers: {
          'Authorization': localStorage.getItem('userdatatoken'),
        },
        body: formData,
      });
      
      const data = await response.json();
      
      if (data.status === 200) {
        alert('Profile picture updated successfully');
        // Refresh user data
        window.location.reload();
      } else {
        alert('Failed to update profile picture');
      }
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      alert('Error uploading profile picture');
    } finally {
      setUploadingProfile(false);
    }
  };
  
  // Upload background image
  const uploadBackgroundImage = async () => {
    if (!backgroundFile) return;
    
    setUploadingBackground(true);
    try {
      const formData = new FormData();
      formData.append('file', backgroundFile);
      
      const response = await fetch('http://localhost:8099/upload-background-image', {
        method: 'POST',
        headers: {
          'Authorization': localStorage.getItem('userdatatoken'),
        },
        body: formData,
      });
      
      const data = await response.json();
      
      if (data.status === 200) {
        alert('Background image updated successfully');
        // Refresh user data
        // window.location.reload();
      } else {
        alert('Failed to update background image');
      }
    } catch (error) {
      console.error("Error uploading background image:", error);
      alert('Error uploading background image');
    } finally {
      setUploadingBackground(false);
    }
  };

  // Render media based on file type
  const renderMedia = (post) => {
    if (!post.signedUrl) return null;
    
    switch (post.fileType) {
      case 'image':
        return (
          <img 
            src={post.signedUrl} 
            alt="Post" 
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "https://via.placeholder.com/300?text=Image+Failed+to+Load";
            }}
          />
        );
      case 'video':
        return (
          <video 
            src={post.signedUrl} 
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
              src={post.signedUrl} 
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

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Banner */}
      <div className="relative">
        <div className="relative h-64 overflow-hidden group">
          <img
            src={loginData?.validuserone?.backgroundImageUrl}
            alt="User Banner"
            className="w-full h-64 object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center transition-all duration-300">
            <label className="hidden group-hover:block cursor-pointer bg-white text-gray-800 px-4 py-2 rounded-lg shadow-md">
              <span>Change Cover</span>
              <input 
                type="file" 
                className="hidden" 
                accept="image/*"
                onChange={handleBackgroundImageChange}
              />
            </label>
          </div>
        </div>
        {backgroundFile && (
          <div className="absolute bottom-0 left-0 right-0 bg-gray-800 bg-opacity-70 p-2 flex justify-between items-center">
            <span className="text-sm text-white">New cover selected</span>
            <button 
              className="bg-blue-500 text-white px-3 py-1 rounded-md text-sm"
              onClick={uploadBackgroundImage}
              disabled={uploadingBackground}
            >
              {uploadingBackground ? 'Uploading...' : 'Save Cover'}
            </button>
          </div>
        )}
        <div className="absolute bottom-4 left-6 flex items-center">
          <div className="relative group">
            <img
              src={ loginData?.validateUser?.profilePictureUrl || loginData?.validuserone?.image }
              alt="User Avatar"
              className="w-24 h-24 rounded-full border-4 border-white object-cover"
            />
            <div className="absolute inset-0 rounded-full bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center transition-all duration-300">
              <label className="hidden group-hover:block cursor-pointer bg-white text-gray-800 px-2 py-1 rounded-lg shadow-md text-xs">
                <span>Change</span>
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                />
              </label>
            </div>
          </div>
          <div className="ml-4">
            <h1 className="text-3xl font-bold text-white">{loginData?.validuserone?.userName}</h1>
            <p className="text-gray-200">{loginData?.validuserone?.email}</p>
            {profileFile && (
              <button 
                className="bg-blue-500 text-white px-3 py-1 rounded-md text-sm mt-2"
                onClick={uploadProfilePicture}
                disabled={uploadingProfile}
              >
                {uploadingProfile ? 'Uploading...' : 'Save Profile Picture'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Upload Button */}
      <div className="container mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">My Content</h2>
          <Link
            to="/test2"
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-300"
          >
            Create New Post
          </Link>
        </div>

        {/* Filter Tabs */}
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
                  <div key={post._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                    <Link to={`/userPost/${post._id}`} className="block h-48 relative">
                      {renderMedia(post)}
                      <div className="absolute top-2 right-2">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeletePost(post._id, post.imgKey);
                          }}
                          className="bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors duration-300"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </Link>
                    <div className="p-4">
                      <p className="text-gray-700 text-sm truncate">{post.desc || "No description"}</p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-gray-500 capitalize">{post.fileType}</span>
                        <span className="text-xs text-gray-400">{new Date(post.createdAt || Date.now()).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-500 mb-4">You haven't posted anything yet</p>
                <Link
                  to="/test2"
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors duration-300"
                >
                  Create your first post
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Uploader;

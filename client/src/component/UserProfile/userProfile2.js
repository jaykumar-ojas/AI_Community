import React, { useContext, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LoginContext } from "../ContextProvider/context";
import { ValidUserForPage } from "../GlobalFunction/GlobalFunctionForResue";
import ProfileHeader from "./components/ProfileHeader";
import ProfileFilters from "./components/ProfileFilters";
import ProfileContent from "./components/ProfileContent";
import Login from "../Auth/Login";

const Uploader = () => {
  const {loginData, setLoginData} = useContext(LoginContext);
  const [userPosts, setUserPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [filteredContent, setFilteredContent] = useState([]);
  const [profileFile, setProfileFile] = useState(null);
  const [backgroundFile, setBackgroundFile] = useState(null);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingBackground, setUploadingBackground] = useState(false);
  const navigate = useNavigate();
  const validatePage = ValidUserForPage();

 

  useEffect(() => {
    console.log("i m coming after refresh");
    validateUser();
    
    const userId = loginData?.validuserone?._id || loginData?.validateUser?._id;
    if (userId) {
      fetchUserPosts(userId);
    }
  }, [loginData]);

  const validateUser = () => {
    if (!loginData) {
      validatePage();
    }
  };
  
  const fetchUserPosts = async (userId) => {
    if (!userId) return;
    
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

  const filterContent = (tab) => {
    setActiveTab(tab);
    setFilteredContent(
      tab === "all"
        ? userPosts
        : userPosts.filter((item) => item.fileType === tab)
    );
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

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const fileType = file.type.split('/')[0];
    if (fileType !== 'image') {
      alert('Please select an image file');
      return;
    }
    
    setProfileFile(file);
  };
  
  const handleBackgroundImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const fileType = file.type.split('/')[0];
    if (fileType !== 'image') {
      alert('Please select an image file');
      return;
    }
    
    setBackgroundFile(file);
  };
  
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
  console.log("this si ==is long data",loginData);
  if(loginData==null || loginData === undefined){
    return(<Login></Login>)
  }

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
      <ProfileHeader 
        loginData={loginData}
        profileFile={profileFile}
        backgroundFile={backgroundFile}
        handleProfilePictureChange={handleProfilePictureChange}
        handleBackgroundImageChange={handleBackgroundImageChange}
        uploadProfilePicture={uploadProfilePicture}
        uploadBackgroundImage={uploadBackgroundImage}
        uploadingProfile={uploadingProfile}
        uploadingBackground={uploadingBackground}
      />

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

        <ProfileFilters 
          activeTab={activeTab}
          filterContent={filterContent}
        />

        <ProfileContent 
          isLoading={isLoading}
          filteredContent={filteredContent}
          handleDeletePost={handleDeletePost}
          renderMedia={renderMedia}
        />
      </div>
    </div>
  );
};

export default Uploader;

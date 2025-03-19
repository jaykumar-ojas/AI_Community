import React, { useContext, useState } from "react";
import { LoginContext } from "../../ContextProvider/context";

const UserBanner =()=>{
    const {loginData} = useContext(LoginContext);
    const [backgroundFile, setBackgroundFile] = useState(null);
    const [profilePreview, setProfilePreview] = useState('');
    const [profileFile, setProfileFile] = useState(null);
    const [backgroundPreview, setBackgroundPreview] = useState('');
    const [uploadingProfile, setUploadingProfile] = useState(false);
    const [uploadingBackground, setUploadingBackground] = useState(false);


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
  

    return (
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
        
    )
}

export default UserBanner;
import React from 'react';

const ProfileHeader = ({ 
  loginData, 
  profileFile, 
  backgroundFile, 
  handleProfilePictureChange, 
  handleBackgroundImageChange, 
  uploadProfilePicture, 
  uploadBackgroundImage, 
  uploadingProfile, 
  uploadingBackground 
}) => {
  return (
    <div className="relative">
      {/* Banner */}
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
      
      {/* Profile Picture and Info */}
      <div className="absolute bottom-4 left-6 flex items-center">
        <div className="relative group">
          <img
            src={loginData?.validateUser?.profilePictureUrl || loginData?.validuserone?.image}
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
  );
};

export default ProfileHeader; 
import React, { useState, useEffect, useContext, useRef } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import SubscriptionsList from "./SubscriptionsList";

import { LoginContext } from "../../ContextProvider/context";
import { AttachIcon, DragAndDropIcon, PenIcon } from "../../../asset/icons";
import { encodeId, decodeId} from "../../../utils/hashids"

const UserHeader = ({ posts = [], isLoading, isError, error }) => {
  const [backgroundLoaded, setBackgroundLoaded] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [backgroundImage, setBackGroundImage] = useState(null);
  const [backgroundPreview, setBackgroundPreview] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);
  const [profilePicture, setProfilePicture] = useState(null);
  const [userName, setUserName] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isTextUpdating, setIsTextUpdating] = useState(false);
  const navigate = useNavigate();
  const [showSubscriptions, setShowSubscriptions] = useState(false);
  const subscriptionsRef = useRef();
  const followingRef = useRef();
  const [isUploadingBackground, setIsUploadingBackground] = useState(false);
  const [isUploadingProfile, setIsUploadingProfile] = useState(false);
  const cacheBust = (url) => (url ? `${url}${url.includes('?') ? '&' : '?'}v=${Date.now()}` : url);

  const [subscriptionStats, setSubscriptionStats] = useState({
    subscribersCount: 0,
    subscribedToCount: 0,
  });

  const { loginData, setLoginData } = useContext(LoginContext);
  const [profileUser, setProfileUser] = useState();
  const { id } = useParams();
  const baseUrl = process.env.REACT_APP_BASE_URL;

  useEffect(() => {
    // console.log("Login data:", loginData);
    fetchUserProfile(id);
    if (loginData?.validuserone?._id && id !== loginData?.validuserone?._id) {
      checkSubscriptionStatus(id);
    }
    fetchSubscriptionStats(id);
  }, [id, loginData]);

  useEffect(() => {
    if (profileUser?.userName) {
      setUserName(profileUser.userName);
    }
  }, [profileUser]);

  useEffect(() => {
    if (!showSubscriptions) return;
    function handleClickOutside(event) {
      if (subscriptionsRef.current && !subscriptionsRef.current.contains(event.target) &&
          followingRef.current && !followingRef.current.contains(event.target)) {
        setShowSubscriptions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSubscriptions]);

   const fetchUserProfile = async (userId) => {
    try {
      // console.log("Fetching user profile for user ID:", userId);
      const response = await fetch(
        `${baseUrl}/get-user-profile/${userId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      if (data.status === 200) {
        setProfileUser(data.user);
        setBackgroundLoaded(true);
        setProfileLoaded(true);
      } else {
        console.error("Failed to fetch user profile");
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };


  const handleCancel = () => {
    // Just refresh the page to get fresh state
    window.location.reload();
  };

  const checkSubscriptionStatus = async (userId) => {
    try {
      const token = localStorage.getItem("userdatatoken");
      // console.log("Checking subscription with token:", token);
      const response = await fetch(`${baseUrl}/check/${userId}`, {
        method: "GET",
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      // console.log("Subscription status:", data);
      setIsSubscribed(data.isSubscribed);
    } catch (error) {
      console.error("Error checking subscription status:", error);
    }
  };

  const fetchSubscriptionStats = async (userId) => {
    try {
      const token = localStorage.getItem("userdatatoken");
      const response = await fetch(`${baseUrl}/stats/${userId}`, {
        method: "GET",
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      setSubscriptionStats(data);
    } catch (error) {
      console.error("Error fetching subscription stats:", error);
    }
  };

  const handleSubscription = async () => {
    if (!loginData?.validuserone?._id) {
      alert("Please login to subscribe");
      return;
    }

    setIsSubscribing(true);

    try {
      const token = localStorage.getItem("userdatatoken");
      const url = isSubscribed
        ? `${baseUrl}/unsubscribe/${id}`
        : `${baseUrl}/subscribe/${id}`;

      const method = isSubscribed ? "DELETE" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok) {
        setIsSubscribed(!isSubscribed);
        setSubscriptionStats((prev) => ({
          ...prev,
          subscribersCount: isSubscribed
            ? prev.subscribersCount - 1
            : prev.subscribersCount + 1,
        }));
      } else {
        alert(data.error || "Failed to update subscription");
      }
    } catch (error) {
      console.error("Error updating subscription:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleBackgroundChange = (event) => {
    const uploadedFile = event.target.files[0];
    if (uploadedFile) {
      setBackGroundImage(uploadedFile);

      const type = uploadedFile.type.split("/")[0];

      if (type === "image") {
        const preview = URL.createObjectURL(uploadedFile);
        setBackgroundPreview(preview);
      } else {
        setBackgroundPreview(null);
      }
    }
  };

  const handleProfileChange = (event) => {
    const uploadedFile = event.target.files[0];
    if (uploadedFile) {
      setProfilePicture(uploadedFile);

      const type = uploadedFile.type.split("/")[0];

      if (type === "image") {
        const preview = URL.createObjectURL(uploadedFile);
        setProfilePicturePreview(preview);
      } else {
        setProfilePicturePreview(null);
      }
    }
  };

  const handleUpdateProfileData = async () => {
    try {
      if (backgroundImage) setIsUploadingBackground(true);
      if (profilePicture) setIsUploadingProfile(true);
      const token = localStorage.getItem("userdatatoken");

      const formData = new FormData();
      formData.append("userId", loginData?.validuserone?._id);
      formData.append("userName", userName);

      if (backgroundImage) {
        formData.append("backgroundImage", backgroundImage);
      }

      if (profilePicture) {
        formData.append("profilePicture", profilePicture);
      }

      // console.log(formData, "this is form data");

      const response = await fetch(`${baseUrl}/updateProfile`, {
        method: "POST",
        headers: {
          Authorization: token,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.status === 200) {
        alert("Profile updated successfully!");
      //   setProfileUser(data.user);

        //console.log("Profile user:", profileUser);
        setIsUpdating(false);
        setProfilePicture(null);
        setProfilePicturePreview(null);
        setBackGroundImage(null);
        setBackgroundPreview(null);
        
        // Refresh the profile data
        fetchUserProfile(id);
      } else {
        alert(data.message || "Update failed");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Something went wrong while updating profile");
    } finally {
      setIsUploadingBackground(false);
      setIsUploadingProfile(false);
    }
  };


  const handleFollowingClick = () => {
    if (isOwnProfile || loginData?.validuserone) {
      setShowSubscriptions((prev) => !prev);
    }
  };

  const isOwnProfile = loginData?.validuserone?._id ? encodeId(loginData.validuserone._id) === id : false;

  return (
    <>
      {/* Background Section */}
      <div className="relative">
        <div
          className="relative h-36 md:h-52 bg-cover bg-center bg-gray-200 overflow-hidden"
          style={{
            backgroundImage: backgroundLoaded && (backgroundPreview || profileUser?.backgroundImageUrl) ? 
              `url(${backgroundPreview || profileUser?.backgroundImageUrl})` : 'none',
          }}
        >
          {/* Background Loading Skeleton - Only show when not loaded */}
          {!backgroundLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-300 to-gray-400 z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-3 border-gray-500 border-t-transparent mx-auto mb-2"></div>
                <span className="text-sm text-gray-600 font-medium">Loading background...</span>
              </div>
            </div>
          )}

          {/* Background Upload Overlay - Only show when loaded and updating */}
          {isOwnProfile && isUpdating && backgroundLoaded && (
            <label className="absolute inset-0 z-20 flex items-center justify-center bg-black bg-opacity-60 cursor-pointer transition-all duration-300 hover:bg-opacity-70 group">
              <input
                type="file"
                accept="image/*"
                onChange={handleBackgroundChange}
                className="hidden"
              />
              <div className="text-center text-white transform transition-transform duration-200 group-hover:scale-105">
                <DragAndDropIcon className="mx-auto mb-2 w-8 h-8" />
                <span className="text-sm font-medium">
                  {backgroundImage ? 'Change Background' : 'Upload Background'}
                </span>
              </div>
            </label>
          )}

          {/* Edit Controls - Highest z-index */}
          {isOwnProfile && (
            <div className="absolute right-4 top-4 z-40 flex items-center space-x-2">
              {!isUpdating ? (
                <button 
                  onClick={() => setIsUpdating(true)} 
                  className="bg-white bg-opacity-90 hover:bg-opacity-100 p-2 rounded-full shadow-lg transition-all duration-200 hover:scale-105"
                >
                  <PenIcon className="w-4 h-4 text-gray-700" />
                </button>
              ) : (
                <div className="flex items-center space-x-2">
                  {(backgroundImage || profilePicture) && (
                    <button
                      onClick={handleUpdateProfileData}
                      disabled={isUploadingBackground || isUploadingProfile}
                      className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-3 py-1 text-white text-sm rounded-lg font-medium shadow-lg transition-all duration-200"
                    >
                      {isUploadingBackground || isUploadingProfile ? (
                        <span className="flex items-center">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                          Uploading...
                        </span>
                      ) : (
                        "Save"
                      )}
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      setProfilePicture(null);
                      setProfilePicturePreview(null);
                      setBackGroundImage(null);
                      setBackgroundPreview(null);
                      setUserName(profileUser?.userName);
                      setIsUpdating(false);
                      window.location.reload()
                    }}
                    className="bg-gray-600 hover:bg-gray-700 px-3 py-1 text-white text-sm rounded-lg font-medium shadow-lg transition-all duration-200"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Hidden image for load detection */}
          <img
            src={profileUser?.backgroundImageUrl}
            alt=""
            className="hidden"
            onLoad={() => setBackgroundLoaded(true)}
            onError={() => setBackgroundLoaded(true)}
          />
        </div>

        {/* Profile Picture - Positioned relative to background with proper spacing */}
        <div className="absolute -bottom-14 left-1/2 transform -translate-x-1/2 sm:left-[8%] sm:translate-x-0 sm:-bottom-16 lg:-bottom-24 z-30">
          <div className="relative group">
            {/* Profile Picture Container - Only show when loaded */}
            {profileLoaded && (
              <div
                className="w-28 h-28 md:w-36 md:h-36 sm:w-32 sm:h-32 lg:w-48 lg:h-48 rounded-[30px] border-4 border-white shadow-xl bg-cover bg-center bg-gray-200 overflow-hidden"
                style={{
                  backgroundImage: `url(${
                    profilePicturePreview || profileUser?.profilePictureUrl
                  })`,
                }}
              >
                {/* Profile Upload Overlay */}
                {isOwnProfile && isUpdating && (
                  <label className="absolute inset-0 z-40 flex items-center justify-center bg-black bg-opacity-60 cursor-pointer transition-all duration-300 hover:bg-opacity-70 rounded-[26px] opacity-0 group-hover:opacity-100">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfileChange}
                      className="hidden"
                    />
                    <div className="text-center text-white transform transition-transform duration-200 hover:scale-105">
                      <DragAndDropIcon className="mx-auto mb-1 w-6 h-6" />
                      <span className="text-xs font-medium">
                        {profilePicture ? 'Change' : 'Upload'}
                      </span>
                    </div>
                  </label>
                )}
              </div>
            )}

            {/* Profile Loading Skeleton - Only show when not loaded */}
            {!profileLoaded && (
              <div className="w-28 h-28 md:w-36 md:h-36 sm:w-32 sm:h-32 lg:w-48 lg:h-48 rounded-[30px] border-4 border-white shadow-xl bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-500 border-t-transparent mx-auto mb-1"></div>
                  <span className="text-xs text-gray-600 font-medium">Loading...</span>
                </div>
              </div>
            )}

            {/* Hidden image for load detection */}
            <img
              src={profileUser?.profilePictureUrl}
              alt=""
              className="hidden"
              onLoad={() => setProfileLoaded(true)}
              onError={() => setProfileLoaded(true)}
            />
          </div>
        </div>
      </div>

      {/* Global Upload Overlays */}
      {isUploadingBackground && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-[100]">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-4 shadow-2xl">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-gray-800 font-medium">Uploading background...</span>
          </div>
        </div>
      )}

      {isUploadingProfile && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-[100]">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-4 shadow-2xl">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-gray-800 font-medium">Uploading profile picture...</span>
          </div>
        </div>
      )}

      {/* Content Section */}
      <div className=" from-transparent  pt-16">
        <div className="relative flex flex-col justify-end md:items-center md:gap-8 md:pt-4 sm:gap-4 sm:justify-end sm:flex sm:pt-1 sm:flex-row">
          {/* Left: Name & Bio */}
          <div className="pt-20 w-full md:mb-0 md:p-4 sm:py-2 sm:px-0 sm:w-1/3">
            {profileUser ? (
              <>
                {isOwnProfile && isUpdating ? (
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="text-center sm:text-start font-bold text-gray-800 md:text-2xl sm:text-2xl lg:text-3xl border-2 border-blue-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:border-blue-500 bg-white shadow-lg"
                    placeholder="Enter your name"
                  />
                ) : (


                  <h1 className="flex mx-auto text-start justify-center font-bold text-black dark:text-white md:text-2xl sm:text-2xl sm:text-start lg:text-3xl drop-shadow-lg">
                    {profileUser?.userName}
                  </h1>
                )}
                {/* <p className="pt-2 text-center justify-center text-sm text-white/90 sm:text-md sm:text-start md:text-lg drop-shadow-lg">

                  {profileUser?.email}
                </p> */}

                {/* Subscription Button */}
                {!isOwnProfile && loginData?.validuserone && (
                  <div className="flex justify-center sm:justify-start mt-4">
                    <button
                      onClick={handleSubscription}
                      disabled={isSubscribing}
                      className={`px-6 py-2 rounded-full font-medium text-sm transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg ${
                        isSubscribed
                          ? "bg-white/90 text-gray-700 hover:bg-white focus:ring-gray-500"
                          : "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500"
                      }`}
                    >
                      {isSubscribing ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                          <span>Loading...</span>
                        </div>
                      ) : isSubscribed ? (
                        "Unsubscribe"
                      ) : (
                        "Subscribe"
                      )}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-2">
                <Skeleton height={30} width={150} />
                <Skeleton count={2} />
                <div className="mt-3">
                  <Skeleton height={40} width={100} />
                </div>
              </div>
            )}
          </div>

          {/* Right: Stats */}
          <div className="w-full p-4 pb-6 px-12 md:mb-0 flex flex-row gap-2 text-center justify-between md:mr-8 md:gap-6 sm:gap-2 sm:px-1 sm:pr-4 sm:py-3 sm:w-1/3 lg:gap-8">
            {profileUser ? (
              <>
                <div>


                  <div className="text-lg font-bold text-black dark:text-white tracking-wide md:text-2xl sm:text-xl lg:text-3xl drop-shadow-lg">

                    {isError ? (

                      <span>!</span>
                    ) : (
                      posts?.length || 0
                    )}
                  </div>


                  <div className="text-sm font-medium text-black dark:text-white  drop-shadow">

                    Posts
                  </div>
                </div>
                <div>

    <div className="text-lg font-bold text-black dark:text-white tracking-wide md:text-2xl sm:text-xl lg:text-3xl drop-shadow-lg">

                    {subscriptionStats?.subscribersCount || 0}
                  </div>
                  <div className="text-sm font-medium text-black dark:text-gray-200 drop-shadow">
                    Followers
                  </div>
                </div>
                <div className="relative">
                  <div 
                    ref={followingRef}
                    className={`text-center ${isOwnProfile ? 'cursor-pointer' : ''}`}
                    onClick={isOwnProfile ? handleFollowingClick : undefined}
                  >
                    <div className="text-lg font-bold text-black dark:text-white tracking-wide md:text-2xl sm:text-xl lg:text-3xl drop-shadow-lg">
                      {subscriptionStats?.subscribedToCount || 0}
                    </div>
                    {isOwnProfile ? (
                      <button className="mt-1 px-3 py-1 bg-gray-400 hover:bg-white/30 hover:dark:bg-gray-200 backdrop-blur-sm text-black dark:text-white  text-xs rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50 border border-white/30">
                        Following
                      </button>
                    ) : (
                      <div className="text-sm font-medium text-black dark:text-white text-sm drop-shadow">
                        Following
                      </div>
                    )}

                  </div>
                  
                  {/* Subscriptions Popover */}
                  {showSubscriptions && isOwnProfile && (
                    <>
                      <div
                        ref={subscriptionsRef}
                        className="absolute z-50 right-0 mt-2  border border-gray-400 rounded-xl overflow-y-auto"
                      >
                        {/* <div className="max-h-80 border border-gray-400 rounded-xl overflow-y-auto"> */}
                          <SubscriptionsList userId={id} />
                        {/* </div> */}
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <div>
                  <Skeleton height={28} width={50} />
                  <Skeleton height={16} width={60} />
                </div>
                <div>
                  <Skeleton height={28} width={50} />
                  <Skeleton height={16} width={80} />
                </div>
                <div>
                  <Skeleton height={28} width={50} />
                  <Skeleton height={16} width={75} />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default UserHeader;
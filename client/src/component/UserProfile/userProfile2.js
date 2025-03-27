import React, { useContext, useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { LoginContext } from "../ContextProvider/context";
import { ValidUserForPage } from "../GlobalFunction/GlobalFunctionForResue";
import Login from "../Auth/Login";
import UserBanner from "./Components/UserBanner";
import UserContent from "./Components/UserContent";

const Uploader = () => {
  const { loginData, setLoginData } = useContext(LoginContext);
  const [userPosts, setUserPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [showLogin, setShowLogin] = useState(false);
  const [profileUser, setProfileUser] = useState(null);
  const { userId } = useParams();
  const navigate = useNavigate();

  const validatePage = ValidUserForPage();

  const validateUser = () => {
    if (!loginData) {
      return validatePage();
    }
  };

  useEffect(() => {
    console.log(localStorage.getItem("userdatatoken"),"this is user data token");
    console.log("useEffect triggered, loginData:", loginData);
    validateUser();
    
    // Fetch user profile data if viewing another user's profile
    if (userId && userId !== loginData?.validuserone?._id) {
      fetchUserProfile(userId);
    }
  }, [userId, loginData]);

  const fetchUserProfile = async (userId) => {
    try {
      const response = await fetch(`http://localhost:8099/get-user-profile/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const data = await response.json();
      if (data.status === 200) {
        setProfileUser(data.user);
      } else {
        console.error("Failed to fetch user profile");
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  if (!validateUser) {
    return <Login />;
  }

  // If viewing another user's profile, use their data
  const displayUser = userId && userId !== loginData?.validuserone?._id ? profileUser : loginData?.validuserone;

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Banner */}
      <UserBanner userData={displayUser}></UserBanner>
      
      {/* Upload Button */}
      <div className="container mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Content</h2>
          {!userId || userId === loginData?.validuserone?._id ? (
            <Link
              to="/test2"
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-300"
            >
              Create New Post
            </Link>
          ) : null}
        </div>

        {/* Filter Tabs */}
        <UserContent userData={displayUser}></UserContent>
      </div>
    </div>
  );
};

export default Uploader;
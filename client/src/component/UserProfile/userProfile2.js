import React, { useContext, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LoginContext } from "../ContextProvider/context";
import { ValidUserForPage } from "../GlobalFunction/GlobalFunctionForResue";
import Login from "../Auth/Login";
import UserBanner from "./Components/UserBanner";
import UserContent from "./Components/UserContent";

const Uploader = () => {
  const {loginData,setLoginData} = useContext(LoginContext);
  const [userPosts, setUserPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showLogin,setShowLogin]= useState(false);
  
  
  
  const navigate = useNavigate();
  const validatePage = ValidUserForPage();

  const validateUser = () =>{

    if(!loginData){
      return validatePage() ;
    }
}

  useEffect(() => {
    console.log("useEffect triggered, loginData:", loginData);
    validateUser();
  });

  if(!validateUser){
    return (<Login></Login>)
  }
 

  
  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Banner */}
      <UserBanner></UserBanner>
      
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
        <UserContent></UserContent>
      </div>
    </div>
  );
};

export default Uploader;
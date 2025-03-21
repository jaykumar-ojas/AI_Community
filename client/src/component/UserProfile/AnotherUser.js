import React, { useContext, useEffect } from "react";
import { useParams } from "react-router-dom";
import { LoginContext } from "../ContextProvider/context";
import { ValidUserForPage } from "../GlobalFunction/GlobalFunctionForResue";
import AnotherUserBanner from "./AnotherComponent/AnotherUserBanner";
import UserContent from "./Components/UserContent";
import Login from "../Auth/Login";


const AnotherUser = () => {
    const {loginData,setLoginData} = useContext(LoginContext);
    const {userId} = useParams();
    const validatePage = ValidUserForPage();
  
  
    // Fetch user posts when component mounts
  
    useEffect(() => {
      console.log("useEffect triggered, loginData:", loginData);
      validateUser();
      },[loginData]);
  
    const validateUser =()=>{
        if(!loginData)
      return validatePage();
    }
  
    if(!validateUser){
        return (<Login></Login>)
    }
    return (
      <div className="bg-gray-100 min-h-screen">
        {/* Banner */}
        <AnotherUserBanner></AnotherUserBanner>
          {/* Filter Tabs */}
        <div className="container mx-auto px-6 py-8">
          {/* <UserContent></UserContent> */}
        </div>
      </div>
    );
  };

export default AnotherUser;
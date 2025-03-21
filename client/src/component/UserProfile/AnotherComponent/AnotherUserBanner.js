import React, { useContext, useEffect, useState } from "react";
import { LoginContext } from "../../ContextProvider/context";
import { useNavigate, useParams } from "react-router-dom";

const UserBanner = () => {
  const {loginData} = useContext(LoginContext);
  const {userId} = useParams();
  const [user,setUser] = useState();
  const navigate = useNavigate();   


  useEffect(()=>{
    console.log(userId,"this is userId");
    getUser();
  },[loginData]);

  // Handle profile picture change
  const getUser = async()=>{
    if(!userId){
        navigate('*');
    }
    try{
    const data = await fetch(`http://localhost:8099/getUserById/${userId}`,{
        method:'GET',
        headers:"applicatin/json"
    });

    const res = await data.json();
    setUser(res.user);
   }
   catch(error){
    alert("this user doesn't exist");
   }


  }
  

  return (
    <div className="relative">
      <div className="relative h-64 overflow-hidden group">
        <img
          src={user?.backgroundImageUrl}
          alt="User Banner"
          className="w-full h-64 object-cover"
        />
      </div>
      <div className="absolute bottom-4 left-6 flex items-center">
        <div className="relative group">
          <img
            src={
              user?.profilePictureUrl ||
              user?.image
            }
            alt="User Avatar"
            className="w-24 h-24 rounded-full border-4 border-white object-cover"
          />
        </div>
        <div className="ml-4">
          <h1 className="text-3xl font-bold text-white">
            {user?.userName}
          </h1>
          <p className="text-gray-200">{user?.email}</p>
        </div>
      </div>
    </div>
  );
};

export default UserBanner;

import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LoginContext } from "../../component/ContextProvider/context";
import Login from "../Auth/Login";

const Card = ({ post }) => {
  const [showLogin, setShowLogin] = useState(false);
  const { loginData } = useContext(LoginContext);
  const navigate = useNavigate();
  const handleCardClick = () => {
    console.log(" i ma goint ot click");
    console.log("this is loginData",loginData);
    if(loginData){
      navigate(`/userPost/${post?._id}`);
      // navigate(`/userPost/askdjhjdj`);
    }
    else{
      setShowLogin(true);
    }
   
  };

  return (
    <div
      onClick={handleCardClick}
      className="group border rounded-lg h-72 w-96 overflow-hidden relative hover:cursor-pointer"
    >
      <div className="h-full w-full">
        {post.fileType =="image" && <img
          src={post.signedUrl}
          className="h-full w-full object-cover opacity-95 hover:opacity-100 transition duration-300"
          alt="Card Image"
        />}
        {post.fileType =="video" && <video
          src={post.signedUrl}
          className="h-full w-full object-cover opacity-95 hover:opacity-100 transition duration-300"
          autoPlay
          loop
          muted
          playsInline
          />}
         {post.fileType === "audio" && (
          <div className="h-full w-full flex items-center justify-center bg-gray-800 p-4">
            <div className="p-4 bg-gray-900 rounded-lg shadow-lg w-80">
              <audio
                src={post.signedUrl}
                className="w-full opacity-95 hover:opacity-100 transition duration-300"
                controls
              />
            </div>
          </div>
        )}


        {/* Hidden div to show on hover */}
        <div className="absolute top-2 left-2 flex items-center gap-2 p-2 rounded-lg bg-white bg-opacity-0 opacity-0 transition duration-700 group-hover:opacity-100 group-hover:bg-opacity-50">
          <img
            src={post.image}
            className="h-8 w-8 rounded-full"
            alt="Profile"
            referrerPolicy="no-referrer"
          />
          <div className="text-white font-semibold">{post.userName}</div>
        </div>
        <div className="absolute bottom-6 text-white left-4 opacity-0 transition duration-700 group-hover:opacity-100 bg-white bg-opacity-0 group-hover:bg-opacity-25 text-white font-semibold p-2 rounded-lg">
          {post.desc}
        </div>
      </div>
    </div>
  );
};

export default Card;

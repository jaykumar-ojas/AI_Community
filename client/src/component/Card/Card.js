import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LoginContext } from "../../component/ContextProvider/context";
import Login from "../Auth/Login";

const Card = ({ post }) => {
  const [showLogin, setShowLogin] = useState(false);
  const { logindata } = useContext(LoginContext);
  const navigate = useNavigate();
  const handleCardClick = () => {
    if(logindata){
      navigate(`/userPost/${post?._id}`);
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
      {showLogin && <Login ></Login>}
      <div className="h-full w-full">
        <img
          src={post.signedUrl}
          className="h-full w-full object-cover opacity-95 hover:opacity-100 transition duration-300"
          alt="Card Image"
        />
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

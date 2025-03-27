import React, { useContext, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { LoginContext } from "../../component/ContextProvider/context";
import Login from "../Auth/Login";

const Card = ({ post }) => {
  const [showLogin, setShowLogin] = useState(false);
  const { loginData } = useContext(LoginContext);
  const navigate = useNavigate();
  
  const handleCardClick = () => {
    // Check if this is a forum media post
    if (post.mediaAttachments && post.mediaAttachments.length > 0) {
      // This is a forum media post, navigate to the forum topic
      navigate(`/forum/${post.topicId}`);
    } else {
      // This is a regular post, navigate to the post view
      navigate(`/userPost/${post._id}`);
    }
  };

  const handleUserClick = (e) => {
    e.stopPropagation(); // Prevent card click when clicking user profile
    navigate(`/userprofile/${post.userId}`);
  };

  // Determine the media URL and type
  const getMediaInfo = () => {
    if (post.mediaAttachments && post.mediaAttachments.length > 0) {
      // Forum media post
      const attachment = post.mediaAttachments[0];
      return {
        url: attachment.signedUrl,
        type: attachment.fileType
      };
    } else {
      // Regular post
      return {
        url: post.signedUrl,
        type: post.fileType
      };
    }
  };

  const mediaInfo = getMediaInfo();

  return (
    <div
      onClick={handleCardClick}
      className="group border rounded-lg h-72 w-96 overflow-hidden relative hover:cursor-pointer"
    >
      <div className="h-full w-full">
        {mediaInfo.type === "image" && <img
          src={mediaInfo.url}
          className="h-full w-full object-cover opacity-95 hover:opacity-100 transition duration-300"
          alt="Card Image"
        />}
        {mediaInfo.type === "video" && <video
          src={mediaInfo.url}
          className="h-full w-full object-cover opacity-95 hover:opacity-100 transition duration-300"
          autoPlay
          loop
          muted
          playsInline
          />}
         {mediaInfo.type === "audio" && (
          <div className="h-full w-full flex items-center justify-center bg-gray-800 p-4">
            <div className="p-4 bg-gray-900 rounded-lg shadow-lg w-80">
              <audio
                src={mediaInfo.url}
                className="w-full opacity-95 hover:opacity-100 transition duration-300"
                controls
              />
            </div>
          </div>
        )}


        {/* Hidden div to show on hover */}
        <div 
          onClick={handleUserClick}
          className="absolute top-2 left-2 flex items-center gap-2 p-2 rounded-lg bg-white bg-opacity-0 opacity-0 transition duration-700 group-hover:opacity-100 group-hover:bg-opacity-50 cursor-pointer hover:bg-opacity-75"
        >
          <img
            src={post.image}
            className="h-8 w-8 rounded-full"
            alt="Profile"
            referrerPolicy="no-referrer"
          />
          <div className="text-white font-semibold hover:text-blue-200">{post.userName}</div>
        </div>
        <div className="absolute bottom-6 text-white left-4 opacity-0 transition duration-700 group-hover:opacity-100 bg-white bg-opacity-0 group-hover:bg-opacity-25 text-white font-semibold p-2 rounded-lg">
          {post.desc}
        </div>
      </div>
    </div>
  );
};

export default Card;

import React, { useContext, useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { LoginContext } from "../../component/ContextProvider/context";
import Login from "../Auth/Login";
import UserIconCard from "../Card/UserIconCard";
import UserNameCard from "../Card/UserNameCard";
import PixelLoader from "../Loader/PixelLoader";
import MasonryMediaGrid from "./MansoryMediaGrid";
import { heartSvg, thumbsDownSvg, Sparkle } from "../../asset/icons";
import axios from "axios";
import AIModelInfo from "../Postcontent/UserContent";
import {encodeId} from "../../utils/hashids"

const Card = ({ post }) => {
  const [showLogin, setShowLogin] = useState(false);
  const { loginData } = useContext(LoginContext);
  const [userLiked, setUserLiked] = useState(false);
  const [userDisliked, setUserDisliked] = useState(false);
  const [currentUser, setCurrentUser] = useState({
    id: '',
    name: ''
  });
  const [postData, setPostData] = useState(post);
  const [modelIcon, setModelIcon] = useState(null);
  const baseUrl = process.env.REACT_APP_BASE_URL;
  

  // Fetch model icon for AI-generated posts
  useEffect(() => {
    const fetchModelIcon = async () => {
      if (post?.isAIGenerated && post?.aiModel) {
        try {
          const response = await fetch(`${baseUrl}/aimodels/search?modelName=${encodeURIComponent(post.aiModel)}`);
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data.iconUrl) {
              setModelIcon(data.data.iconUrl);
            }
          }
        } catch (error) {
          console.error("Error fetching model icon:", error);
        }
      }
    };

    fetchModelIcon();
  }, [post?.isAIGenerated, post?.aiModel]);

  
const [sparkles, setSparkles] = useState([]);


 const handleLikePost = async () => {
    if (!currentUser.id) {
      alert("Please log in to like posts");
      return;
    }

    // Create sparkle animation only when liking (not unliking)
    if (!userLiked) {
      // Array of vibrant colors for sparkles
      const sparkleColors = [
        '#ff6b6b', // Red
        '#4ecdc4', // Teal
        '#45b7d1', // Blue
        '#f9ca24', // Yellow
        '#f0932b', // Orange
        '#eb4d4b', // Pink
        '#6c5ce7', // Purple
        '#a29bfe', // Light Purple
        '#fd79a8', // Pink
        '#00b894', // Green
        '#e17055', // Coral
        '#fdcb6e'  // Golden
      ];
      
      // Create sparkle animation with random colors
      const newSparkles = Array.from({ length: 8 }, (_, i) => ({
        id: Date.now() + i,
        color: sparkleColors[Math.floor(Math.random() * sparkleColors.length)],
        style: {
          left: `${Math.random() * 50 - 15}px`,
          top: `${Math.random() * 50 - 15}px`,
          animationDelay: `${i * 0.08}s`,
          animationDuration: `${0.6 + Math.random() * 0.4}s`,
        },
      }));
      
      setSparkles(newSparkles);
      
      // Remove sparkles after animation
      setTimeout(() => setSparkles([]), 1000);
    }

    try {
      const response = await axios.post(`${baseUrl}/${postData._id}/like`, {
        userId: currentUser.id
      });
      
      if (response.status === 200) {
        // Update local state to reflect the change
        const updatedPost = { ...postData };
        
        if (userLiked) {
          // Remove like
          updatedPost.likes = updatedPost.likes.filter(id => id !== currentUser.id);
        } else {
          // Add like and remove dislike if exists
          if (!updatedPost.likes) updatedPost.likes = [];
          if (!updatedPost.likes.includes(currentUser.id)) {
            updatedPost.likes.push(currentUser.id);
          }
          
          // Remove from dislikes if present
          if (updatedPost.dislikes && updatedPost.dislikes.includes(currentUser.id)) {
            updatedPost.dislikes = updatedPost.dislikes.filter(id => id !== currentUser.id);
          }
        }
        
        setPostData(updatedPost);
        setUserLiked(!userLiked);
        if (userDisliked) setUserDisliked(false);
      }
    } catch (error) {
      console.error('Error liking post:', error);
      alert("Error liking post. Please try again.");
    }
  };


    const handleDislikePost = async () => {
      if (!currentUser.id) {
        alert("Please log in to dislike posts");
        return;
      }
  
      try {
        const response = await axios.post(`${baseUrl}/${postData._id}/dislike`, {
          userId: currentUser.id
        });
        
        if (response.status === 200) {
          // Update local state to reflect the change
          const updatedPost = { ...postData };
          
          if (userDisliked) {
            // Remove dislike
            updatedPost.dislikes = updatedPost.dislikes.filter(id => id !== currentUser.id);
          } else {
            // Add dislike and remove like if exists
            if (!updatedPost.dislikes) updatedPost.dislikes = [];
            if (!updatedPost.dislikes.includes(currentUser.id)) {
              updatedPost.dislikes.push(currentUser.id);
            }
            
            // Remove from likes if present
            if (updatedPost.likes && updatedPost.likes.includes(currentUser.id)) {
              updatedPost.likes = updatedPost.likes.filter(id => id !== currentUser.id);
            }
          }
          
          setPostData(updatedPost);
          setUserDisliked(!userDisliked);
          if (userLiked) setUserLiked(false);
        }
      } catch (error) {
        console.error('Error disliking post:', error);
        alert("Error disliking post. Please try again.");
      }
    };

  useEffect(() => {
    console.log("UserContent received post:", post);
    if (post) {
      setPostData(post);

      // Check if current user has liked or disliked this post
      if (loginData && loginData.validuserone && post.likes && post.dislikes) {
        const userId = loginData.validuserone._id;
        setUserLiked(post.likes.includes(userId));
        setUserDisliked(post.dislikes.includes(userId));
        setCurrentUser({
        id: loginData.validuserone._id,
        name: loginData.validuserone.userName
      });
      }
    }
  }, [post]);
  const navigate = useNavigate();


  const handleCardClick = () => {
    // This is a regular post, navigate to the post view
    navigate(`/userPost/${post?._id}`);
  };

  const handleUserClick = (e) => {
    e.stopPropagation(); // Prevent card click when clicking user profile
    navigate(`/userprofile/${encodeId(post.userId)}`);
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
        url: post.imgUrl,
        type: post.fileType
      };
    }
  };

  const mediaInfo = getMediaInfo();

  return (
    <div
  className="group relative cursor-pointer"
  onClick={handleCardClick}
>
  <MasonryMediaGrid url={mediaInfo?.url} type={mediaInfo?.type} />

  <div className="absolute flex flex-col bottom-0 h-full w-full justify-between left-0 right-0 bg-black bg-opacity-60 text-white text-sm p-2 opacity-0 group-hover:opacity-100 transition duration-500">
    {/* User info row (with AI model if AI generated) */}
    <div className="flex justify-between flex-row gap-2 pb-1 items-center">
      <div className="flex flex-row justify-start gap-2">
          <div className="h-6 w-6 flex-shrink-0" onClick={handleUserClick}>
            <UserIconCard id={post?.userId} />
          </div>
          <div onClick={handleUserClick}>
            <UserNameCard id={post?.userId} />
          </div>
      </div>
        {post?.isAIGenerated && post?.aiModel && (
        <div className="flex items-center gap-1 bg-purple-600 text-white text-xs px-2 py-1 rounded-full font-semibold ml-2">
          {modelIcon ? (
            <img 
              src={modelIcon} 
              alt={`${post.aiModel} icon`}
              className="w-3 h-3 rounded-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          ) : null}
          <span>{post.aiModel}</span>
        </div>
      )}
    </div>

    {/* Description */}
    <div className="overflow-y-auto items-center.g justify-center no-scrollbar">
      {post?.desc}
    </div>

    {/* Like/Dislike Buttons */}
   <div>
  <div className="flex items-center gap-4 p-2 pb-1">
    <button
      className="flex items-center gap-1"
      onClick={(e) => {
        e.stopPropagation();
        handleLikePost();
      }}
      title={userLiked ? "Remove like" : "Like this post"}
    >
      <div className="relative">
        {heartSvg(userLiked)}
        {sparkles.map((sparkle) => (
          <Sparkle key={sparkle.id} style={sparkle.style} color={sparkle.color} />
        ))}
      </div>
      <span className="text-xs font-medium">
        {postData?.likes?.length || 0}
      </span>
    </button>

        {/* <button
          className="flex items-center gap-1"
          onClick={(e) => {
            e.stopPropagation();
            handleDislikePost();
          }}
          title={userDisliked ? "Remove dislike" : "Dislike this post"}
        >
          {thumbsDownSvg(userDisliked)}
          <span className="text-sm font-medium">
            {postData?.dislikes?.length || 0}
          </span>
        </button> */}
      </div>
    </div>
  </div>
  <style jsx>{`
        @keyframes sparkle {
          0% {
            transform: scale(0) rotate(0deg);
            opacity: 1;
          }
          50% {
            transform: scale(1) rotate(180deg);
            opacity: 1;
          }
          100% {
            transform: scale(0) rotate(360deg);
            opacity: 0;
          }
        }
        
        .animate-ping {
          animation: sparkle 0.8s ease-out forwards;
        }
      `}</style>
</div>

  );
};

export default Card;




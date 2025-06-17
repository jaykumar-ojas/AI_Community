import React, { useContext, useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { LoginContext } from "../../component/ContextProvider/context";
import Login from "../Auth/Login";
import UserIconCard from "../Card/UserIconCard";
import UserNameCard from "../Card/UserNameCard";
import PixelLoader from "../Loader/PixelLoader";
import MasonryMediaGrid from "./MansoryMediaGrid";
import { heartSvg, thumbsDownSvg } from "../../asset/icons";
import axios from "axios";


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

  const handleLikePost = async () => {
      if (!currentUser.id) {
        alert("Please log in to like posts");
        return;
      }
  
      try {
        const response = await axios.post(`http://localhost:8099/${postData._id}/like`, {
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
        const response = await axios.post(`http://localhost:8099/${postData._id}/dislike`, {
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
    
    {/* User info row */}
    <div className="flex flex-row gap-2 pb-1">
      <div className="h-6 w-6 flex-shrink-0" onClick={handleUserClick}>
        <UserIconCard id={post?.userId} />
      </div>
      <div onClick={handleUserClick}>
        <UserNameCard id={post?.userId} />
      </div>
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
          {heartSvg(userLiked)}
          <span className="text-xs font-medium">
            {postData?.likes?.length || 0}
          </span>
        </button>

        <button
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
        </button>
      </div>
    </div>
  </div>
</div>

  );
};

export default Card;




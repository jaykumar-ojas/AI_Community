import React, { useContext, useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
// import Login from "../../Auth/Login";
import UserIconCard from "../../Card/UserIconCard";
// import UserNameCard from "../Card/UserNameCard";
import MasonryMediaGrid from "../../Card/MansoryMediaGrid";
import { heartSvg, thumbsDownSvg, Sparkle } from "../../../asset/icons";
import axios from "axios";
import { LoginContext } from "../../ContextProvider/context";
// import AIModelInfo from "../Postcontent/UserContent";
// import { encodeId } from "../../utils/hashids"
// import LoginHover from "../Auth/LoginHover";

const ChallengeCard = ({ post }) => {
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

  useEffect(() => {
    //console.log("UserContent received post:", post);
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
  }, [post, loginData]);
  const navigate = useNavigate();


  const handleCardClick = () => {
    if (post?.isCommentRef) {
      navigate(`/userPost/${post.refPostId}?comment=${post.refCommentId}`);
    } else {
      navigate(`/userPost/${post?._id}`);
    }
  };

  // Determine the media URL and type
  const getMediaInfo = () => {
    if (post?.mediaAttachments && post?.mediaAttachments.length > 0) {
      // Forum media post
      const attachment = post.mediaAttachments[0];
      return {
        url: attachment?.signedUrl,
        type: attachment?.fileType
      };
    } else {
      // Regular post (or commented image ref)
      return {
        url: post?.imageUrl?.fileUrl,
        type: post?.imageUrl.fileType
      };
    }
  };

  // Reset media loading state when post changes
//   useEffect(() => {
//     if (post) {
//       setMediaLoading(true);
//       setIsMediaLoaded(false);
//     }
//   }, [post]);


  const mediaInfo = getMediaInfo();

  return (
    <div
      className="group relative cursor-pointer px-1 mb-2 md:px-0 md:mb-0"
      onClick={handleCardClick}
    >

      <MasonryMediaGrid
        url={mediaInfo?.url}
        type={mediaInfo?.type}
        // onLoad={handleMediaLoad}
      />

      {/* Comment Reference Badge */}
      {post?.isCommentRef && (
        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded-full border border-white/20 z-10">
          Ref made from this
        </div>
      )}

      <div className="absolute flex flex-col bottom-0 h-full w-full justify-between left-0 right-0 bg-black bg-opacity-0 sm:bg-opacity-60 text-white text-sm p-2 sm:opacity-0 sm:group-hover:opacity-100 transition duration-500">
        {/* User info row (with AI model if AI generated) */}
        <div className="flex justify-between bg-black/5 flex-row gap-2 pb-1 items-center">
          <div className="flex flex-row  justify-start gap-2">
            <div className="h-6 w-6  flex-shrink-0 hidden md:block">
              <UserIconCard id={post?.userId} />
            </div>
            {/* <div className="hidden md:block">
              <UserNameCard id={post?.userId} hover={false} size={5} />
            </div> */}
          </div>
          {post?.isAIGenerated && post?.aiModel && (
            <div className="flex overflow-hidden items-center gap-1 bg-purple-600 text-white text-xs px-2 py-1 rounded-full font-semibold ml-2">
              <div>
                {modelIcon ? (
                  <img
                    src={modelIcon}
                    alt={`${post.aiModel} icon`}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : null}
              </div>

              {/* <div className="truncate">{post?.aiModel}</div> */}
            </div>

          )}

          {/* Mobile AI model badge - positioned below user info */}
          {post?.isAIGenerated && post?.aiModel && (
            <div className="sm:hidden absolute top-12 left-2 bg-purple-600 text-white text-xs px-2 py-1 rounded-full font-semibold z-10">
              {/* {modelIcon ? (
            <img 
              src={modelIcon} 
              alt={`${post.aiModel} icon`}
              className="w-3 h-3 rounded-full object-cover inline mr-1"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          ) : null} */}
              {/* <span className="truncate">{post.aiModel}</span> */}
            </div>
          )}
        </div>

        {/* Description */}
        <div className="opacity-0 hidden md:block group-hover:opacity-100 group-active:opacity-100 transition duration-300 overflow-y-auto items-center.g justify-center no-scrollbar">
          {post?.desc}
        </div>

        {/* Like/Dislike Buttons */}
        <div>
          <div className="flex  items-center gap-4 p-2 pb-1">
            <button
              className="flex bg-black/10 items-center gap-1"
              onClick={(e) => {
                e.stopPropagation();
                // handleLikePost();
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
          </div>
        </div>
      </div>
    </div>

  );
};

export default ChallengeCard;

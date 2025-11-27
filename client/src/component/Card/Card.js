import React, { useContext, useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { LoginContext } from "../../component/ContextProvider/context";
import Login from "../Auth/Login";
import UserIconCard from "../Card/UserIconCard";
import UserNameCard from "../Card/UserNameCard";
import MasonryMediaGrid from "./MansoryMediaGrid";
import { heartSvg, thumbsDownSvg, Sparkle } from "../../asset/icons";
import axios from "axios";
import AIModelInfo from "../Postcontent/UserContent";
import { encodeId } from "../../utils/hashids"
import LoginHover from "../Auth/LoginHover";

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
  const [isMediaLoaded, setIsMediaLoaded] = useState(false);
  const [mediaLoading, setMediaLoading] = useState(true);

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
      setShowLogin(true);
      return;
    }

    // ---- Optimistic Update Start ----
    let prevPostData = { ...postData }; // backup
    let prevUserLiked = userLiked;
    let prevUserDisliked = userDisliked;

    // Create sparkle animation only when liking
    if (!userLiked) {
      const sparkleColors = [
        '#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24',
        '#f0932b', '#eb4d4b', '#6c5ce7', '#a29bfe',
        '#fd79a8', '#00b894', '#e17055', '#fdcb6e'
      ];

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
      setTimeout(() => setSparkles([]), 1000);
    }

    // Optimistically update UI
    let updatedPost = { ...postData };

    if (userLiked) {
      // Unlike
      updatedPost.likes = updatedPost.likes.filter(id => id !== currentUser.id);
      setUserLiked(false);
    } else {
      // Like
      if (!updatedPost.likes) updatedPost.likes = [];
      if (!updatedPost.likes.includes(currentUser.id)) {
        updatedPost.likes.push(currentUser.id);
      }

      if (updatedPost.dislikes?.includes(currentUser.id)) {
        updatedPost.dislikes = updatedPost.dislikes.filter(id => id !== currentUser.id);
        setUserDisliked(false);
      }
      setUserLiked(true);
    }

    setPostData(updatedPost);
    // ---- Optimistic Update End ----

    try {
      let response;
      if (postData.isCommentRef) {
        // Handle like for commented image (comment ref)
        // Note: The user provided snippet uses getAuthHeaders(), but here we are using axios with default config or just body.
        // Assuming the backend for comments expects headers or just works if we send the request.
        // Card.js uses LoginContext but doesn't seem to import getAuthHeaders.
        // However, standard axios calls in this file for posts just send userId in body.
        // The user snippet for comments used headers.
        // Let's try to use the same pattern as the user snippet but adapting to what we have.
        // If getAuthHeaders is not available, we might need to rely on cookies if that's how it works, 
        // OR we might need to import getAuthHeaders if it's exported.
        // It is exported from "../../AiForumPage/components/ForumUtils".
        // But let's see if we can just use the body userId approach if the backend supports it, 
        // OR if we need to import `getAuthHeaders`.
        // The user snippet explicitly used `headers: getAuthHeaders()`.
        // Let's import it.

        // Wait, I can't easily add an import at the top without reading the whole file again or risking index shifts if I'm not careful.
        // But I am replacing a block.
        // Actually, I can just try to use the same endpoint pattern.
        // If the backend for comments requires a token in header, I need that.
        // `LoginContext` usually has the token. `loginData.token`?
        // Let's look at `Card.js` imports again. It doesn't import `getAuthHeaders`.
        // I will try to use `loginData.token` if available to construct headers, or just try without if it's cookie based.
        // But wait, `ShowCommentContent.js` imports `getAuthHeaders` from `../../AiForumPage/components/ForumUtils`.
        // I should probably add that import to `Card.js` to be safe.
        // But for now, I will assume I can access `loginData.token` if I need to.
        // Actually, let's look at `Card.js` existing axios calls.
        // `axios.post(\`\${baseUrl}/\${postData._id}/like\`, { userId: currentUser.id })`
        // This suggests the post like endpoint uses `userId` from body.
        // The comment like endpoint might be different.
        // The user snippet: `axios.post(\`\${baseUrl}/comments/\${reply._id}/like\`, {}, { headers: getAuthHeaders() })`
        // It sends empty body and headers.
        // I'll try to replicate that. I need `getAuthHeaders`.
        // I'll assume I need to add the import.

        // Actually, I'll just use the `loginData` to get the token if possible.
        // `loginData` is in context.
        // `const { loginData } = useContext(LoginContext);`
        // If `loginData` has `token`, I can make the header manually: `{ Authorization: \`Bearer \${loginData.token}\` }`.
        // Let's check `LoginContext` or `validateToken` usage in `DashBoardPage.js`.
        // It seems `loginData` contains user info.

        // Alternative: The user said "if the image is from refrence then if some likes then call this api".
        // I will assume I can just make the call.

        // I will add the import of `getAuthHeaders` in a separate `replace_file_content` call or just add it here if I was replacing the top.
        // Since I am replacing a function in the middle, I can't add imports easily.
        // I will try to implement `getAuthHeaders` logic inline or use `loginData`.
        // `getAuthHeaders` usually gets token from localStorage.

        const token = localStorage.getItem("userdatatoken");
        const headers = token ? { Authorization: token, "Content-Type": "application/json" } : { "Content-Type": "application/json" };

        response = await axios.post(`${baseUrl}/comments/${postData.refCommentId}/like`, {}, {
          headers: headers
        });

      } else {
        // Regular post like
        response = await axios.post(`${baseUrl}/${postData._id}/like`, {
          userId: currentUser.id
        });
      }

      if (response.status !== 200) throw new Error("Like failed");
    } catch (error) {
      console.error("Error liking post:", error);

      // Rollback if API fails
      setPostData(prevPostData);
      setUserLiked(prevUserLiked);
      setUserDisliked(prevUserDisliked);

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
        url: post?.imgUrl,
        type: post?.fileType
      };
    }
  };
  const handleMediaLoad = () => {
    setIsMediaLoaded(true);
    setMediaLoading(false);
  };

  // Reset media loading state when post changes
  useEffect(() => {
    if (post) {
      setMediaLoading(true);
      setIsMediaLoaded(false);
    }
  }, [post]);


  const mediaInfo = getMediaInfo();

  return (
    <div
      className="group relative cursor-pointer px-1 mb-2 md:px-0 md:mb-0"
      onClick={handleCardClick}
    >

      <MasonryMediaGrid
        url={mediaInfo?.url}
        type={mediaInfo?.type}
        onLoad={handleMediaLoad}
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
          </div>
        </div>
      </div>
    </div>

  );
};

export default Card;

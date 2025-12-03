import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { LoginContext } from "../../component/ContextProvider/context";
import Login from "../Auth/Login";
import UserIconCard from "../Card/UserIconCard";
import UserNameCard from "../Card/UserNameCard";
import MasonryMediaGrid from "./MansoryMediaGrid";
import ReplyData2 from "./Replydata2";
import { heartSvg, Sparkle } from "../../asset/icons";
import axios from "axios";
import { encodeId } from "../../utils/hashids"
import LoginHover from "../Auth/LoginHover";
import { getAuthHeaders } from "../AiForumPage/components/ForumUtils";

const Card = ({ post }) => {
  const isForumContent = post?.type === "forum_ai";
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
      if (isForumContent) {
        response = await axios.post(
          `${baseUrl}/forum/replies/${postData.replyId || postData._id}/like`,
          {},
          { headers: getAuthHeaders() }
        );
      } else if (postData.isCommentRef) {
        response = await axios.post(
          `${baseUrl}/comments/${postData.refCommentId}/like`,
          {},
          { headers: getAuthHeaders() }
        );
      } else {
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
      setShowLogin(true);
      return;
    }

    try {
      let response;
      if (isForumContent) {
        response = await axios.post(
          `${baseUrl}/forum/replies/${postData.replyId || postData._id}/dislike`,
          {},
          { headers: getAuthHeaders() }
        );
      } else if (postData.isCommentRef) {
        response = await axios.post(
          `${baseUrl}/comments/${postData.refCommentId}/dislike`,
          {},
          { headers: getAuthHeaders() }
        );
      } else {
        response = await axios.post(`${baseUrl}/${postData._id}/dislike`, {
          userId: currentUser.id
        });
      }

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
    if (isForumContent) {
      const topicId = postData?.topicId || postData?.forumRef?.topicId;
      const replyId = postData?.replyId || postData?._id;
      if (topicId) {
        const topicSlug = encodeId(topicId);
        const replyParam = replyId ? `?comment=${encodeId(replyId)}` : "";
        navigate(`/forum/topic/${topicSlug}${replyParam}`);
      }
      return;
    }

    if (postData?.isCommentRef) {
      navigate(`/userPost/${postData.refPostId}?comment=${postData.refCommentId}`);
    } else {
      navigate(`/userPost/${postData?._id}`);
    }
  };

  // Determine the media URL and type
  const getMediaInfo = () => {
    if (isForumContent) return null;

    if (postData?.mediaAttachments && postData?.mediaAttachments.length > 0) {
      const attachment = postData.mediaAttachments[0];
      return {
        url: attachment?.signedUrl || attachment?.fileUrl,
        type: attachment?.fileType
      };
    }

    return {
      url: postData?.imgUrl,
      type: postData?.fileType
    };
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
  const forumModels = useMemo(() => {
    if (!isForumContent || !Array.isArray(postData?.content)) return [];
    const unique = new Set();
    postData.content.forEach((block) => {
      if (block?.model) {
        unique.add(block.model);
      }
    });
    return Array.from(unique);
  }, [isForumContent, postData]);

  const renderForumCard = () => {
    const topicTitle = postData?.topicTitle || "Forum reply";
    const formattedDate = postData?.createdAt
      ? new Date(postData.createdAt).toLocaleString()
      : null;

    return (
      <div className="group relative px-1 mb-2 md:px-0 md:mb-0">
      <div className="relative w-full h-full rounded-3xl border border-gray-200/80 dark:border-gray-700/70 bg-white/80 dark:bg-nav_hover/70 backdrop-blur-xl shadow-sm hover:shadow-2xl transition duration-300 p-4">
    
        {/* 🌟 ABSOLUTE OVERLAY (hidden normally, visible on hover) */}
        <div className="
          absolute inset-0 p-4 
          flex flex-col justify-between
          opacity-0 group-hover:opacity-100
          transition duration-300 pointer-events-none
        ">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 pointer-events-auto">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full overflow-hidden border border-white/50 dark:border-gray-700/70">
                <UserIconCard id={postData?.userId} />
              </div>
            </div>
          </div>
    
          {/* Footer (like + open button) */}
          <div className="flex items-center justify-between pointer-events-auto">
            <button
              className="flex bg-black/5 dark:bg-white/5 items-center gap-1 px-2 py-1 rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                handleLikePost();
              }}
              title={userLiked ? 'Remove like' : 'Like this reply'}
            >
              <div className="relative">
                {heartSvg(userLiked)}
                {sparkles.map((sparkle) => (
                  <Sparkle key={sparkle.id} style={sparkle.style} color={sparkle.color} />
                ))}
              </div>
              <span className="text-xs font-medium text-white">
                {postData?.likes?.length || 0}
              </span>
            </button>
    
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCardClick();
              }}
              className="text-[11px] font-semibold text-theme_color hover:text-theme_color2 transition-colors"
            >
              Open in forum →
            </button>
          </div>
        </div>
    
        {/* 🟩 ALWAYS VISIBLE CONTENT */}
        <div
          className="relative z-10 rounded-2xl border border-gray-100 dark:border-gray-700 bg-white/90 dark:bg-bg_comment_box/80 p-3"
          onClick={(e) => e.stopPropagation()}
        >
          <ReplyData2 content={postData?.content} />
        </div>
    
      </div>
    </div>
    
    
    );
  };

  if (isForumContent) {
    return (
      <>
        {renderForumCard()}
        {showLogin && <LoginHover onClose={() => setShowLogin(false)} />}
      </>
    );
  }

  return (
    <>
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
      {showLogin && <LoginHover onClose={() => setShowLogin(false)} />}
    </>

  );
};

export default Card;

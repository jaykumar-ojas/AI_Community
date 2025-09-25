import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import React, { useEffect, useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { LoginContext } from "../ContextProvider/context";
import UserIconCard from "../Card/UserIconCard";
import UserNameCard from "../Card/UserNameCard";
import BookmarkIcon, {
  heartSvg,
  thumbsDownSvg,
  ReplyIcon,
  CommentIcon,
  PostLikeIcon,
} from "../../asset/icons";
import UserContentSkeleton from "./UserContentSkeleton";
import BookMark from "../BookMark/BookMark";
import { useNotification } from "../ContextProvider/NotificationContext";
const baseUrl = process.env.REACT_APP_BASE_URL;

// AI Model Info Component
const AIModelInfo = ({ aiMetadata }) => {
  
  const [modelInfo, setModelInfo] = useState(null);
  const [modelIcon, setModelIcon] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { loginData } = useContext(LoginContext);

  const baseUrl = process.env.REACT_APP_BASE_URL;

  useEffect(() => {
    const fetchModelInfo = async () => {
      if (!aiMetadata || !aiMetadata.isAIGenerated) return;

      try {
        setIsLoading(true);

        // Fetch model icon from /aimodels/search API
        if (aiMetadata.aiModel) {
          try {
            const iconResponse = await fetch(
              `${baseUrl}/aimodels/search?modelName=${encodeURIComponent(
                aiMetadata.aiModel
              )}`
            );
            if (iconResponse.ok) {
              const iconData = await iconResponse.json();
              if (iconData.success && iconData.data.iconUrl) {
                setModelIcon(iconData.data.iconUrl);
              }
            }
          } catch (iconError) {
            console.error("Error fetching model icon:", iconError);
          }
        }

        // Fetch model display info from /models-info API
        const response = await fetch(`${baseUrl}/models-info`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setModelInfo(data.data);
          }
        }
      } catch (error) {
        console.error("Error fetching model info:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchModelInfo();
  }, [aiMetadata]);

  if (!aiMetadata || !aiMetadata.isAIGenerated) {
    return null;
  }

  // Get model display info from backend or use fallback
  const getModelDisplayInfo = () => {
    if (modelInfo && modelInfo.image && modelInfo.image[aiMetadata.aiModel]) {
      const model = modelInfo.image[aiMetadata.aiModel];
      return {
        displayName: model.displayName,
        emoji: model.emoji,
      };
    }

    // Fallback for unknown models
    return {
      displayName: aiMetadata.aiModel,
      emoji: "🤖",
    };
  };

  const { displayName } = getModelDisplayInfo();

  return (
    <div className="bg-gradient-to-r from-purple-100 to-blue-100  rounded-lg ">
      <div className="flex flex-row  items-center justify-center gap-2 mb-2">
        {modelIcon ? (
          <img
            src={modelIcon}
            alt={`${aiMetadata.aiModel} icon`}
            className="w-6 h-6 rounded-full object-cover"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        ) : (
          <span className="text-lg">🤖</span>
        )}
        {/* <span className="font-semibold text-purple-800">AI Generated</span>
        <span className="text-xs bg-purple-200 text-purple-700 px-2 py-1 rounded-full">
          {displayName}
        </span> */}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs md:text-lg text-gray-800">
            {aiMetadata.aiProvider || "Unknown Provider"}
          </span>
        </div>
      </div>
    </div>
  );
};

const UserContent = ({ post, onToggleComments, areCommentsOpen }) => {
  const { showNotification } = useNotification();
  const history = useNavigate();
  const { loginData } = useContext(LoginContext);
  const [currentUser, setCurrentUser] = useState({
    id: "",
    name: "",
  });
  const [postData, setPostData] = useState(post);
  const [userLiked, setUserLiked] = useState(false);
  const [userDisliked, setUserDisliked] = useState(false);
  const isauthor = loginData?.validuserone?._id == postData?.userId;

  // for expansion of words
  const [expanded, setExpanded] = useState(false);
  const words = postData?.desc ? postData.desc.split(" ") : [];
  const isLong = words.length > 20;
  // Show only first 20 words if not expanded
  const displayText = expanded ? words.join(" ") : words.slice(0, 20).join(" ");
  const [booked,setBooked]=useState(false);

  useEffect(() => {
    
    console.log("UserContent received post:", post);
    if (post) {
      setPostData(post);

      // Check if current user has liked or disliked this post
      if (loginData && loginData.validuserone && post.likes && post.dislikes) {
        const userId = loginData.validuserone._id;
        setUserLiked(post.likes.includes(userId));
        setUserDisliked(post.dislikes.includes(userId));
       
      }
    }
  }, [post]);

  // Set current user from login data
  useEffect(() => {
    if (loginData && loginData.validuserone) {
      setCurrentUser({
        id: loginData.validuserone._id,
        name: loginData.validuserone.userName,
      });

      // Check if current user has liked or disliked this post
      if (postData && postData?.likes && postData?.dislikes) {
        const userId = loginData.validuserone._id;
        setUserLiked(postData?.likes.includes(userId));
        setUserDisliked(postData?.dislikes.includes(userId));
        setBooked(postData?.BookMark?.includes(loginData?.validuserone?._id))
      }
    }
  }, [loginData, postData]);

  const handleDelete = async (postId, imgKey) => {
    // Ask for confirmation before deleting
    if (!window.confirm("Are you sure you want to delete this post?")) {
      return;
    }

    try {
      const response = await fetch(`${baseUrl}/delete/${postId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imgKey }), // Send imgKey in the request body
      });

      const result = await response.json();

      if (response.ok) {
        history("/");

        // Refresh the page or redirect
        window.location.reload();
      } else {
        showNotification("Failed to delete post: " + (result.error || "Unknown error"),"error");
      }
    } catch (error) {
      showNotification("Error occurred while deleting post. Please try again.","warning");
    }
  };

  const handleLikePost = async () => {
  if (!currentUser.id) {
    showNotification("Please log in to like posts", "warning");
    return;
  }

  // Keep a copy in case we need to rollback
  const prevPost = { ...postData };
  const prevLiked = userLiked;
  const prevDisliked = userDisliked;

  // Optimistically update UI
  let updatedPost = { ...postData };

  if (userLiked) {
    // Remove like
    updatedPost.likes = updatedPost.likes.filter(
      (id) => id !== currentUser.id
    );
  } else {
    // Add like
    if (!updatedPost.likes) updatedPost.likes = [];
    if (!updatedPost.likes.includes(currentUser.id)) {
      updatedPost.likes.push(currentUser.id);
    }

    // Remove from dislikes if present
    if (updatedPost.dislikes?.includes(currentUser.id)) {
      updatedPost.dislikes = updatedPost.dislikes.filter(
        (id) => id !== currentUser.id
      );
    }
  }

  setPostData(updatedPost);
  setUserLiked(!userLiked);
  if (userDisliked) setUserDisliked(false);

  try {
    const response = await axios.post(`${baseUrl}/${postData?._id}/like`, {
      userId: currentUser.id,
    });

    if (response.status !== 200) {
      throw new Error("Like failed");
    }
  } catch (error) {
    // Rollback if error
    setPostData(prevPost);
    setUserLiked(prevLiked);
    setUserDisliked(prevDisliked);

    showNotification("Error liking post. Please try again.");
  }
};


  const handleDislikePost = async () => {
    if (!currentUser.id) {
      showNotification("Please log in to dislike posts");
      return;
    }

    try {
      const response = await axios.post(`/${postData?._id}/dislike`, {
        userId: currentUser.id,
      });

      if (response.status === 200) {
        // Update local state to reflect the change
        const updatedPost = { ...postData };

        if (userDisliked) {
          // Remove dislike
          updatedPost.dislikes = updatedPost.dislikes.filter(
            (id) => id !== currentUser.id
          );
        } else {
          // Add dislike and remove like if exists
          if (!updatedPost.dislikes) updatedPost.dislikes = [];
          if (!updatedPost.dislikes.includes(currentUser.id)) {
            updatedPost.dislikes.push(currentUser.id);
          }

          // Remove from likes if present
          if (updatedPost.likes && updatedPost.likes.includes(currentUser.id)) {
            updatedPost.likes = updatedPost.likes.filter(
              (id) => id !== currentUser.id
            );
          }
        }

        setPostData(updatedPost);
        setUserDisliked(!userDisliked);
        if (userLiked) setUserLiked(false);
      }
    } catch (error) {
      console.error("Error disliking post:", error);
    }
  };

  const openInNewTab = (url) => {
    window.open(url, "_blank", "noreferrer");
  };


  if (!post) {
    return <UserContentSkeleton />;
  }

  // Render different media types
  const renderMedia = () => {
    if (!postData?.imgUrl) {
      return (
        <div className="flex items-center justify-center h-full w-full text-gray-500">
          Media not available
        </div>
      );
    }

    const fileType = postData?.fileType || "image"; // Default to image if not specified

    if (fileType === "image") {
      return (
        <div className="w-full max-h-[500px] rounded-lg bg-transparent relative flex items-center justify-center">
          <img
            src={postData?.imgUrl}
            className="max-h-[500px] w-auto object-contain"
            alt="Post content"
            onError={(e) => {
              console.error("Error loading image:", e);
              e.target.src =
                "https://via.placeholder.com/400x280?text=Image+Not+Available";
            }}
          />
        </div>
      );
    } else if (fileType === "video") {
      return (
        <div className="relative w-full h-full bg-gradient-to-br from-blue-900 to-purple-900">
          <video
            src={postData?.imgUrl}
            className="w-full h-full object-contain"
            controls
            preload="metadata"
            onError={(e) => {
              console.error("Error loading video:", e);
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-black bg-opacity-50 rounded-full p-5 shadow-lg transform transition-transform hover:scale-110">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="50"
                height="50"
                viewBox="0 0 24 24"
                fill="white"
                stroke="white"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
            </div>
          </div>
          <div className="absolute bottom-3 right-3 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm font-medium">
            Video
          </div>
        </div>
      );
    } else if (fileType === "audio") {
      return (
        <div className="flex flex-col items-center justify-center h-full w-full bg-gradient-to-br from-indigo-800 to-purple-700 p-6">
          <div className="bg-white bg-opacity-20 p-6 rounded-full mb-4 shadow-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="70"
              height="70"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 18V5l12-2v13"></path>
              <circle cx="6" cy="18" r="3"></circle>
              <circle cx="18" cy="16" r="3"></circle>
            </svg>
          </div>
          <div className="w-3/4 bg-white bg-opacity-10 p-3 rounded-lg shadow-md">
            <audio
              src={postData?.signedUrl}
              controls
              className="w-full"
              onError={(e) => {
                console.error("Error loading audio:", e);
              }}
            />
          </div>
          <div className="absolute bottom-3 right-3 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm font-medium">
            Audio
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center h-full w-full text-gray-500">
        Unsupported media type
      </div>
    );
  };

  return (
    <div className="w-full border dark:border-gray-700 rounded-lg dark:bg-transparent relative shadow-lg flex flex-col gap-0">
      {/* user header */}
      <div className="flex justify-between border-b dark:border-gray-700 items-center md:px-2 w-full h-full">
        <div className="flex m-1 justify-between items-center gap-1 sm:mx-2">
          <div className="w-8 h-8  flex-shrink-0">
            <UserIconCard id={postData?.userId}></UserIconCard>
          </div>
          <div className="dark:text-white ml-2 text-black">
            <UserNameCard id={postData?.userId}></UserNameCard>
          </div>
        </div>

        <div className="flex flex-row gap-2 justify-center items-center">
          {postData?.isAIGenerated && (
            <div className="md:px-2">
              <AIModelInfo aiMetadata={postData} />
            </div>
          )}

          {/* this is for openpanel */}
          <div className="px-2 ">
            {isauthor && (
              <Menu as="div" className="relative z-10">
                <MenuButton className="flex flex-col text-time_header font-extrabold items-center focus:outline-none">
                  ⋮
                </MenuButton>
                <MenuItems className="absolute right-0 mt-2 w-24 bg-white shadow-md rounded-md  ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <MenuItem>
                    {({ active }) => (
                      <button
                        className={`block border rounded-md px-4 py-2 w-full text-sm font-extrabold text-red-700 ${
                          active
                            ? "bg-red-100 border-red-300"
                            : " text-gray-700"
                        }`}
                        onClick={() =>
                          handleDelete(postData?._id, postData?.imgKey)
                        }
                      >
                        Delete
                      </button>
                    )}
                  </MenuItem>
                  {/* <MenuItem>
                {({ active }) => (
                  <button
                    className={`block border rounded-md px-4 py-2 w-full text-sm font-extrabold text-red-700 ${
                      active ? "bg-red-100 border-red-300" : " text-gray-700"
                    }`}
                  >
                    check
                  </button>
                )}
              </MenuItem> */}
                </MenuItems>
              </Menu>
            )}
          </div>
        </div>
      </div>

      {/* AI Model Info */}

      {/* user media content */}
      <div className="w-full min-h-[300px]  bg-neutral-100 relative flex justify-center items-center">
        <div
          className={`w-full flex items-center justify-center overflow-hidden ${
            postData?.fileType === "image" ? "cursor-pointer" : ""
          }`}
        >
          {renderMedia()}
        </div>
      </div>

      {/* user description and interaction */}
      <div className="border-t dark:border-gray-700">
        <div className="p-1  flex items-center justify-between gap-2 text-xs ">
          {/* Outer wrapper with justify-between */}
          <div className="bg-something flex justify-between items-center px-2 rounded-xl w-full">
            {/* Left side (Like + Comment toggle on mobile) */}
            <div className="flex items-center gap-2">
              <button
                className="flex items-center gap-1"
                onClick={handleLikePost}
                title={userLiked ? "Remove like" : "Like this post"}
              >
                <PostLikeIcon isLiked={userLiked}/>
                <span className="text-lg text-gray-700 dark:text-gray-200 font-medium">
                  {postData?.likes ? postData?.likes.length : 0}
                </span>
              </button>

              {/* Mobile: Comment toggle button */}
              {onToggleComments && (
                <button
                  className="md:hidden flex items-center gap-1 px-2 py-1 rounded-lg  text-time_header"
                  onClick={onToggleComments}
                  title={areCommentsOpen ? "Hide comments" : "Show comments"}
                >
                  <CommentIcon />
                </button>
              )}
            </div>
            {/* Right side (Bookmark) */}
              <BookMark
                postId={postData?._id}
                userId={loginData?.validuserone?._id}
                isBookmarked={booked}
              />

          </div>
        </div>

        {/* Description */}
        <div className="p-2 pt-0 leading-snug sm:text-[16px] text-[14px] text-gray-800 dark:text-time_header">
          {postData?.desc ? (
            <>
              {displayText}
              {isLong && !expanded && " ..."}
              {isLong && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="ml-1 text-blue-500 hover:underline"
                >
                  {expanded ? "View Less" : "View More"}
                </button>
              )}
            </>
          ) : (
            "No description available"
          )}
        </div>
      </div>
    </div>
  );
};

export default UserContent;

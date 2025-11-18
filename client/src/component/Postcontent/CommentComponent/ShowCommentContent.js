import React, { useContext, useEffect, useState } from "react";
import { LoginContext } from "../../ContextProvider/context";
import axios from "axios";
import {
  formatDate,
  getAuthHeaders,
  handleAuthError,
  REPLIES_URL,
  API_BASE_URL,
} from "../../AiForumPage/components/ForumUtils";
import { useWebSocket } from "../../AiForumPage/components/WebSocketContext";
import { useParams } from "react-router-dom";
import { ForumContext } from "../../ContextProvider/ModelContext";
import ShowMedia from "../../TopicComponent/components/ShowMedia";
import UserIconCard from "../../Card/UserIconCard";
import {
  UpvoteIcon,
  DownvoteIcon,
  ReplyIcon,
  DeleteIcon,
} from "../../../asset/icons";
import ReplyData from "../../Card/ReplyData";
import { CommentContext } from "../../ContextProvider/CommentModelContext";
import LikeDislike from "../../Card/LikeDislike";
import ShareFile from "../../Share/ShareFile";
import UserNameCard from "../../Card/UserNameCard";
import LikeDislike2 from "../../Card/LikeDislike2";


const ModelIcon = ({ modelName, name=true }) => {
  const [iconUrl, setIconUrl] = useState(null);

  useEffect(() => {
    if (!modelName) return;
    const fetchIcon = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/aimodels/search?modelName=${encodeURIComponent(
            modelName
          )}`
        );
        if (response.data.success) {
          setIconUrl(response.data.data.iconUrl);
        }
      } catch (err) {
        setIconUrl(null);
      }
    };
    fetchIcon();
  }, [modelName]);

  if (!iconUrl) return null;
  return (
    <div className="flex items-center gap-1 bg-black-50 px-2 py-1 rounded-md">
      <img
        src={iconUrl}
        alt={modelName}
        className="w-4 h-4 md:w-6 md:h-6 rounded-full"
        // style={{ width: 24, height: 24, borderRadius: "50%" }}
      />
      {name && <span className="text-xs text-blue-700 font-medium">{modelName}</span>}
    </div>
  );
};

const ShowCommentContent = ({ reply }) => {
  const { setReplyIdForContext, setViewBox, setUserName } =
    useContext(CommentContext);
  const [isOpen, setIsOpen] = useState(false);
  const { emitCommentReaction, emitDeleteComment } = useWebSocket();
  const { loginData } = useContext(LoginContext);
  const [isLiked, setIsLiked] = useState();
  const [isDisliked, setIsDisLiked] = useState();
  const [isAuthor, setIsAuthor] = useState(false);
  const [replyLikes, setReplyLikes] = useState([]);
  const [replyDislikes, setReplyDislikes] = useState([]);
  const [error, setError] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);
  const getTrimmedContent = (text, wordLimit = 100) => {
    const words = text.split(" ");
    if (words.length <= wordLimit) return text;
    return words.slice(0, wordLimit).join(" ") + "...";
  };
  const baseUrl = process.env.REACT_APP_BASE_URL;
  const [modelNameArray,setModelNameArray]=useState([]);
  

  useEffect(() => {
    if (reply) {
      setReplyLikes(reply?.likes);
      setReplyDislikes(reply?.dislikes);
      
      const models = getAllModelNames();
      setModelNameArray(models);
    }
  }, [reply]);

  useEffect(() => {
    if (loginData?.validuserone?._id) {
      setIsLiked(replyLikes?.includes(loginData.validuserone._id));
      setIsDisLiked(replyDislikes?.includes(loginData.validuserone._id));
      setIsAuthor(reply?.userId === loginData?.validuserone._id);
    }
  }, [replyLikes, replyDislikes, loginData]);

  const getAllModelNames = () => {
    if (Array.isArray(reply?.content)) {
      return reply.content
        .filter(item => item.model) // keep only items with a model
        .map(item => item.model);   // extract model names
    }
    return [];
  };

  const handleDeleteReply = async () => {
    if (!loginData || !loginData.validuserone) {
      setError("You must be logged in to delete a reply");
      return;
    }

    // Ask for confirmation before deleting
    if (
      !window.confirm(
        "Are you sure you want to delete this reply? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setIsLoading(true);

      // Call the delete API - backend will handle soft delete and recursive deletion
      const response = await axios.delete(`${baseUrl}/comments/${reply?._id}`, {
        headers: getAuthHeaders(),
      });

      if (response.status === 200) {
        // Emit delete comment event through WebSocket
        emitDeleteComment(reply._id, reply.postId);
      }
    } catch (error) {
      console.error("Error deleting reply:", error);
      if (!handleAuthError(error, setError)) {
        if (error.response && error.response.status === 403) {
          setError("You are not authorized to delete this reply");
        } else {
          setError("Failed to delete reply. Please try again.");
        }
      }
    } finally {
      setIsLoading(false);
    }
  };




 const handleReplyLike = async () => {
  if (!loginData || !loginData.validuserone) {
    alert("Please log in to like replies");
    return;
  }

  const userId = loginData.validuserone._id;

  // 1) snapshot current state
  const prevLikes = [...replyLikes];
  const prevDislikes = [...replyDislikes];
  const prevIsLiked = isLiked;
  const prevIsDisLiked = isDisliked;

  // 2) optimistic update
  const willBeLiked = !replyLikes.includes(userId);

  const optimisticLikes = willBeLiked
    ? [...replyLikes, userId]
    : replyLikes.filter((id) => id !== userId);

  const optimisticDislikes = replyDislikes.filter((id) => id !== userId);

  setReplyLikes(optimisticLikes);
  setReplyDislikes(optimisticDislikes);
  setIsLiked(willBeLiked);
  setIsDisLiked(false);

  // 3) API call
  try {
    const response = await axios.post(
      `${baseUrl}/comments/${reply._id}/like`,
      {},
      { headers: getAuthHeaders() }
    );

    if (response.status === 200) {
      // SUCCESS → do nothing (optimistic UI stays)
      
      // Emit with optimistic state (or server state if you want)
      emitCommentReaction({
        commentId: reply._id,
        postId: reply.postId,
        likes: optimisticLikes,
        dislikes: optimisticDislikes,
      });

      return;
    }

    throw new Error("Unexpected response");
  } catch (err) {
    console.error("Error liking reply:", err);

    // 4) rollback on error
    setReplyLikes(prevLikes);
    setReplyDislikes(prevDislikes);
    setIsLiked(prevIsLiked);
    setIsDisLiked(prevIsDisLiked);

    if (!handleAuthError(err, setError)) {
      setError("Failed to like reply. Please try again.");
    }
  }
};


const handleReplyDislike = async () => {
  if (!loginData || !loginData.validuserone) {
    alert("Please log in to dislike replies");
    return;
  }
  if (!reply?._id) return;

  const userId = loginData.validuserone._id;

  // 1) snapshot current state
  const prevLikes = [...replyLikes];
  const prevDislikes = [...replyDislikes];
  const prevIsLiked = isLiked;
  const prevIsDisLiked = isDisliked;

  // 2) optimistic update
  const willBeDisliked = !replyDislikes.includes(userId);

  const optimisticDislikes = willBeDisliked
    ? [...replyDislikes, userId]
    : replyDislikes.filter((id) => id !== userId);

  const optimisticLikes = replyLikes.filter((id) => id !== userId);

  setReplyDislikes(optimisticDislikes);
  setReplyLikes(optimisticLikes);
  setIsDisLiked(willBeDisliked);
  setIsLiked(false);

  // 3) API call
  try {
    const res = await axios.post(
      `${baseUrl}/comments/${reply._id}/dislike`,
      {},
      { headers: getAuthHeaders() }
    );

    if (res?.status === 200) {
      // success — keep optimistic UI and emit reaction
      emitCommentReaction({
        commentId: reply._id,
        postId: reply.postId,
        likes: optimisticLikes,
        dislikes: optimisticDislikes,
      });
      return;
    }

    throw new Error("Unexpected server response");
  } catch (err) {
    console.error("Error disliking reply:", err);

    // 4) rollback on failure
    setReplyLikes(prevLikes);
    setReplyDislikes(prevDislikes);
    setIsLiked(prevIsLiked);
    setIsDisLiked(prevIsDisLiked);

    if (!handleAuthError(err, setError)) {
      setError("Failed to dislike reply. Please try again.");
    }
  }
};


  // Helper to extract first model name from comment content
  const getFirstModelName = () => {
    if (Array.isArray(reply?.content)) {
      for (const item of reply.content) {
        if (item.model) return item.model;
      }
    }
    return null;
  };
  const firstModelName = getFirstModelName();
  const isDeleted = reply?.userName === 'deleted' && !reply?.userId;

  return (
    <div key={reply?._id} className={`relative flex justify-start ${isDeleted ? 'opacity-60' : ''}`}>
      <div className="w-8 h-8 flex-shrink-0 z-20">
        {isDeleted ? (
          <div className="w-8 h-8 relative z-10  rounded-full bg-gray-300  flex items-center justify-center text-xs text-gray-600 cursor-not-allowed">
            !
          </div>
        ) : (
          <UserIconCard id={reply?.userId} />
        )}
      </div>
      {/* user icon outside */}

      <div className="flex flex-col md: p-1 px-2 pt-0 w-full md:mb-2 mb-1">
        <div className="flex items-center justify-between">
          <div className="flex justify-start items-center">
            <div className={`font-normal mr-2 text-sm ${isDeleted ? 'text-gray-500 italic' : 'text-black dark:text-text_header'}`}>
              <UserNameCard id={reply?.userId} size={6}/> 
            </div>
            <div className="mr-2 flex justify-center items-center">
              <div className="w-1 h-1 mr-1 rounded-full bg-time_header"></div>
              <div className="text-time_header font-thin text-xs">
              {formatDate(reply?.createdAt)}
            </div>
            </div>
            
          </div>
          {/* Move ModelIcon to the right corner, after the delete button */}
          <div className="flex items-center justify-center gap-2">
            {modelNameArray.map((modelName, index) => (
            <div
              key={index}
              className={index === 0 ? "ml-0" : "-ml-8"} // overlap only after first
            >
              <ModelIcon modelName={modelName} name={false} />
            </div>
          ))}
            <ShareFile h={16} w={16} id={reply?._id} type={"postThread"} text={reply?.content[0]?.userText.slice(0,200)}/>

            {isAuthor && !isDeleted && (
              <div className="relative">
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="px-1 py-0 text-gray-600 dark:text-time_header hover:bg-gray-300 hover:bg-btn_bg rounded-full"
                >
                  ⋮
                </button>
                {/* Dropdown menu */}
                {isOpen && (
                  <div className="absolute -left-1/2 -translate-x-1/2 w-full shadow-lg rounded-md z-10">
                    <button
                      onClick={() => {
                        handleDeleteReply();
                        setIsOpen(false);
                      }}
                      className="w-full px-4 py-2  dark:bg-bg_comment_box  text-red-600 hover:bg-gray-300 hover:dark:bg-gray-800"
                    >
                      <DeleteIcon />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div>
          <ReplyData content={reply?.content} />
          {/* Display media attachments */}
          {reply?.mediaAttachments?.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {reply?.mediaAttachments.map((attachment, index) => (
                <div
                  key={index}
                  className="w-full h-full rounded-md overflow-hidden border border-gray-200 shadow-sm"
                >
                  <ShowMedia attachment={attachment} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-1 flex items-center gap-2 text-xs text-black dark:text-gray-500">
          <LikeDislike2 topic={reply} like={handleReplyLike} dislike={handleReplyDislike} isLiked={isLiked} isDisliked={isDisliked} likeCount={replyLikes?.length} dislikeCount={replyDislikes?.length}/>
          {!isDeleted && (
            <button
              // onClick={() => setShowReplyBox(true)}
              onClick={() => {
                setReplyIdForContext(reply?._id);
                setUserName(reply?.userName);
                setViewBox(true);
              }}
              className="flex items-center gap-1  text-theme_color4 hover:text-theme_color transition"
            >
              <ReplyIcon />

              <div className="text-xs">Reply</div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShowCommentContent;

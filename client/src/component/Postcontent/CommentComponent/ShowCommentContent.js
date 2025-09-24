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


const ModelIcon = ({ modelName }) => {
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
      <span className="text-xs text-blue-700 font-medium">{modelName}</span>
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

  useEffect(() => {
    if (reply && loginData) {
      setReplyLikes(reply?.likes);
      setReplyDislikes(reply?.dislikes);
      setIsAuthor(reply?.userId === loginData?.validuserone._id);
    }
  }, [reply, loginData]);

  useEffect(() => {
    if (loginData?.validuserone?._id) {
      setIsLiked(replyLikes?.includes(loginData.validuserone._id));
      setIsDisLiked(replyDislikes?.includes(loginData.validuserone._id));
    }
  }, [replyLikes, replyDislikes, loginData]);

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

    try {
      const response = await axios.post(
        `${baseUrl}/comments/${reply?._id}/like`,
        {},
        {
          headers: getAuthHeaders(),
        }
      );

      if (response.status === 200) {
        const updatedLikes = response.data.liked
          ? [...replyLikes, loginData.validuserone._id]
          : replyLikes.filter((id) => id !== loginData.validuserone._id);
        const updatedDislikes = replyDislikes.filter(
          (id) => id !== loginData.validuserone._id
        );

        setReplyLikes(updatedLikes);
        setReplyDislikes(updatedDislikes);
        setIsLiked(!isLiked);
        setIsDisLiked(false);

        // Emit the reaction through WebSocket
        emitCommentReaction({
          commentId: reply._id,
          postId: reply.postId,
          likes: updatedLikes,
          dislikes: updatedDislikes,
        });
      }
    } catch (error) {
      console.error("Error liking reply:", error);
      if (!handleAuthError(error, setError)) {
        setError("Failed to like reply. Please try again.");
      }
    }
  };

  const handleReplyDislike = async () => {
    if (!loginData || !loginData.validuserone) {
      alert("Please log in to dislike replies");
      return;
    }

    try {
      const response = await axios.post(
        `${baseUrl}/comments/${reply?._id}/dislike`,
        {},
        {
          headers: getAuthHeaders(),
        }
      );

      if (response.status === 200) {
        const updatedDislikes = response.data.disliked
          ? [...replyDislikes, loginData.validuserone._id]
          : replyDislikes.filter((id) => id !== loginData.validuserone._id);
        const updatedLikes = replyLikes.filter(
          (id) => id !== loginData.validuserone._id
        );

        setReplyDislikes(updatedDislikes);
        setReplyLikes(updatedLikes);
        setIsDisLiked(!isDisliked);
        setIsLiked(false);

        // Emit the reaction through WebSocket
        emitCommentReaction({
          commentId: reply._id,
          postId: reply.postId,
          likes: updatedLikes,
          dislikes: updatedDislikes,
        });
      }
    } catch (error) {
      console.error("Error disliking reply:", error);
      if (!handleAuthError(error, setError)) {
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
      <div className="w-8 h-8 flex-shrink-0">
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
              {reply?.userName}
            </div>
            <div className="mr-2 flex justify-center items-center">
              <div className="w-1 h-1 mr-1 rounded-full bg-time_header"></div>
              <div className="text-time_header font-thin text-xs">
              {formatDate(reply?.createdAt)}
            </div>
            </div>
            
          </div>
          {/* Move ModelIcon to the right corner, after the delete button */}
          <div className="flex items-center gap-2">
            {firstModelName && !isDeleted && (
              <div className="ml-2">
                <ModelIcon modelName={firstModelName} />
              </div>
            )}

            {isAuthor && !isDeleted && (
              <div className="relative">
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="px-1 py-0 text-gray-600 dark:text-time_header hover:bg-btn_bg rounded-full"
                >
                  ⋮
                </button>
                {/* Dropdown menu */}
                {isOpen && (
                  <div className="absolute left-0 w-full bg-white shadow-lg rounded-md z-10">
                    <button
                      onClick={() => {
                        handleDeleteReply();
                        setIsOpen(false);
                      }}
                      className="w-full p-2 bg-bg_comment_box text-red-600 hover:bg-btn_bg"
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
            <div className="pt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
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
          <LikeDislike topic={reply} like={handleReplyLike} dislike={handleReplyDislike}/>
          {!isDeleted && (
            <button
              // onClick={() => setShowReplyBox(true)}
              onClick={() => {
                setReplyIdForContext(reply?._id);
                setUserName(reply?.userName);
                setViewBox(true);
              }}
              className="flex items-center gap-1  text-like_color hover:text-like_color transition"
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

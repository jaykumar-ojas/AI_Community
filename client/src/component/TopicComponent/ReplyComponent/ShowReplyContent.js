import React, { useContext, useEffect, useState } from "react";
import { LoginContext } from "../../ContextProvider/context";
import axios from "axios";
import {
  API_BASE_URL,
  formatDate,
  getAuthHeaders,
  handleAuthError,
  REPLIES_URL,
} from "../../AiForumPage/components/ForumUtils";
import ShowMedia from "../components/ShowMedia";
import ReplyPostContent from "../components/ReplyPostContent";
import { useWebSocket } from "../../AiForumPage/components/WebSocketContext";
import { useParams } from "react-router-dom";
import { ForumContext } from "../../ContextProvider/ModelContext";
import UserIconCard from "../../Card/UserIconCard";
import {
  DeleteIcon,
  ReplyIcon,
  LikeIcon,
  DisLikeIcon,
} from "../../../asset/icons";

const ShowReplyContent = ({
  reply,
  showViewMore,
  onViewMore,
  hasChildren,
  show,
  showReply,

  setShowReply,
  onReplyDeleted, // Add this new prop
}) => {
  const { setReplyIdForContext, setViewBox, setUserName } =
    useContext(ForumContext);
  const { topicId } = useParams();
  const { emitDeleteReply } = useWebSocket();
  const { loginData } = useContext(LoginContext);
  const [isLiked, setIsLiked] = useState();
  const [isDisliked, setIsDisLiked] = useState();
  const [isAuthor, setIsAuthor] = useState(false);
  const [replyLikes, setReplyLikes] = useState([]);
  const [replyDislikes, setReplyDislikes] = useState([]);
  const [error, setError] = useState();
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false); // Add local deleted state
  const [isOpen, setIsOpen] = useState(false);

  const getTrimmedContent = (text) => {
    const words = text?.split?.(/\s+/) || [];
    return words.slice(0, 100).join(" ");
  };

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

      const response = await axios.delete(`${REPLIES_URL}/${reply?._id}`, {
        headers: getAuthHeaders(),
      });

      if (response.status === 200) {
        // Emit socket event for reply deletion
        emitDeleteReply(reply?._id, topicId);

        // Immediately update UI by calling parent's delete handler
        if (onReplyDeleted) {
          onReplyDeleted(reply._id);
        }

        // Set local deleted state for immediate UI feedback
        setIsDeleted(true);

        // If this reply has children, emit delete events for them as well
        if (reply.children && reply.children.length > 0) {
          const emitDeleteForChildren = (children) => {
            children.forEach((child) => {
              // Emit delete event for each child
              emitDeleteReply(child._id, topicId);
              // Call parent's delete handler for each child
              if (onReplyDeleted) {
                onReplyDeleted(child._id);
              }
              // Recursively handle grandchildren
              if (child.children && child.children.length > 0) {
                emitDeleteForChildren(child.children);
              }
            });
          };

          emitDeleteForChildren(reply.children);
        }
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

  // Handle reply like
  const handleReplyLike = async () => {
    if (!loginData || !loginData.validuserone) {
      alert("Please log in to like replies");
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/forum/replies/${reply?._id}/like`,
        {},
        {
          headers: getAuthHeaders(),
        }
      );

      if (response.status === 200) {
        setReplyLikes(
          response.data.liked
            ? [...replyLikes, loginData.validuserone._id]
            : replyLikes.filter((id) => id !== loginData.validuserone._id)
        );
        setReplyDislikes(
          replyDislikes.filter((id) => id !== loginData.validuserone._id)
        );
        setIsLiked(!isLiked);
        setIsDisLiked(!isDisliked);
      }
    } catch (error) {
      console.error("Error liking reply:", error);
      if (!handleAuthError(error, setError)) {
        setError("Failed to like reply. Please try again.");
      }
    }
  };

  // Handle reply dislike
  const handleReplyDislike = async (replyId) => {
    if (!loginData || !loginData.validuserone) {
      alert("Please log in to dislike replies");
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/forum/replies/${reply?._id}/dislike`,
        {},
        {
          headers: getAuthHeaders(),
        }
      );
      if (response.status === 200) {
        setReplyDislikes(
          response.data.disliked
            ? [...replyDislikes, loginData.validuserone._id]
            : replyDislikes.filter((id) => id !== loginData.validuserone._id)
        );
        setReplyLikes(
          replyLikes.filter((id) => id !== loginData?.validuserone._id)
        );
        setIsDisLiked(!isDisliked);
        setIsLiked(!isLiked);
      }
    } catch (error) {
      console.error("Error disliking reply:", error);
      if (!handleAuthError(error, setError)) {
        setError("Failed to dislike reply. Please try again.");
      }
    }
  };

  // Don't render if deleted (immediate UI feedback)
  if (isDeleted) {
    return (
      <div className="p-4 text-center text-gray-500 bg-gray-100 rounded-xl border border-gray-200">
        <span className="text-sm">This reply has been deleted</span>
      </div>
    );
  }

  return (
    <div key={reply?._id} className="flex justify-start mb-4">
      {/* User Icon Outside */}
      <div className="w-8 h-8 flex-shrink-0">
        <UserIconCard id={reply?.userId} />
      </div>

      {/* Content Section */}
      <div className="flex flex-col p-4 pt-0 ml-2 rounded-xl  w-full">
        {/* User Info & Delete Button */}

        <div className="flex items-center justify-between">
          <div className="flex justify-start items-center gap-2 text-sm text-gray-700">
            <span className="text-text_header text-sm font-normal text-base">
              {reply?.userName}
            </span>
            <div className="w-1 h-1 bg-time_header rounded-full"></div>

            <span className="text-time_header text-xs">
              {formatDate(reply?.createdAt)}
            </span>
          </div>

          {isAuthor && (
            <div className="ml-2 relative">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="px-1 py-0 text-time_header hover:bg-btn_bg rounded-full"
              >
                ⋯
              </button>

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

        {/* Reply Content */}
        <div className="pt-2 text-sm text-text_content whitespace-pre-wrap leading-relaxed">
          {showFullContent ? reply?.content : getTrimmedContent(reply?.content)}
          {reply?.content?.length > 100 && (
            <button
              onClick={() => setShowFullContent(!showFullContent)}
              className="ml-2 text-blue-600 hover:underline font-medium"
            >
              {showFullContent ? "View Less" : "View More"}
            </button>
          )}
        </div>

        {/* Media Attachments */}
        {reply?.mediaAttachments?.length > 0 && (
          <div className="pt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {reply?.mediaAttachments.map((attachment, index) => (
              <div
                key={index}
                className="w-full h-full rounded-3xl overflow-hidden border border-gray-200 shadow-sm"
              >
                <ShowMedia attachment={attachment} />
              </div>
            ))}
          </div>
        )}

        {/* Actions Section */}
        <div className="pt-4 flex items-center gap-2 text-xs text-gray-500">
          <div className="bg-btn_bg flex p-1 px-2 rounded-xl gap-2">
            <button
              onClick={handleReplyLike}
              className={`flex items-center gap-1 hover:text-like_color transition ${
                isLiked && "text-like_color"
              }`}
            >
              <LikeIcon isLiked={isLiked} />
              {replyLikes?.length || 0}
            </button>

            <button
              onClick={handleReplyDislike}
              className={`flex items-center gap-1 hover:text-red-600 transition ${
                isDisliked && "text-red-600"
              }`}
            >
              <DisLikeIcon isDisliked={isDisliked} />
              {replyDislikes?.length || 0}
            </button>
          </div>

          <button
            onClick={() => {
              setReplyIdForContext(reply?._id);
              setUserName(reply?.userName);
              setViewBox(true);
            }}
            className="flex items-center gap-1 text-like_color hover:text-like_color transition"
          >
            <ReplyIcon />
            <div className="text-xs">Reply</div>
          </button>
        </div>

        {/* Conditional Reply Buttons */}
        {hasChildren && show && !showReply && (
          <button
            onClick={() => setShowReply(!showReply)}
            className="text-xs text-blue-500 hover:underline mt-2"
          >
            view more replies...
          </button>
        )}

        {showViewMore && (
          <div className="mt-2">
            <button
              onClick={onViewMore}
              className="text-xs text-blue-500 hover:underline"
            >
              View more replies...
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShowReplyContent;

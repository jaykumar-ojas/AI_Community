import React, { useContext, useEffect, useState } from "react";
import { LoginContext } from "../../ContextProvider/context";
import axios from "axios";
import {
  formatDate,
  getAuthHeaders,
  handleAuthError,
  REPLIES_URL,
} from "../../AiForumPage/components/ForumUtils";
import { useWebSocket } from "../../AiForumPage/components/WebSocketContext";
import { useParams } from "react-router-dom";
import { ForumContext } from "../../ContextProvider/ModelContext";
import ShowMedia from "../../TopicComponent/components/ShowMedia";
import UserIconCard from "../../Card/UserIconCard";
import {
  LikeIcon,
  DisLikeIcon,
  ReplyIcon,
  DeleteIcon,
} from "../../../asset/icons";

const ShowCommentContent = ({
  reply,
  showViewMore,
  onViewMore,
  hasChildren,
  show,
  showReply,
  setShowReply,
}) => {
  const { setReplyIdForContext, setViewBox, setUserName } =
    useContext(ForumContext);
  const { topicId } = useParams();
  const [isOpen,setIsOpen] = useState(false);
  const { emitDeleteReply } = useWebSocket();
  const { loginData } = useContext(LoginContext);
  const [isLiked, setIsLiked] = useState();
  const [isDisliked, setIsDisLiked] = useState();
  const [isAuthor, setIsAuthor] = useState(false);
  const [replyLikes, setReplyLikes] = useState([]);
  const [replyDislikes, setReplyDislikes] = useState([]);
  const [error, setError] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);
  const getTrimmedContent = (text) => {
    const words = text.split(/\s+/);
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
    alert("i am goind to delete");
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

      const response = await axios.delete(
        `http://localhost:8099/comments/${reply?._id}`,
        {
          headers: getAuthHeaders(),
        }
      );

      if (response.status === 200) {
        // Emit socket event for reply deletion
        console.log("i emitting reply");
        emitDeleteReply(reply?._id, topicId);
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
        `http://localhost:8099/comments/${reply?._id}/like`,
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
        `http://localhost:8099/comments/${reply?._id}/dislike`,
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
  return (
    <div key={reply?._id} className="flex justify-start">
      {/* user icon outside */}
      <div className="w-8 h-8 flex-shrink-0">
        <UserIconCard id={reply?.userId} />
      </div>

      <div className="flex flex-col p-4 pt-0 mb-2">
        <div className="flex items-center justify-between">
          <div className="flex justify-start items-center">
             <div className="text-text_header font-normal mr-2 text-lg">
            {reply?.userName}
          </div>
          <div className="mr-2 item-center justify-center">
            <div className="w-1 h-1 rounded-full bg-time_header"></div>
          </div>
          <div className="text-time_header font-thin text-sm">
            {formatDate(reply?.createdAt)}
          </div>
          </div>
         

          {isAuthor && (
            <div className="ml-2 relative">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="px-1 py-0 text-time_header hover:bg-btn_bg rounded-full"
              >
                ⋯
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
                    <DeleteIcon/>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <div className="pt-2 text-md text-text_content whitespace-pre-wrap leading-relaxed">
            {showFullContent
              ? reply?.content
              : getTrimmedContent(reply?.content)}
            {reply?.content?.split(/\s+/).length > 100 && (
              <button
                onClick={() => setShowFullContent(!showFullContent)}
                className="ml-2 text-blue-600 hover:underline font-medium"
              >
                {showFullContent ? "View Less" : "View More"}
              </button>
            )}
          </div>

          {/* Display media attachments */}
          {reply?.mediaAttachments?.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {reply?.mediaAttachments.map((attachment, index) => (
                <div
                  key={index}
                  className="rounded-md overflow-hidden border border-gray-200 shadow-sm"
                >
                  <ShowMedia attachment={attachment} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-4 flex items-center gap-2 text-xs text-gray-500">
          <div className="bg-btn_bg flex p-1 px-2 rounded-xl gap-2">
            <button
              onClick={handleReplyLike}
              className={`flex items-center gap-0.5 hover:text-like_color transition ${
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
            // onClick={() => setShowReplyBox(true)}
            onClick={() => {
              setReplyIdForContext(reply?._id);
              setUserName(reply?.userName);
              setViewBox(true);
            }}
            className="flex items-center gap-1  text-like_color hover:text-like_color transition"
          >
            <ReplyIcon />

            <div className="text-sm">Reply</div>
          </button>
        </div>

        {hasChildren && show && !showReply && (
          <button
            onClick={() => setShowReply(!showReply)}
            className="text-sm text-blue-500 hover:underline"
          >
            view more replies...
          </button>
        )}
        {showViewMore && (
          <div className="mt-2">
            <button
              onClick={onViewMore}
              className="text-sm text-blue-500 hover:underline"
            >
              View more replies...
            </button>
          </div>
        )}
      </div>

      {/* lower button section */}
    </div>
  );
};

export default ShowCommentContent;

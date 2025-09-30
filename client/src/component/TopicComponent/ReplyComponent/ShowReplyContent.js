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
import { useWebSocket } from "../../AiForumPage/components/WebSocketContext";
import { useParams } from "react-router-dom";
import { ForumContext } from "../../ContextProvider/ModelContext";
import UserIconCard from "../../Card/UserIconCard";
import {useNotification} from "../../ContextProvider/NotificationContext";

import {
  DeleteIcon,
  ReplyIcon,
  LikeIcon,
  DisLikeIcon,
  UpvoteIcon,
  DownvoteIcon,
} from "../../../asset/icons";
import ReplyData from "../../Card/ReplyData";
import LikeDislike from "../../Card/LikeDislike";
import ShareFile from "../../Share/ShareFile";

// Add ModelIcon component
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
  const {showNotification} = useNotification();
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
  const [modelNameArray,setModelNameArray]=useState([]);

  const getTrimmedContent = (text) => {
    const words = text?.split?.(/\s+/) || [];
    return words.slice(0, 100).join(" ");
  };

  useEffect(() => {
    if (reply && loginData) {
      setReplyLikes(reply?.likes);
      setReplyDislikes(reply?.dislikes);
      setIsAuthor(reply?.userId === loginData?.validuserone._id);
      const models = getAllModelNames();
      setModelNameArray(models);
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
      showNotification("Please log in to like replies","warning");
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
      showNotification("Please log in to dislike replies","warning");
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

  const getAllModelNames = () => {
    if (Array.isArray(reply?.content)) {
      return reply.content
        .filter(item => item.model) // keep only items with a model
        .map(item => item.model);   // extract model names
    }
    return [];
  };

  const isReplyDeleted = reply?.userName === 'deleted' && !reply?.userId;

  return (

    <div key={reply?._id} className={`flex justify-start ${isReplyDeleted ? 'opacity-100' : ''}`}>
    <div className="w-8 h-8 flex-shrink-0 z-30">
  {isReplyDeleted ? (
    <div className="w-8 h-8 relative z-10  rounded-full bg-gray-300  flex items-center justify-center text-xs text-gray-600 cursor-not-allowed">
      !
    </div>
  ) : (
    <UserIconCard id={reply?.userId} />
  )}
</div>


      {/* Content Section */}
      <div className="flex flex-col px-2 p-4 pt-0 w-full">
        {/* User Info & Delete Button */}
        <div className="flex items-center justify-between">
          <div className="flex justify-start items-center">
            <div className={`font-normal mr-2 text-[14px] md:text-[13.5px] ${isReplyDeleted ? 'text-gray-500 italic' : 'text-gray-900 dark:text-text_header'}`}>
              {reply?.userName}
            </div>
            <div className="mr-2 flex justify-center items-center">
              <div className="w-1 h-1 mr-1 rounded-full bg-gray-800 dark:bg-time_header"></div>
              <div className="text-gray-800 dark:text-time_header font-semibold text-xs">
                {formatDate(reply?.createdAt)}
              </div>
            </div>
          </div>
          {/* Move ModelIcon to the right corner, after the delete button */}
          
          <div className="flex items-center gap-2">
           {!isReplyDeleted && modelNameArray.map((modelName, index) => (
            <div
              key={index}
              className={index === 0 ? "ml-0" : "-ml-8"} // overlap only after first
            >
              <ModelIcon modelName={modelName} name={false} />
            </div>
          ))}
            <ShareFile h={16} w={16} id={reply?._id} type={"forumThread"} text={reply?.content[0]?.userText.slice(0,200)}/>
            {isAuthor && !isReplyDeleted && (
              <div className="relative">
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="px-1 py-0 text-time_header hover:bg-gray-300 hover:dark:bg-btn_bg rounded-full"
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

        {/* Reply Content */}

        <ReplyData content={reply?.content} />

        {/* Media Attachments */}
        {reply?.mediaAttachments?.length > 0 && (
          <div className="pt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {reply?.mediaAttachments.map((attachment, index) => (
              <ShowMedia key={attachment._id || attachment.id || index} attachment={attachment} />
              
            ))}
          </div>
        )}

        {/* Actions Section */}
        <div className="pt-1 flex items-center gap-2 text-xs text-gray-500">
          <LikeDislike topic={reply} like={handleReplyLike} dislike={handleReplyDislike}/>
                  {/* <div className="bg-gray-200 border border-gray-300 dark:border-none dark:bg-btn_bg flex p-1 px-2 rounded-xl gap-2">
                    <button
                      onClick={handleReplyLike}
                      disabled={isReplyDeleted}
                      className={`flex items-center gap-0.5 hover:text-like_color text-black dark:text-gray-500 transition ${
                        isLiked && "text-like_color"
                      } ${isReplyDeleted ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <UpvoteIcon isLiked={isLiked} />
                      {replyLikes?.length || 0}
                    </button>
        
                    <button
                      onClick={handleReplyDislike}
                      disabled={isReplyDeleted}
                      className={`flex items-center gap-1 hover:text-red-600 text-black dark:text-gray-500 transition ${
                        isDisliked && "text-red-600"
                      } ${isReplyDeleted ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <DownvoteIcon isDisliked={isDisliked} />
                      {replyDislikes?.length || 0}
                    </button>
                  </div> */}
                  {!isReplyDeleted && (
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

export default ShowReplyContent;

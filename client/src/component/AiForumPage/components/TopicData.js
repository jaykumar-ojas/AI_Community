import React, { useContext, useEffect, useState } from "react";
import UserJoined from "./UserJoined";
import { LoginContext } from "../../ContextProvider/context";
import {
  DisLikeIcon,
  LikeIcon,
  UpvoteIcon,
  DownvoteIcon,
  CommentIcon,
} from "../../../asset/icons";
import UserNameCard from "../../Card/UserNameCard";
import UserIconCard from "../../Card/UserIconCard";
import { EyeIcon } from "lucide-react";
import { useWebSocket } from "./WebSocketContext";
import { getAuthHeaders, TOPICS_URL } from "./ForumUtils";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../../ContextProvider/NotificationContext";
import axios from "axios";
import { encodeId } from "../../../utils/hashids";

const TopicData = ({ topic }) => {
  const navigate = useNavigate();
  const { loginData } = useContext(LoginContext);
  const { emitDeleteTopic, subscribeToEvent } = useWebSocket();
  const [openMenuId, setOpenMenuId] = useState(null);
  const [isJoined,setIsJoined] = useState(false);

  const { showNotification } = useNotification();
  const isLiked = topic.likes?.includes(loginData?.validuserone?._id);
  const isDisliked = topic.dislikes?.includes(loginData?.validuserone?._id);
  const isAuthor =
    loginData?.validuserone?._id.toString() === topic.userId.toString();
  const isAdmin = loginData?.validuserone?.role === "admin";
  const isMember = topic.joined.includes(loginData?.validuserone?._id);
  const canDelete = isAuthor || isAdmin;

  useEffect(()=>{
    if(topic){
        const isMember = topic.joined.includes(loginData?.validuserone?._id)? true: false;
        setIsJoined(isMember);
    }
  },[topic])

  const handleTopicClick = (topic, e) => {

  navigate(`/forum/topic/${encodeId(topic._id)}`);
};

  const handleDeleteTopic = async (topicId) => {
    if (!loginData || !loginData.validuserone) {
      showNotification("please login to proceed", "warning");
      return;
    }

    // Ask for confirmation before deleting
    if (
      !window.confirm(
        "Are you sure you want to delete this topic? This will also delete all replies. This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await axios.delete(`${TOPICS_URL}/${topicId}`, {
        headers: getAuthHeaders(),
      });

      if (response.status === 200) {
        // Emit socket event for topic deletion
        emitDeleteTopic(topicId);
      }
    } catch (error) {
      console.error("Error deleting topic:", error);
      if (error.response && error.response.status === 403) {
        showNotification(
          "You are not authorized to delete this topic",
          "warning"
        );
      } else {
        showNotification("Failed to delete. Please try again.", "warning");
      }
    } finally {
    }
  };

  return (
    <div
      key={topic._id}
     onClick={(e) => {
    // if click originated inside an element with class 'no-nav', don't navigate
    if (e.target.closest && e.target.closest('.no-nav')) return;
    handleTopicClick(topic, e);
  }}
      className="group relative bg-white dark:bg-nav_hover border border-gray-200 dark:border-gray-900 rounded-2xl p-3 shadow-sm hover:shadow-md hover:border-blue-400 transition-all duration-300 cursor-pointer overflow-hidden"
    >
      {/* Hover gradient overlay */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-r from-blue-500 to-purple-500 transition duration-300 rounded-2xl"></div>

      {/* Title */}
      <div className="flex justify-between items-start">
        <h2 className="text-[17px] font-semibold font-merriweather text-gray-900  dark:text-low_text line-clamp-2 group-hover:text-theme_color transition">
          {topic.title}
        </h2>

        {/* Options Menu */}
        {canDelete && (
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpenMenuId(openMenuId === topic._id ? null : topic._id);
              }}
              className="p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <circle cx="10" cy="4" r="1.5" />
                <circle cx="10" cy="10" r="1.5" />
                <circle cx="10" cy="16" r="1.5" />
              </svg>
            </button>

            {openMenuId === topic._id && (
              <div
                className="absolute right-0 mt-2 w-28 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-10"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => {
                    handleDeleteTopic(topic._id);
                    setOpenMenuId(null);
                  }}
                  className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/40 rounded-xl"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content Preview */}
      <p className="text-[13px] font-jetbrain text-gray-600 dark:text-gray-200 line-clamp-2 mb-3">
        {topic.content}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between w-full text-xs overflow-hidden">
        {/* Left Section (User + Date + Replies) */}
        <div className="flex items-center min-w-0 gap-1 overflow-hidden">
          <div className="flex-shrink-0 w-6 h-6">
            <UserIconCard id={topic?.userId} />
          </div>

          <span className="truncate max-w-[90px] sm:max-w-[120px] bg-blue-100 text-blue-700 dark:bg-nav_hover2 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium">
            <UserNameCard id={topic?.userId} hover={false} size={5} />
          </span>

          {/* <span className="bg-gray-100 text-gray-700 dark:bg-nav_hover2 dark:text-low_text px-2 py-0.5 rounded-full flex-shrink-0">
                {formatDate(topic.createdAt)}
              </span> */}

          {topic.replyCount > 0 && (
            <span className="bg-purple-100 text-purple-700 dark:bg-nav_hover2 dark:text-low_text px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0">
              {topic.replyCount} <CommentIcon h={4} w={4} />
            </span>
          )}
        </div>

        {/* Right Section (Views + Like/Dislike) */}
        <div className="">
          {/* <div className="bg-gray-100 dark:bg-nav_hover2 text-gray-700 dark:text-low_text px-2 py-0.5 rounded-full flex items-center gap-1">
            {topic.likes?.length} <Like />
          </div>
          <div className="bg-gray-100 dark:bg-nav_hover2 text-gray-700 dark:text-low_text px-2 py-0.5 rounded-full flex items-center gap-1">
            {topic?.dislikes?.length} <DisLike />
          </div> */}
          <UserJoined topic={topic} isJoined={isJoined} setIsJoined={setIsJoined} />
        </div>
      </div>
    </div>
  );
};

export default TopicData;



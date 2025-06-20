import React, { useContext, useEffect, useRef, useState } from "react";
import {
  API_BASE_URL,
  formatDate,
  getAuthHeaders,
  handleAuthError,
} from "../../AiForumPage/components/ForumUtils";
import ShowMedia from "./ShowMedia";
import { LoginContext } from "../../ContextProvider/context";
import axios from "axios";
import { ForumContext } from "../../ContextProvider/ModelContext";
import UserIconCard from "../../Card/UserIconCard";
import UserNameCard from "../../Card/UserNameCard";
import {
  ReplyIcon,
  DisLikeIcon,
  LikeIcon,
  DeleteIcon,
} from "../../../asset/icons";
import HeaderSkeleton from "./HeaderSkeleton";

const HeaderContent = ({ topic, onDelete }) => {
  const { viewBox, setViewBox, setReplyIdForContext } =
    useContext(ForumContext);
  const { loginData } = useContext(LoginContext);
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisLiked] = useState(false);
  const [isAuthor, setIsAuthor] = useState(false);
  const [topicLikes, setTopicLikes] = useState([]);
  const [topicDislikes, setTopicDislikes] = useState([]);
  const [error, setError] = useState(null);
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showToggle, setShowToggle] = useState(false);
  const contentRef = useRef();

  useEffect(() => {
    const el = contentRef.current;
    if (el.scrollHeight > el.clientHeight) {
      setShowToggle(true);
    }
  }, []);

  useEffect(() => {
    if (topic && loginData) {
      setTopicLikes(topic?.likes || []);
      setTopicDislikes(topic?.dislikes || []);
      setIsAuthor(topic?.userId === loginData?.validuserone._id);
    }
  }, [topic, loginData]);

  useEffect(() => {
    if (loginData?.validuserone?._id) {
      setIsLiked(topicLikes.includes(loginData.validuserone._id));
      setIsDisLiked(topicDislikes.includes(loginData.validuserone._id));
    }
  }, [topicLikes, topicDislikes, loginData]);

  const handleTopicLike = async () => {
    if (!loginData?.validuserone) {
      alert("Please log in to like topics");
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/forum/topics/${topic._id}/like`,
        {},
        {
          headers: getAuthHeaders(),
        }
      );

      if (response.status === 200) {
        const userId = loginData.validuserone._id;
        const liked = response.data.liked;

        setTopicLikes(
          liked
            ? [...topicLikes, userId]
            : topicLikes.filter((id) => id !== userId)
        );
        setTopicDislikes(topicDislikes.filter((id) => id !== userId));
        setIsLiked(liked);
        setIsDisLiked(false);
      }
    } catch (error) {
      console.error("Error liking topic:", error);
      if (!handleAuthError(error, setError)) {
        setError("Failed to like topic. Please try again.");
      }
    }
  };

  const handleTopicDislike = async () => {
    if (!loginData?.validuserone) {
      alert("Please log in to dislike topics");
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/forum/topics/${topic._id}/dislike`,
        {},
        {
          headers: getAuthHeaders(),
        }
      );

      if (response.status === 200) {
        const userId = loginData.validuserone._id;
        const disliked = response.data.disliked;

        setTopicDislikes(
          disliked
            ? [...topicDislikes, userId]
            : topicDislikes.filter((id) => id !== userId)
        );
        setTopicLikes(topicLikes.filter((id) => id !== userId));
        setIsDisLiked(disliked);
        setIsLiked(false);
      }
    } catch (error) {
      console.error("Error disliking topic:", error);
      if (!handleAuthError(error, setError)) {
        setError("Failed to dislike topic. Please try again.");
      }
    }
  };

  if(!topic){
    return <HeaderSkeleton/>
  }

  return (
    <div className="flex justify-start mb-0">
      {/* User Icon Outside */}
      <div className="w-8 h-8 flex-shrink-0">
        <UserIconCard id={topic?.userId} />
      </div>

      {/* Content Section */}
      <div className="flex flex-col p-4 pt-0 ml-2 rounded-xl w-full">
        {/* Header: User Info */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2  text-gray-700">
            <span className="font-normal text-sm text-text_header">
              <UserNameCard id={topic?.userId} />
            </span>
            <div className="w-1 h-1 bg-time_header rounded-full"></div>
            <span className="text-xs text-time_header">
              {formatDate(topic?.createdAt)}
            </span>
          </div>

          {isAuthor && (
            <button
              onClick={onDelete}
              className="px-1 py-0 text-time_header hover:bg-btn_bg rounded-full"
              title="Delete post"
            >
              <DeleteIcon />
            </button>
          )}
        </div>

        {/* Content */}
        <div
          ref={contentRef}
          className={`pt-2 text-sm text-text_content whitespace-pre-wrap leading-snug [&>p]:my-0.5 [&>ul]:my-0.5 [&>li]:my-0.5 ${
            expanded ? "" : "line-clamp-4"
          }`}
        >
          {topic?.content}
        </div>

        {showToggle && (
          <button
            onClick={() => setExpanded((prev) => !prev)}
            className="ml-2 text-blue-600 hover:underline font-small text-xs"
          >
            {expanded ? "View Less" : "View More"}
          </button>
        )}

        {/* Media Attachments */}
        {topic?.mediaAttachments?.length > 0 && (
          <div className="pt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {topic.mediaAttachments.map((attachment, index) => (
              <div
                key={index}
                className="w-full h-full rounded-md overflow-hidden border border-gray-200 shadow-sm"
              >
                <ShowMedia attachment={attachment} />
              </div>
            ))}
          </div>
        )}

        {/* Generated Image */}
        {topic?.imageUrl && (
          <div className="pt-4">
            <div className="w-full rounded-md overflow-hidden border border-gray-200 shadow-sm">
              <img
                src={topic.imageUrl}
                alt="Generated topic image"
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        )}

        {/* Actions Section */}
        <div className="pt-4 flex items-center gap-2 text-xs text-gray-500">
          <div className="bg-btn_bg flex p-1 px-2 rounded-xl gap-2">
            <button
              onClick={handleTopicLike}
              className={`flex items-center gap-1 hover:text-like_color transition ${
                isLiked && "text-like_color"
              }`}
            >
              <LikeIcon isLiked={isLiked} />
              {topicLikes?.length || 0}
            </button>

            <button
              onClick={handleTopicDislike}
              className={`flex items-center gap-1 hover:text-red-600 transition ${
                isDisliked && "text-red-600"
              }`}
            >
              <DisLikeIcon isDisliked={isDisliked} />
              {topicDislikes?.length || 0}
            </button>
          </div>

          <button
            onClick={() => {
              setViewBox(true);
              setReplyIdForContext(null);
            }}
            className="flex items-center gap-1 text-like_color hover:text-like_color transition"
          >
            <ReplyIcon />
            <div className="text-xs">Reply</div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default HeaderContent;




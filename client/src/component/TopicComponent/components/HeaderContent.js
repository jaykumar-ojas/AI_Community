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
  UpvoteIcon,
  DownvoteIcon,
} from "../../../asset/icons";
import HeaderSkeleton from "./HeaderSkeleton";
import { parseMarkdown } from "../../../utils/parseMarkdown";
import { useMathJaxAndHighlight } from "../../../utils/useMathJaxAndHighlight";
import LikeDislike from "../../Card/LikeDislike";
import ShareFile from "../../Share/ShareFile";
import LikeDislike2 from "../../Card/LikeDislike2";
// Add a simple three dots icon (vertical ellipsis)

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
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef();

  // useMathJaxAndHighlight();

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

  useEffect(() => {
    // Close menu on outside click
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    }
    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  const handleTopicLike = async () => {
    if (!loginData?.validuserone) {
      alert("Please log in to like topics");
      return;
    }

    const userId = loginData.validuserone._id;

    // --- STEP 1: TAKE SNAPSHOT BEFORE CHANGING ANYTHING ---
    const prevLikes = [...topicLikes];
    const prevDislikes = [...topicDislikes];
    const prevIsLiked = isLiked;
    const prevIsDisLiked = isDisliked;

    // --- STEP 2: OPTIMISTIC UI UPDATE ---
    const willBeLiked = !topicLikes.includes(userId);

    setTopicLikes(
      willBeLiked
        ? [...topicLikes, userId]
        : topicLikes.filter((id) => id !== userId)
    );

    setTopicDislikes(topicDislikes.filter((id) => id !== userId));

    setIsLiked(willBeLiked);
    setIsDisLiked(false);

    // --- STEP 3: API CALL ---
    try {
      const response = await axios.post(
        `${API_BASE_URL}/forum/topics/${topic._id}/like`,
        {},
        { headers: getAuthHeaders() }
      );

      if (response.status === 200) {
        // Server succeeded → keep optimistic UI
        return;
      }

      // If server sends weird status
      throw new Error("Unexpected response");
    } catch (error) {
      console.error("Error liking topic:", error);

      // --- STEP 4: ROLLBACK IF FAILED ---
      setTopicLikes(prevLikes);
      setTopicDislikes(prevDislikes);
      setIsLiked(prevIsLiked);
      setIsDisLiked(prevIsDisLiked);

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

    const userId = loginData.validuserone._id;

    // --- STEP 1: SNAPSHOT OLD STATE ---
    const prevLikes = [...topicLikes];
    const prevDislikes = [...topicDislikes];
    const prevIsLiked = isLiked;
    const prevIsDisLiked = isDisliked;

    // --- STEP 2: OPTIMISTIC UPDATE ---
    const willBeDisliked = !topicDislikes.includes(userId);

    setTopicDislikes(
      willBeDisliked
        ? [...topicDislikes, userId]
        : topicDislikes.filter((id) => id !== userId)
    );

    setTopicLikes(topicLikes.filter((id) => id !== userId));

    setIsDisLiked(willBeDisliked);
    setIsLiked(false);

    // --- STEP 3: API CALL ---
    try {
      const response = await axios.post(
        `${API_BASE_URL}/forum/topics/${topic._id}/dislike`,
        {},
        { headers: getAuthHeaders() }
      );

      if (response.status === 200) {
        // Server success → keep optimistic changes
        return;
      }

      throw new Error("Unexpected response");
    } catch (error) {
      console.error("Error disliking topic:", error);

      // --- STEP 4: ROLLBACK IF FAILED ---
      setTopicLikes(prevLikes);
      setTopicDislikes(prevDislikes);
      setIsLiked(prevIsLiked);
      setIsDisLiked(prevIsDisLiked);

      if (!handleAuthError(error, setError)) {
        setError("Failed to dislike topic. Please try again.");
      }
    }
  };

  if (!topic) {
    return <HeaderSkeleton />;
  }

  return (
    <div className="flex font-poppins leading-relaxed font-normal justify-start mb-0">
      {/* User Icon Outside */}
      <div className="w-8 h-8  flex-shrink-0">
        <UserIconCard id={topic?.userId} />
      </div>

      {/* Content Section */}
      <div className="flex flex-col  p-1 pt-0 md:ml-2 rounded-xl w-full">
        {/* Header: User Info */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2  text-gray-700">
            <span className="font-normal text-[14px] sm:text-md text-black dark:text-low_text">
              <UserNameCard id={topic?.userId} size={6} />
            </span>
            <div className="w-1 h-1 bg-gray-800 dark:bg-time_header rounded-full"></div>
            <span className="text-xs text-gray-700 dark:text-time_header">
              {formatDate(topic?.createdAt)}
            </span>
          </div>
          {/* Three dots menu for author actions */}
          {/* {isAuthor && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu((prev) => !prev)}
                className="p-1 rounded-full hover:bg-btn_bg focus:outline-none"
                title="More actions"
              >
                <ThreeDotsIcon />
              </button>
              {showMenu && (
                <div className="absolute right-0 mt-2 w-28 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onDelete();
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-gray-100 w-full text-left"
                  >
                    <DeleteIcon />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
          )} */}
        </div>

        {/* Content */}
        <div
          ref={contentRef}
          className={`md:pt-2 pt-1 text-[13px] md:text-sm text-[14px]text-black dark:text-text_content whitespace-pre-wrap leading-snug [&>p]:my-0.5 [&>ul]:my-0.5 [&>li]:my-0.5 ${
            expanded ? "" : "line-clamp-4"
          }`}
        >
          <div
            className="prose dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: parseMarkdown(topic?.content) }}
          />
        </div>

        {showToggle && (
          <button
            onClick={() => setExpanded((prev) => !prev)}
            className="ml-2 text-theme_color2 hover:underline font-small text-xs"
          >
            {expanded ? "View Less" : "View More"}
          </button>
        )}

        {/* Media Attachments */}
        {topic?.mediaAttachments?.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3">
            {topic.mediaAttachments.map((attachment, index) => (
              <div key={index}>
                <ShowMedia attachment={attachment} />
              </div>
            ))}
          </div>
        )}

        {/* Generated Image */}
        {topic?.imageUrl && (
          <div className="flex justify-center pt-4">
            <img
              src={topic.imageUrl}
              alt="Generated topic image"
              className="max-h-[400px] rounded-md w-auto object-cover"
            />
          </div>
        )}

        {/* Actions Section */}
        <div className="pt-2 flex justify-start items-center gap-2 text-xs text-gray-500">
          <LikeDislike2
            topic={topic}
            like={handleTopicLike}
            dislike={handleTopicDislike}
            isLiked={isLiked}
            isDisliked={isDisliked}
            likeCount = {topicLikes?.length}
            dislikeCount = {topicDislikes?.length}
          />
          <button
            onClick={() => {
              setViewBox(true);
              setReplyIdForContext(null);
            }}
            className="flex items-center justify-content gap-1 text-theme_color4 hover:text-theme_color transition"
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

const ThreeDotsIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="10" cy="4" r="1.5" fill="#888" />
    <circle cx="10" cy="10" r="1.5" fill="#888" />
    <circle cx="10" cy="16" r="1.5" fill="#888" />
  </svg>
);

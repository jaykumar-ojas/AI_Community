import React, { useContext, useEffect, useRef, useState } from "react";
import { API_BASE_URL, formatDate, getAuthHeaders, handleAuthError } from "../../AiForumPage/components/ForumUtils";
import ShowMedia from "./ShowMedia";
import { LoginContext } from "../../ContextProvider/context";
import axios from "axios";
import ReplyPostContent from "./ReplyPostContent";
import { ForumContext } from "../../ContextProvider/ModelContext";


const HeaderContent = ({ topic, onDelete }) => {
  const {viewBox,setViewBox,setReplyIdForContext} = useContext(ForumContext);
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
      alert('Please log in to like topics');
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/forum/topics/${topic._id}/like`, {}, {
        headers: getAuthHeaders()
      });

      if (response.status === 200) {
        const userId = loginData.validuserone._id;
        const liked = response.data.liked;

        setTopicLikes(liked ? [...topicLikes, userId] : topicLikes.filter(id => id !== userId));
        setTopicDislikes(topicDislikes.filter(id => id !== userId));
        setIsLiked(liked);
        setIsDisLiked(false);
      }
    } catch (error) {
      console.error('Error liking topic:', error);
      if (!handleAuthError(error, setError)) {
        setError('Failed to like topic. Please try again.');
      }
    }
  };

  const handleTopicDislike = async () => {
    if (!loginData?.validuserone) {
      alert('Please log in to dislike topics');
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/forum/topics/${topic._id}/dislike`, {}, {
        headers: getAuthHeaders()
      });

      if (response.status === 200) {
        const userId = loginData.validuserone._id;
        const disliked = response.data.disliked;

        setTopicDislikes(disliked ? [...topicDislikes, userId] : topicDislikes.filter(id => id !== userId));
        setTopicLikes(topicLikes.filter(id => id !== userId));
        setIsDisLiked(disliked);
        setIsLiked(false);
      }
    } catch (error) {
      console.error('Error disliking topic:', error);
      if (!handleAuthError(error, setError)) {
        setError('Failed to dislike topic. Please try again.');
      }
    }
  };

  return (
    <div className={`sticky top-10 rounded-xl  border shadow-sm p-4 mb-4 ${
      isAuthor ? "bg-blue-50" : "bg-white"
      // isAuthor ? "bg-transparent" : "bg-transparent"
      }`}>
      {/* Header: User Info */}
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-gray-600">
          <span className="font-semibold text-blue-700">{topic.userName}</span>
          <span className="ml-2 text-gray-400">{formatDate(topic?.createdAt)}</span>
        </div>
        {isAuthor && (
          <button
            onClick={onDelete}
            className="text-red-500 hover:text-red-700 transition-colors duration-200"
            title="Delete post"
          >
            <DeleteIcon />
          </button>
        )}
      </div>

      {/* Content */}
      <div>
      <div
        ref={contentRef}
        className={`text-base transition-all duration-300 ${
          expanded ? "" : "line-clamp-4"
        }`}
      >
        {topic?.content}
      </div>

      {showToggle && (
        <button
          onClick={() => setExpanded((prev) => !prev)}
          className="text-blue-500 mt-2 hover:underline"
        >
          {expanded ? "View less" : "View more"}
        </button>
      )}
    </div>

      {/* Media */}
      {topic?.mediaAttachments?.length > 0 && (
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {topic.mediaAttachments.map((attachment, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-lg border border-gray-200 shadow-sm bg-white"
              style={{ maxWidth: "160px" }}
            >
              <ShowMedia attachment={attachment} />
            </div>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
        <button
          onClick={handleTopicLike}
          className={`flex items-center hover:text-blue-600 transition ${isLiked ? "text-blue-600 font-semibold" : ""}`}
        >
          <LikeIcon isLiked={isLiked} />
          <span>{topicLikes?.length || 0}</span>
        </button>

        <button
          onClick={handleTopicDislike}
          className={`flex items-center hover:text-red-600 transition ${isDisliked ? "text-red-600 font-semibold" : ""}`}
        >
          <DisLikeIcon isDisliked={isDisliked} />
          <span>{topicDislikes?.length || 0}</span>
        </button>

        <button
          // onClick={() => setShowReplyBox(true)}
          onClick={()=>{
            setViewBox(true);
            setReplyIdForContext(null);
          }}
          className="flex items-center text-blue-600 hover:text-blue-800"
        >
          <ReplyIcon />
          <span>Reply</span>
        </button>
      </div>

      {/* Reply Box */}
      {/* {showReplyBox && (
        <div className="mt-3">
           <ReplyPostContent topic_id={topic?._id} />
        </div>
      )} */}
    </div>
  );
};

export default HeaderContent;


const DeleteIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );
};

const LikeIcon = ({ isLiked }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4 mr-1"
      fill={isLiked ? "currentColor" : "none"}
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
      />
    </svg>
  );
};

const DisLikeIcon = ({ isDisliked }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4 mr-1"
      fill={isDisliked ? "currentColor" : "none"}
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018c.163 0 .326.02.485.06L17 4m-7 5v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 5h2m5 0v2a2 2 0 01-2 2h-2.5"
      />
    </svg>
  );
};

const ReplyIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4 mr-1"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
      />
    </svg>
  );
};

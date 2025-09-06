import React, { useContext, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";

import { LoginContext } from "../../component/ContextProvider/context";
import {
  getAuthHeaders,
  handleAuthError,
  API_BASE_URL,
} from "../../component/AiForumPage/components/ForumUtils";

import HeaderContent from "./components/HeaderContent";
import ReplyContent from "./ReplyComponent/ReplyContent";
import { ForumContext } from "../ContextProvider/ModelContext";
import { LikeIcon, DisLikeIcon, BackArrow, UpvoteIcon, DownvoteIcon } from "../../asset/icons";
import UserReply from "../UserReply/UserReply";
import HeaderSkeleton from "./components/HeaderSkeleton";
import { encodeId } from '../../utils/hashids';



const fetchTopic = async (topicId) => {
  console.log("encodeed", topicId);
  const response = await axios.get(`${API_BASE_URL}/forum/topics/${topicId}`, {
    headers: getAuthHeaders(),
  });
  return response.data.topic;
};

const TopicContent = () => {
  const { topicId } = useParams();
  const { loginData } = useContext(LoginContext);
  const { setReplyIdForContext,setUserName, viewBox, setViewBox } =useContext(ForumContext);
  const mobileReplyRef = useRef(null);
  const navigate = useNavigate();

   

  useEffect(()=>{
    setReplyIdForContext(null);
    setUserName(null);
    setViewBox(false);
  },[]);

  // Close mobile reply box when clicking outside
  useEffect(() => {
    if (!viewBox) return;
    function handleOutside(event) {
      if (mobileReplyRef.current && !mobileReplyRef.current.contains(event.target)) {
        setViewBox(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, [viewBox, setViewBox]);

  const {
    data: topic,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["topic", topicId],
    queryFn: () => fetchTopic(topicId),
    enabled: !!topicId,
    staleTime: 1000 * 60 * 5,
    retry: false,
    onError: (err) => {
      if (handleAuthError(err)) return;
      console.error("Error fetching topic:", err);
    },
  });

  const isTopicLiked = true;
  const isTopicDisliked = false;
  const threadView = null;

  // Delete handler
  const handleDelete = async () => {
    if (!topicId) return;
    if (!window.confirm("Are you sure you want to delete this topic?")) return;
    try {
      await axios.delete(`http://localhost:8099/forum/topics/${topicId}`, {
        headers: getAuthHeaders(),
      });
      navigate("/"); // Change this to your forum main page route
    } catch (err) {
      alert("Failed to delete topic.");
      console.error(err);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Fixed Topic Header */}
      <div className="bg-gray-100 dark:bg-bg_comment_box md:px-4 px-2 py-2 flex items-center flex-shrink-0">
        <button className="md:mr-3 mr-1 text-gray-500 hover:text-time_header">
          <BackArrow />
        </button>
        <h2 className="font-semibold text-sm md:text-lg text-black dark:text-text_header flex-1">
          {threadView ? "Thread" : topic?.title}
        </h2>
        {!threadView && (
          <div className="flex items-center space-x-2">
            {/* <button
              className={`flex items-center ${
                isTopicLiked ? "text-blue-600" : "text-gray-500"
              } hover:text-blue-600`}
            >
              <UpvoteIcon isLiked={isTopicLiked} />
            </button>
            <button
              className={`flex items-center ${
                isTopicDisliked ? "text-red-600" : "text-gray-500"
              } hover:text-red-600`}
            >
              <DownvoteIcon isDisliked={isTopicDisliked} />
            </button> */}
          </div>
        )}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-500 scrollbar-track-gray-100 dark:scrollbar-track-bg_comment_box">
        <div className="space-y-4">
          <div className="dark:bg-bg_comment_box rounded-xl p-4">
            {isLoading ? <HeaderSkeleton /> : topic && <HeaderContent topic={topic} onDelete={handleDelete} />}
            {isError && (
              <div className="text-red-500 text-center">
                Failed to load topic.
                <button
                  className="ml-4 px-4 py-2 bg-blue-500 text-white rounded"
                  onClick={() => refetch()}
                >
                  Retry
                </button>
              </div>
            )}
          </div>
          <div className="bg-gray-100 dark:bg-bg_comment_box rounded-xl p-4 pt-0">
            <ReplyContent />
          </div>
        </div>
      </div>

      {/* Reply Input - Desktop always visible; Mobile shown only when Reply tapped */}
      <div className="px-4 py-2 bg-transparent hidden md:block">
        <UserReply />
      </div>
      {viewBox && (
        <div ref={mobileReplyRef} className="fixed z-50 bottom-0 left-0 right-0 bg-white md:hidden">
          <UserReply />
        </div>
      )}
    </div>
  );
};

export default TopicContent;
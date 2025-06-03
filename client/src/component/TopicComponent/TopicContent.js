import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { LoginContext } from "../../component/ContextProvider/context";
import {
  formatDate,
  getAuthHeaders,
  handleAuthError,
  API_BASE_URL,
} from "../../component/AiForumPage/components/ForumUtils";
import HeaderContent from "./components/HeaderContent";
import ReplyContent from "./ReplyComponent/ReplyContent";

import { ForumContext} from "../ContextProvider/ModelContext";
import { LikeIcon,DisLikeIcon,BackArrow } from "../../asset/icons";
import UserReply from "../UserReply/UserReply";

const TopicContent = () => {
  const { topicId } = useParams();
  const { loginData } = useContext(LoginContext);
  const [isLoading, setIsLoading] = useState(true);
  const [topic, setTopic] = useState();
  const [error, setError] = useState(null);
  const isTopicDisliked = false;
  const isTopicLiked = true;
  const threadView = null;
  const {viewBox,setViewBox,replyId,model,replyIdForContext,setReplyIdForContext} = useContext(ForumContext);

  useEffect(() => {
    if (topicId) {
      fetchTopic();
    }
  }, [topicId]);

  const fetchTopic = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/forum/topics/${topicId}`,
        {
          headers: getAuthHeaders(),
        }
      );
      setTopic(response.data.topic);
      console.log("this is my topic", topic);
      setIsLoading(false);
    } catch (err) {
      if (handleAuthError(err, setError)) {
        return;
      }
      console.error("Error fetching topic:", err);
      setError("Failed to load topic. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="text-bold">Loading content .....</div>;
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Fixed Topic Header */}
      <div className="bg-bg_comment_box px-4 py-2 flex items-center flex-shrink-0">
        <button className="mr-3 text-gray-500 hover:text-time_header">
          <BackArrow />
        </button>
        <h2 className="font-semibold text-lg text-text_header flex-1">
          {threadView ? "Thread" : topic.title}
        </h2>
        {!threadView && (
          <div className="flex items-center space-x-2">
            <button className={`flex items-center ${isTopicLiked ? "text-blue-600" : "text-gray-500"} hover:text-blue-600`}>
              <LikeIcon isLiked={isTopicLiked} />
            </button>
            <button className={`flex items-center ${isTopicDisliked ? "text-red-600" : "text-gray-500"} hover:text-red-600`}>
              <DisLikeIcon isDisliked={isTopicDisliked} />
            </button>
          </div>
        )}
      </div>

      {/* Scrollable Content - takes remaining space */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-bg_comment_box">
        <div className="space-y-4">
          <div className="bg-bg_comment_box rounded-xl p-4">
            <HeaderContent topic={topic} />
          </div>
          <div className="bg-bg_comment_box rounded-xl p-4 pt-0">
            <ReplyContent />
          </div>
        </div>
      </div>

      {/* Fixed Bottom Reply Input */}
      <div className="px-4 py-2  bg-bg_comment_box">
        <UserReply />
      </div>
    </div>
  );
};

export default TopicContent;
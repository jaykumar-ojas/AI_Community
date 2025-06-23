import React, { useContext } from "react";
import { useParams } from "react-router-dom";
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
import { LikeIcon, DisLikeIcon, BackArrow } from "../../asset/icons";
import UserReply from "../UserReply/UserReply";
import HeaderSkeleton from "./components/HeaderSkeleton";

const fetchTopic = async (topicId) => {
  const response = await axios.get(`${API_BASE_URL}/forum/topics/${topicId}`, {
    headers: getAuthHeaders(),
  });
  return response.data.topic;
};

const TopicContent = () => {
  const { topicId } = useParams();
  const { loginData } = useContext(LoginContext);
  const { viewBox, setViewBox, replyId, model, replyIdForContext, setReplyIdForContext } =
    useContext(ForumContext);

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

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Fixed Topic Header */}
      <div className="bg-bg_comment_box px-4 py-2 flex items-center flex-shrink-0">
        <button className="mr-3 text-gray-500 hover:text-time_header">
          <BackArrow />
        </button>
        <h2 className="font-semibold text-lg text-text_header flex-1">
          {threadView ? "Thread" : topic?.title}
        </h2>
        {!threadView && (
          <div className="flex items-center space-x-2">
            <button
              className={`flex items-center ${
                isTopicLiked ? "text-blue-600" : "text-gray-500"
              } hover:text-blue-600`}
            >
              <LikeIcon isLiked={isTopicLiked} />
            </button>
            <button
              className={`flex items-center ${
                isTopicDisliked ? "text-red-600" : "text-gray-500"
              } hover:text-red-600`}
            >
              <DisLikeIcon isDisliked={isTopicDisliked} />
            </button>
          </div>
        )}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-bg_comment_box">
        <div className="space-y-4">
          <div className="bg-bg_comment_box rounded-xl p-4">
            {isLoading ? <HeaderSkeleton /> : topic && <HeaderContent topic={topic} />}
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
          <div className="bg-bg_comment_box rounded-xl p-4 pt-0">
            <ReplyContent />
          </div>
        </div>
      </div>

      {/* Fixed Bottom Reply Input */}
      <div className="px-4 py-2 bg-bg_comment_box">
        <UserReply />
      </div>
    </div>
  );
};

export default TopicContent;

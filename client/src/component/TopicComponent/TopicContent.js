import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { LoginContext } from "../../component/ContextProvider/context";
import { useWebSocket } from "../../component/AiForumPage/components/WebSocketContext";
import {
  formatDate,
  getAuthHeaders,
  handleAuthError,
  API_BASE_URL,
} from "../../component/AiForumPage/components/ForumUtils";
import HeaderContent from "./components/HeaderContent";
import ReplyContent from "./ReplyComponent/ReplyContent";

import { ForumContext} from "../ContextProvider/ModelContext";
import StateSelection from "./StateSelection";
import { LikeIcon,DisLikeIcon,BackArrow } from "../../asset/icons";
import ReplyCommentBox from "../AIchatbot/Component/ReplyCommentBox";


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
    <div className="max-w-6xl w-full">
  {/* Sticky Header */}
  <div className="bg-bg_comment_box mx-4 rounded-lg p-2 mb-0 flex items-center sticky top-0 z-10">
    <button className="mr-3 text-gray-500 hover:text-time_header">
      <BackArrow />
    </button>
    <h2 className="font-semibold text-lg text-text_header flex-1">
      {threadView ? "Thread" : topic.title}
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

  {/* Main Content — Remove height and internal scrolling */}
  <div className="bg-bg_comment rounded-xl overflow-hidden h-[calc(100vh-5.5rem)] p-4 pt-2 w-full relative z-0">
  {/* Sticky Wrapper (like reference) */}
  <div className="sticky rounded-xl  h-full flex flex-col justify-between overflow-hidden">
    
    {/* Scrollable Area for HeaderContent + ReplyContent */}
    <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-bg_comment_box no-scrollbar-arrows h-full ">
      <div className="bg-bg_comment_box rounded-xl p-4">
        <HeaderContent topic={topic} />
      </div>

      <div className="bg-bg_comment_box rounded-xl p-4 pt-0">
        <ReplyContent />
      </div>
    </div>

    {/* Static ReplyCommentBox */}
    <div className="pr-1">
      <ReplyCommentBox
        onClose={() => {
          setReplyIdForContext(null);
        }}
      />
    </div>

  </div>
</div>

</div>

  );
};

export default TopicContent;





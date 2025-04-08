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
import ShowMedia from "./components/ShowMedia";
import HeaderContent from "./components/HeaderContent";
import ReplyContent from "./ReplyComponent/ReplyContent";
import bgPattern from '../../asset/backGroundImage.png'


const TopicContent = () => {
  const { topicId } = useParams();
  const { loginData } = useContext(LoginContext);
  const [isLoading, setIsLoading] = useState(true);
  const [topic, setTopic] = useState();
  const [error, setError] = useState(null);
  const isTopicDisliked = false;
  const isTopicLiked = true;
  const threadView = null;

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
    <>
    <div className="bg-white border-b outline-white border-gray-200 h-[68px] p-4 flex items-center sticky top-0 z-10">
        <button
        //   onClick={threadView ? handleBackFromThread : onBack}
          className="mr-3 text-gray-500 hover:text-gray-700"
        >
          <BackArrow/>
        </button>
        <h2 className="font-semibold  text-lg flex-1">{threadView ? 'Thread' : topic.title}</h2>
        {!threadView && (
          <div className="flex items-center space-x-2">
            <button
            //   onClick={handleTopicLike}
              className={`flex items-center ${isTopicLiked ? 'text-blue-600' : 'text-gray-500'} hover:text-blue-600`}
            >
             <LikeIcon isLiked={isTopicLiked}/>
            </button>
            <button
            //   onClick={handleTopicDislike}
              className={`flex items-center ${isTopicDisliked ? 'text-red-600' : 'text-gray-500'} hover:text-red-600`}
            >
              <DisLikeIcon isDisliked={isTopicDisliked}/>
            </button>
          </div>
        )}
      </div>


      <div className=" relative w-80% z-0"
      // style={{
      //   opacity:1,
      //   backgroundImage:`url(${bgPattern})`
      // }}
      >
      <HeaderContent topic = {topic}></HeaderContent>
      <ReplyContent></ReplyContent>
      </div>

    </>
  );
};

export default TopicContent;

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

const BackArrow = () =>{
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
    )
};

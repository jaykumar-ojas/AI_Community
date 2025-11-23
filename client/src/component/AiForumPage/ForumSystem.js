import React, { useState, useContext } from "react";
import { LoginContext } from "../ContextProvider/context";
import {
  useWebSocket,
  WebSocketProvider,
} from "../AiForumPage/components/WebSocketContext";
import PopularTopics from "../AiForumPage/components/PopularTopics";
import RecentTopics from "../AiForumPage/components/RecentTopics";
import MyTopics from "../AiForumPage/components/MyTopics";
import NewTopicModal from "../AiForumPage/components/NewTopicModal";
import ChatBotForum from "../AIchatbot/chatbot";
import AiContentGenerator from "./components/AiContentGenerator";
import "./Button.css";

import { useEffect } from "react";
import { PlusIcon } from "lucide-react";

const ForumSystem = () => {
  const { loginData } = useContext(LoginContext);
  const [currentTab, setCurrentTab] = useState("popular"); // 'popular', 'recent', 'my'
  const [isNewTopicModalOpen, setIsNewTopicModalOpen] = useState(false);
  const { subscribeToEvent } = useWebSocket();

  useEffect(() => {
    const unsubscribe = subscribeToEvent("topic_created", (topic) => {
      setCurrentTab("my");
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div className="dark:bg-black flex flex-col h-[calc(100vh-6.6rem)] md:h-full">
      {/* Header with search - now with transparent/dark background */}
      <div className="p-1 px-2 sticky top-0 flex justify-between backdrop-blur-sm">
        <div className=" text-2xl font-inter font-semibold text-theme_color3">
          Community
        </div>

        <button
          onClick={() => setIsNewTopicModalOpen(true)}
          className="bg-gradient-to-r from-pink-600 via theme_color2 to-theme_color3 px-2 rounded-lg text-gray-900 flex items-center justify-center "
          disabled={!loginData}
        >
          <PlusIcon />
          <span className="font-inter font-bold">Create</span>
        </button>
      </div>

      {/* Navigation Tabs - with dark theme styling */}

      <div className="relative flex dark:bg-black/40 backdrop-blur-sm  border-y border-gray-400  gap-2  overflow-hidden">
        {/* Slim sliding background indicator */}
        <span
          className="absolute h-8 rounded-full bg-gradient-to-r from-theme_color to-theme_color2 shadow-md transition-all duration-500 ease-in-out"
          style={{
            top: "50%",
            transform: "translateY(-50%)",
            left:
              currentTab === "popular"
                ? "0.5rem"
                : currentTab === "recent"
                ? "34%"
                : "67.5%",
            width: "30%",
          }}
        ></span>

        <button
          className={`flex-1 relative z-10 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200
      ${
        currentTab === "popular"
          ? "text-white font-semibold"
          : "text-gray-800 dark:text-low_text"
      }`}
          onClick={() => setCurrentTab("popular")}
        >
          Popular
        </button>

        <button
          className={`flex-1 relative z-10 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200
      ${
        currentTab === "recent"
          ? "text-white font-semibold"
          : "text-gray-800 dark:text-low_text"
      }`}
          onClick={() => setCurrentTab("recent")}
        >
          Recent
        </button>

        <button
          className={`flex-1 relative z-10 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200
      ${
        currentTab === "my"
          ? "text-white font-semibold"
          : "text-gray-800 dark:text-low_text"
      }`}
          onClick={() => setCurrentTab("my")}
        >
          My Topics
        </button>
      </div>

      {isNewTopicModalOpen && (
        <NewTopicModal onClose={() => setIsNewTopicModalOpen(false)} />
      )}

      {/* Main Content Area - transparent background */}
      <div className="flex-1 overflow-y-auto">
        {currentTab === "popular" && <PopularTopics />}
        {currentTab === "recent" && <RecentTopics />}
        {currentTab === "my" && <MyTopics />}
      </div>

      {/* Create Topic Button - with dark theme styling */}
    </div>
  );
};

export default ForumSystem;

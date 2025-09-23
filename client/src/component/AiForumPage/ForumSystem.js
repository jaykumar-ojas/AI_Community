import React, { useState, useContext } from 'react';
import { LoginContext } from '../ContextProvider/context';
import { useWebSocket, WebSocketProvider } from '../AiForumPage/components/WebSocketContext';
import PopularTopics from '../AiForumPage/components/PopularTopics';
import RecentTopics from '../AiForumPage/components/RecentTopics';
import MyTopics from '../AiForumPage/components/MyTopics';
import NewTopicModal from '../AiForumPage/components/NewTopicModal';
import ChatBotForum from '../AIchatbot/chatbot';
import AiContentGenerator from './components/AiContentGenerator';
import "./Button.css";

import { useEffect } from 'react';
import { PlusIcon } from 'lucide-react';

const ForumSystem = () => {
  const { loginData } = useContext(LoginContext);
  const [currentTab, setCurrentTab] = useState('popular'); // 'popular', 'recent', 'my'
  const [isNewTopicModalOpen, setIsNewTopicModalOpen] = useState(false);
  const {subscribeToEvent} = useWebSocket();

  useEffect(() => {
    const unsubscribe = subscribeToEvent('topic_created', (topic) => {
      setCurrentTab("my");
    });
    
    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div className=" md:border-x-2 border-[#DBDBDB]  dark:border-gray-600  dark:bg-black flex flex-col h-[calc(100vh-6.6rem)] md:h-full">
      {/* Header with search - now with transparent/dark background */}
      <div className="p-2 sticky top-0  backdrop-blur-sm">
        <h2 className="text-xl text-gray-900 dark:text-gray-300 font-bold mb-2">AI Forum</h2>
        {/* <div className="relative">
          <input
            type="text"
            placeholder="Search discussions..."
            className="w-full px-4 py-2 pr-10 border border-gray-700 rounded-lg bg-black/40 text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm"
          />
          <button className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div> */}
      </div>

      {/* Navigation Tabs - with dark theme styling */}

<div className="relative flex dark:bg-black/40 backdrop-blur-sm  border-y border-gray-400  gap-2  overflow-hidden">
  {/* Slim sliding background indicator */}
  <span
    className="absolute h-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 shadow-md transition-all duration-500 ease-in-out"
    style={{
      top: "50%",
      transform: "translateY(-50%)",
      left: currentTab === "popular" ? "0.5rem" : currentTab === "recent" ? "34%" : "67.5%",
      width: "30%",
    }}
  ></span>

  <button
    className={`flex-1 relative z-10 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200
      ${currentTab === "popular" ? "text-white font-semibold" : "text-gray-800 dark:text-gray-300"}`}
    onClick={() => setCurrentTab("popular")}
  >
    Popular
  </button>

  <button
    className={`flex-1 relative z-10 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200
      ${currentTab === "recent" ? "text-white font-semibold" : "text-gray-800 dark:text-gray-300"}`}
    onClick={() => setCurrentTab("recent")}
  >
    Recent
  </button>

  <button
    className={`flex-1 relative z-10 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200
      ${currentTab === "my" ? "text-white font-semibold" : "text-gray-800 dark:text-gray-300"}`}
    onClick={() => setCurrentTab("my")}
  >
    My Topics
  </button>
</div>



      {isNewTopicModalOpen && <NewTopicModal onClose={() => setIsNewTopicModalOpen(false)} />}

      {/* Main Content Area - transparent background */}
      <div className="flex-1 overflow-y-auto">
        {currentTab === 'popular' && (
          <PopularTopics />
        )}
        {currentTab === 'recent' && (
          <RecentTopics />
        )}
        {currentTab === 'my' && (
          <MyTopics />
        )}
      </div>

      {/* Create Topic Button - with dark theme styling */}

  <button
    onClick={() => setIsNewTopicModalOpen(true)}
    className="w-full mr-2 bg-gradient-to-r from-blue-500 to-blue-600  md:p-3 p-2 rounded-lg text-gray-100 flex items-center justify-center gap-2"
    disabled={!loginData}
  >
    <PlusIcon/>
    <span>
      {loginData ? "Create your Topic" : "Login to Create Topic"}
    </span>


    {/* waves + shimmer */}
    <div className="waves"></div>
    <div className="shimmer"></div>
  </button>


    </div>
  );
};

export default ForumSystem;
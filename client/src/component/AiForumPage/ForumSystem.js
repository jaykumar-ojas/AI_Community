import React, { useState, useContext } from 'react';
import { LoginContext } from '../ContextProvider/context';
import { useWebSocket, WebSocketProvider } from '../AiForumPage/components/WebSocketContext';
import PopularTopics from '../AiForumPage/components/PopularTopics';
import RecentTopics from '../AiForumPage/components/RecentTopics';
import MyTopics from '../AiForumPage/components/MyTopics';
import NewTopicModal from '../AiForumPage/components/NewTopicModal';
import ChatBotForum from '../AIchatbot/chatbot';
import AiContentGenerator from './components/AiContentGenerator';
import { useEffect } from 'react';

const ForumSystem = () => {
  const { loginData } = useContext(LoginContext);
  const [currentTab, setCurrentTab] = useState('popular'); // 'popular', 'recent', 'my'
  const [isNewTopicModalOpen, setIsNewTopicModalOpen] = useState(false);
  const {subscribeToEvent} = useWebSocket();

  useEffect(() => {
    console.log("coming to hre");
    const unsubscribe = subscribeToEvent('topic_created', (topic) => {
      console.log("i m coming but not set my tab");
      setCurrentTab("my");
    });
    
    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div className="rounded-lg overflow-hidden flex flex-col h-full bg-transparent">
      {/* Header with search - now with transparent/dark background */}
      <div className="p-4 border-b border-gray-800 sticky top-0 bg-black/40 backdrop-blur-sm">
        <h2 className="text-xl text-gray-300 font-bold mb-4">AI Forum</h2>
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
      <div className="flex sticky top-[88px] z-10 bg-black/40 backdrop-blur-sm border-b border-gray-800">
        <button
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            currentTab === 'popular' 
              ? 'text-blue-400 border-b-2 border-blue-400' 
              : 'text-gray-400 hover:text-gray-300'
          }`}
          onClick={() => setCurrentTab('popular')}
        >
          Popular
        </button>
        <button
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            currentTab === 'recent' 
              ? 'text-blue-400 border-b-2 border-blue-400' 
              : 'text-gray-400 hover:text-gray-300'
          }`}
          onClick={() => setCurrentTab('recent')}
        >
          Recent
        </button>
        <button
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            currentTab === 'my' 
              ? 'text-blue-400 border-b-2 border-blue-400' 
              : 'text-gray-400 hover:text-gray-300'
          }`}
          onClick={() => setCurrentTab('my')}
        >
          My Topics
        </button>
      </div>

      {isNewTopicModalOpen && <NewTopicModal onClose={() => setIsNewTopicModalOpen(false)} />}

      {/* Main Content Area - transparent background */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
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
      <div className="p-4 border-t border-slate-700/50 sticky bottom-0 bg-slate-900/80 backdrop-blur-sm">
          <button
            onClick={() => setIsNewTopicModalOpen(true)}
            className="w-full py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl"
            disabled={!loginData}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {loginData ? "Create New Topic" : "Login to Create Topic"}
          </button>
        </div>

    </div>
  );
};

export default ForumSystem;
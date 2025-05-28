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
      <div className="bg-bg_comment_box rounded-lg overflow-hidden flex flex-col h-full">
        {/* Header with search - only show if not in chatbot view */}
          <div className="p-4 border-b sticky top-0">
            <h2 className="text-xl text-text_comment font-bold mb-4">AI Forum</h2>
            <div className="relative">
              <input
                type="text"
                placeholder="Search discussions..."
                className="w-full px-4 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>

        {/* Navigation Tabs - Only show if not viewing a topic and not in chatbot view */}
          <div className="flex border-b sticky top-[88px] z-10">
            <button
              className={`flex-1 px-4 py-3 text-sm font-medium ${currentTab === 'popular' ? 'text-like_color border-b-2 border-like_color' : 'text-text_header/80 hover:text-text_header'}`}
              onClick={() => setCurrentTab('popular')}
            >
              Popular
            </button>
            <button
              className={`flex-1 px-4 py-3 text-sm font-medium ${currentTab === 'recent' ? 'text-like_color border-b-2 border-like_color' : 'text-text_header/80 hover:text-text_header'}`}
              onClick={() => setCurrentTab('recent')}
            >
              Recent
            </button>
            <button
              className={`flex-1 px-4 py-3 text-sm font-medium ${currentTab === 'my' ? 'text-like_color border-b-2 border-like_color' : 'text-text_header/80 hover:text-text_header'}`}
              onClick={() => setCurrentTab('my')}
            >
              My Topics
            </button>
          </div>


         {isNewTopicModalOpen && <NewTopicModal onClose={() => setIsNewTopicModalOpen(false)} /> }

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto">
              {currentTab === 'popular' && (
                <PopularTopics />
              )}
              {currentTab === 'recent' && (
                <RecentTopics  />
              )}
              {currentTab === 'my' && (
                <MyTopics  />
              )}
        </div>

        {/* Create Topic Button - Only show if not viewing a topic and not in chatbot view */}
          <div className="p-4 border-t sticky bottom-0 bg-white">
            <button
              onClick={() => setIsNewTopicModalOpen(true)}
              className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
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
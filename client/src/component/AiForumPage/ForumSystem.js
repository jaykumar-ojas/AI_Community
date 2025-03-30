import React, { useState, useContext } from 'react';
import { LoginContext } from '../ContextProvider/context';
import { WebSocketProvider } from '../AiForumPage/components/WebSocketContext';
import PopularTopics from '../AiForumPage/components/PopularTopics';
import RecentTopics from '../AiForumPage/components/RecentTopics';
import MyTopics from '../AiForumPage/components/MyTopics';
import TopicDetail from '../AiForumPage/components/TopicDetail';
import NewTopicModal from '../AiForumPage/components/NewTopicModal';
import ChatBotForum from '../AIchatbot/chatbot';
import AiContentGenerator from './components/AiContentGenerator';

const ForumSystem = () => {
  const { loginData } = useContext(LoginContext);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [currentTab, setCurrentTab] = useState('popular'); // 'popular', 'recent', 'my'
  const [isNewTopicModalOpen, setIsNewTopicModalOpen] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [showAiContentGenerator, setShowAiContentGenerator] = useState(false);
  const [aiGeneratedContent, setAiGeneratedContent] = useState(null);

  // Handle topic selection
  const handleSelectTopic = (topic) => {
    setSelectedTopic(topic);
  };

  // Handle back button click
  const handleBack = () => {
    setSelectedTopic(null);
    setShowChatbot(false);
  };

  // Handle topic deletion
  const handleDeleteTopic = (topicId) => {
    if (selectedTopic && selectedTopic._id === topicId) {
      setSelectedTopic(null);
      setShowChatbot(false);
    }
  };

  // Handle topic creation
  const handleTopicCreated = (newTopic) => {
    if (currentTab === 'recent' || (currentTab === 'my' && loginData?.validuserone?._id === newTopic.userId)) {
      // The new topic will be added via WebSocket
    }
    // Optionally, select the new topic
    setSelectedTopic(newTopic);
  };

  // Toggle chatbot view for the selected topic
  const handleOpenChatbot = () => {
    setShowChatbot(true);
  };

  // Handle opening AI content generator
  const handleOpenAiContentGenerator = () => {
    setIsNewTopicModalOpen(false);
    setShowAiContentGenerator(true);
  };

  // Handle AI generated content
  const handleAiGeneratedContent = (generatedContent) => {
    setAiGeneratedContent(generatedContent);
    setShowAiContentGenerator(false);
    setIsNewTopicModalOpen(true);
  };

  return (
    <WebSocketProvider>
      <div className="bg-white rounded-lg overflow-hidden flex flex-col h-full">
        {/* Header with search - only show if not in chatbot view */}
        {!showChatbot && !showAiContentGenerator && (
          <div className="p-4 border-b sticky top-0 bg-white z-10">
            <h2 className="text-xl font-bold mb-4">AI Forum</h2>
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
        )}

        {/* Navigation Tabs - Only show if not viewing a topic and not in chatbot view */}
        {!selectedTopic && !showChatbot && !showAiContentGenerator && (
          <div className="flex border-b bg-white sticky top-[88px] z-10">
            <button
              className={`flex-1 px-4 py-3 text-sm font-medium ${currentTab === 'popular' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setCurrentTab('popular')}
            >
              Popular
            </button>
            <button
              className={`flex-1 px-4 py-3 text-sm font-medium ${currentTab === 'recent' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setCurrentTab('recent')}
            >
              Recent
            </button>
            <button
              className={`flex-1 px-4 py-3 text-sm font-medium ${currentTab === 'my' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setCurrentTab('my')}
            >
              My Topics
            </button>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto">
          {showAiContentGenerator ? (
            <AiContentGenerator 
              onClose={() => setShowAiContentGenerator(false)} 
              onContentGenerated={handleAiGeneratedContent} 
            />
          ) : showChatbot ? (
            <ChatBotForum topicId={selectedTopic?._id} onBack={handleBack} />
          ) : selectedTopic ? (
            <div>
              <TopicDetail 
                topic={selectedTopic} 
                onBack={handleBack} 
                onDeleteTopic={handleDeleteTopic} 
              />
              {/* Button to open chatbot for this topic */}
              <div className="fixed bottom-4 right-4">
                <button
                  onClick={handleOpenChatbot}
                  className="bg-blue-600 text-white rounded-full p-3 shadow-lg hover:bg-blue-700 transition-colors"
                  title="Open AI Chatbot for this topic"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </button>
              </div>
            </div>
          ) : (
            <>
              {currentTab === 'popular' && (
                <PopularTopics onSelectTopic={handleSelectTopic} />
              )}
              {currentTab === 'recent' && (
                <RecentTopics onSelectTopic={handleSelectTopic} />
              )}
              {currentTab === 'my' && (
                <MyTopics onSelectTopic={handleSelectTopic} />
              )}
            </>
          )}
        </div>

        {/* Create Topic Button - Only show if not viewing a topic and not in chatbot view */}
        {!selectedTopic && !showChatbot && !showAiContentGenerator && (
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
        )}

        {/* New Topic Modal */}
        <NewTopicModal 
          isOpen={isNewTopicModalOpen} 
          onClose={() => {
            setIsNewTopicModalOpen(false);
            setAiGeneratedContent(null);
          }} 
          onTopicCreated={handleTopicCreated}
          onAiGenerate={handleOpenAiContentGenerator}
          aiGeneratedContent={aiGeneratedContent}
        />
      </div>
    </WebSocketProvider>
  );
};

export default ForumSystem;
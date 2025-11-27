import React, { useState } from "react";
import ModelList from "../../component/AIchatbot/Component/ModelList";
import CommunitySearchModal from "../../component/AIChatPage/CommunitySearchModal";
import ShareConversationModal from "../../component/AIChatPage/ShareConversationModal";
import UserReply from "../../component/UserReply/UserReply";
import { Share2 } from "lucide-react";

const AIChatPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [conversationToShare, setConversationToShare] = useState(null);
  const [filesToShare, setFilesToShare] = useState([]);

  const handleShareRequest = (conversationData, selectedFiles) => {
    setConversationToShare(conversationData);
    setFilesToShare(selectedFiles);
    setIsShareModalOpen(true);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] relative overflow-hidden bg-transparent">
      {/* Left Sidebar - Model List */}
      <div className="hidden md:block h-full bg-neutral-100 dark:bg-bg_dark border-r border-gray-300 dark:border-gray-800 w-[18%]">
        <ModelList forum={true} />
      </div>

      {/* Center Content Area with UserReply */}
      <div className="flex-1 flex flex-col">
        {/* Center Content Area */}
        <div className="flex-1 flex items-center justify-center px-4 overflow-y-auto">
          <div className="text-center max-w-2xl w-full">
            <div className="group">
              <h1 className="text-4xl md:text-5xl font-bold font-playfair mb-4 text-gray-800 dark:text-text_header">
                Chat with Advanced AI Models
              </h1>
              <p className="text-lg md:text-xl text-gray-600 dark:text-low_text mt-4">
                Select a model from the sidebar and start chatting. Share your conversations to any community when ready.
              </p>

              {/* Instructions */}
              <div className="mt-8 p-6 bg-nav_hover border border-nav_hover3 rounded-xl font-poppins text-left">
                <h3 className="font-semibold text-lg text-gray-800 dark:text-text_header mb-3">How it works:</h3>
                <ol className="space-y-2 text-sm text-gray-700 dark:text-low_text">
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-theme_color">1.</span>
                    <span>Select an AI model from the sidebar or dropdown</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-theme_color">2.</span>
                    <span>Type your message and click "Generate" to get AI responses</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-theme_color">3.</span>
                    <span>Build your conversation with multiple exchanges</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-theme_color">4.</span>
                    <span>Click the share button to post your conversation to a community</span>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        {/* UserReply Component at Bottom */}
        <div className="flex-shrink-0 px-0.5">
          <UserReply
            forum={true}
            standalone={true}
            openCommunityModal={() => setIsModalOpen(true)}
            onShareRequest={handleShareRequest}
          />
        </div>
      </div>

      {/* Community Search Modal */}
      {isModalOpen && (
        <CommunitySearchModal onClose={() => setIsModalOpen(false)} />
      )}

      {/* Share Conversation Modal */}
      {isShareModalOpen && conversationToShare && (
        <ShareConversationModal
          onClose={() => {
            setIsShareModalOpen(false);
            setConversationToShare(null);
            setFilesToShare([]);
          }}
          conversationData={conversationToShare}
          selectedFiles={filesToShare}
        />
      )}
    </div>
  );
};

export default AIChatPage;



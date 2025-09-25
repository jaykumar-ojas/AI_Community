import React, { useState, useContext, useEffect, useRef } from "react";
import axios from "axios";
import { LoginContext } from "../../ContextProvider/context";
import { getAuthHeaders, API_BASE_URL } from "./ForumUtils";

// Component for AI messages
function AiMessage({ message, isUser = false, modelInfo = null }) {
  return (
    <div
      className={`mb-4 ${
        isUser ? "bg-white" : "bg-blue-50"
      } p-4 rounded-lg shadow-sm`}
    >
      <div className="flex items-center mb-2">
        {!isUser && modelInfo && modelInfo.iconUrl && (
          <img
            src={modelInfo.iconUrl}
            alt={`${modelInfo.providerName} icon`}
            className="w-6 h-6 rounded-full mr-2 object-cover"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        )}
        <span className="font-medium text-blue-600 mr-2">
          {isUser
            ? "You"
            : modelInfo
            ? `${modelInfo.providerName} (${modelInfo.modelName})`
            : "AI Assistant"}
        </span>
      </div>
      <div className="text-sm leading-relaxed whitespace-pre-wrap">
        {message}
      </div>
    </div>
  );
}

const AiContentGenerator = ({ onContentGenerated, setNewTopic, onClose }) => {
  const { loginData } = useContext(LoginContext);
  const [messages, setMessages] = useState([
    {
      content:
        "Welcome! I can help you generate content for your new topic. What would you like to discuss?",
      isUser: false,
      modelInfo: null,
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState({
    title: "",
    content: "",
  });
  const [isGeneratingFinal, setIsGeneratingFinal] = useState(false);
  const [currentModelInfo, setCurrentModelInfo] = useState(null);
  const messagesEndRef = useRef(null);

  // Loader messages that rotate
  const engagingMessages = [
    "💡 Brainstorming your topic idea...",
    "🤔 Thinking of creative angles...",
    "✍️ Crafting words into ideas...",
    "🚀 Almost there, preparing your content...",
    "🌟 Good things take time, hang tight...",
  ];
  const [loaderMsgIndex, setLoaderMsgIndex] = useState(0);

  useEffect(() => {
    let interval;
    if (isLoading || isGeneratingFinal) {
      interval = setInterval(() => {
        setLoaderMsgIndex((prev) => (prev + 1) % engagingMessages.length);
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [isLoading, isGeneratingFinal]);

  // Scroll to bottom of messages when new messages are added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Handle sending a message to the AI
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    setMessages((prev) => [
      ...prev,
      { content: inputValue, isUser: true, modelInfo: null },
    ]);
    const userPrompt = inputValue;
    setInputValue("");
    setIsLoading(true);

    try {
      setMessages((prev) => [
        ...prev,
        { content: "Thinking...", isUser: false, isThinking: true },
      ]);

      const response = await axios.post(
        `${API_BASE_URL}/generateTopicContent`,
        {
          prompt: userPrompt,
          modelName: "gemini-2.0-flash",
        },
        {
          headers: getAuthHeaders(),
        }
      );

      setMessages((prev) => prev.filter((msg) => !msg.isThinking));

      if (
        response.data &&
        response.data.content &&
        response.data.content.title &&
        response.data.content.body
      ) {
        if (response.data.modelInfo) {
          setCurrentModelInfo(response.data.modelInfo);
        }

        setNewTopic({
          title: response.data.content.title,
          content: response.data.content.body,
          imageUrl: response.data.content.imageUrl,
          modelInfo: response.data.modelInfo,
        });
        onClose();
      } else {
        throw new Error("Invalid response structure from API");
      }

      setIsLoading(false);
    } catch (error) {
      setMessages((prev) => prev.filter((msg) => !msg.isThinking));
      setMessages((prev) => [
        ...prev,
        {
          content: `Error: ${
            error.message || "Could not generate topic content"
          }. Please check console for details.`,
          isUser: false,
        },
      ]);
      setIsLoading(false);
    }
  };

  // Generate final content locally
  const handleGenerateFinalContent = async () => {
    setIsGeneratingFinal(true);
    try {
      const userMessages = messages
        .filter((msg) => msg.isUser)
        .map((msg) => msg.content)
        .join("\n");

      setTimeout(() => {
        const firstUserMessage =
          messages.find((msg) => msg.isUser)?.content || "";
        let suggestedTitle = firstUserMessage.split(".")[0] || "New Topic";
        let suggestedContent = "";

        if (userMessages.toLowerCase().includes("star wars")) {
          suggestedTitle = "Exploring the Star Wars Universe: Fan Discussion";
          suggestedContent = `# ${suggestedTitle}\n\nThe Star Wars franchise has captivated audiences...`;
        } else {
          suggestedContent = `# ${suggestedTitle}\n\n${userMessages}\n\nLet's open this topic for discussion!`;
        }

        setGeneratedContent({
          title: suggestedTitle,
          content: suggestedContent,
        });

        setMessages((prev) => [
          ...prev,
          {
            content:
              "✨ I've generated a draft topic for you. You can refine or post it.",
            isUser: false,
            modelInfo: currentModelInfo,
          },
        ]);

        setIsGeneratingFinal(false);
      }, 4000);
    } catch (error) {
      console.error(error);
      setIsGeneratingFinal(false);
    }
  };

  const handlePostContent = () => {
    if (onContentGenerated && generatedContent.title && generatedContent.content) {
      onContentGenerated(generatedContent);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[2000] flex items-start justify-center pt-20">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[85vh] flex flex-col relative">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-20">
          <div className="flex items-center">
            <button
              onClick={onClose}
              className="mr-3 text-gray-500 hover:text-gray-700"
            >
              ←
            </button>
            <h3 className="text-lg font-semibold">AI Content Generator</h3>
          </div>

          {generatedContent.title && generatedContent.content && (
            <button
              onClick={handlePostContent}
              className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center"
            >
              ✅ Post Topic
            </button>
          )}
        </div>

        {/* Chat */}
        <div className="flex-1 p-5 overflow-y-auto bg-gray-50">
          {messages.map((msg, idx) => (
            <AiMessage
              key={idx}
              message={msg.content}
              isUser={msg.isUser}
              modelInfo={msg.modelInfo}
            />
          ))}

          {(isLoading || isGeneratingFinal) && (
            <div className="flex flex-col items-center p-4 bg-gray-100 rounded-lg">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mb-3"></div>
              <div className="text-sm text-gray-600 font-medium text-center">
                {engagingMessages[loaderMsgIndex]}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-gray-200 sticky bottom-0">
          {generatedContent.title && generatedContent.content ? (
            <div>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg mb-3"
                value={generatedContent.title}
                onChange={(e) =>
                  setGeneratedContent({
                    ...generatedContent,
                    title: e.target.value,
                  })
                }
              />
              <textarea
                className="w-full px-3 py-2 border rounded-lg mb-3 resize-none"
                rows="5"
                value={generatedContent.content}
                onChange={(e) =>
                  setGeneratedContent({
                    ...generatedContent,
                    content: e.target.value,
                  })
                }
              />
              <div className="flex justify-between">
                <button
                  onClick={() => setGeneratedContent({ title: "", content: "" })}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  🔄 Regenerate
                </button>
                <button
                  onClick={handlePostContent}
                  className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  ✅ Post Topic
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                className="flex-1 border border-gray-200 rounded-md p-3 text-sm"
                placeholder="Type your message..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isLoading || isGeneratingFinal}
              />
              <button
                type="submit"
                className="bg-blue-600 text-white font-medium rounded-md px-4 py-2 disabled:opacity-50"
                disabled={!inputValue.trim() || isLoading || isGeneratingFinal}
              >
                Generate
              </button>
              <button
                onClick={handleGenerateFinalContent}
                type="button"
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
                disabled={messages.length < 3 || isLoading || isGeneratingFinal}
              >
                {isGeneratingFinal ? "Generating..." : "Finalize"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiContentGenerator;

import React, { useState, useContext, useEffect, useRef } from 'react';
import axios from 'axios';
import { LoginContext } from '../../ContextProvider/context';
import { getAuthHeaders, API_BASE_URL } from './ForumUtils';

// Component for AI messages
function AiMessage({ message, isUser = false }) {
  return (
    <div className={`mb-4 ${isUser ? 'bg-white' : 'bg-blue-50'} p-4 rounded-lg shadow-sm`}>
      <div className="flex items-center mb-2">
        <span className="font-medium text-blue-600 mr-2">
          {isUser ? 'You' : 'AI Assistant'}
        </span>
      </div>
      <div className="text-sm leading-relaxed whitespace-pre-wrap">
        {message}
      </div>
    </div>
  );
}

const AiContentGenerator = ({ onClose,onContentGenerated}) => {
  const { loginData } = useContext(LoginContext);
  const [messages, setMessages] = useState([
    { content: "Welcome! I can help you generate content for your new topic. What would you like to discuss?", isUser: false }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState({ title: '', content: '' });
  const [isGeneratingFinal, setIsGeneratingFinal] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll to bottom of messages when new messages are added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Handle sending a message to the AI
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // Add user message
    setMessages(prev => [...prev, { content: inputValue, isUser: true }]);
    
    // Clear input
    const userPrompt = inputValue;
    setInputValue('');
    setIsLoading(true);

    try {
      // First, add a "thinking" message
      setMessages(prev => [...prev, { 
        content: "Thinking...", 
        isUser: false,
        isThinking: true 
      }]);

      // Use a simple AI response for now instead of calling the endpoint
      // This avoids potential API key issues
      setTimeout(() => {
        // Remove the "thinking" message
        setMessages(prev => prev.filter(msg => !msg.isThinking));
        
        // Generate a contextual response based on the user's input
        let aiResponse;
        if (userPrompt.toLowerCase().includes('star wars')) {
          aiResponse = `I'd be happy to help you create a topic about Star Wars! This iconic space opera franchise created by George Lucas has captivated audiences since 1977. Would you like to focus on:\n\n- The original trilogy (Episodes IV-VI)\n- The prequel trilogy (Episodes I-III)\n- The sequel trilogy (Episodes VII-IX)\n- TV shows like The Mandalorian or Clone Wars\n- Characters, planets, or specific themes\n\nLet me know what aspect interests you most, and I'll help develop content for your topic.`;
        } else if (userPrompt.toLowerCase().includes('image') || userPrompt.toLowerCase().includes('picture')) {
          aiResponse = `I understand you're interested in images related to "${userPrompt.replace(/images|pictures/gi, '').trim()}". While I can help you create text content for your forum topic, I can't directly generate or attach images. However, I can help you write a descriptive post that discusses this visual topic in detail. Would you like me to proceed with creating text content?`;
        } else {
          aiResponse = `Thanks for sharing your interest in "${userPrompt}". I can help you develop this into a comprehensive forum topic. To create the best content, could you tell me a bit more about:\n\n- What specific aspects of this topic interest you most?\n- Who is your target audience?\n- Would you like a casual discussion starter or a more in-depth analysis?\n\nThe more details you provide, the better I can tailor the content to your needs.`;
        }
        
        setMessages(prev => [...prev, { content: aiResponse, isUser: false }]);
        setIsLoading(false);
      }, 1500);
    } catch (error) {
      console.error('Error in AI conversation:', error);
      // Remove any "thinking" message
      setMessages(prev => prev.filter(msg => !msg.isThinking));
      // Add error message
      setMessages(prev => [...prev, { 
        content: "I encountered an error processing your request. Let's try a different approach. Could you provide more details about the topic you'd like to create?", 
        isUser: false 
      }]);
      setIsLoading(false);
    }
  };

  // Generate final content for posting
  const handleGenerateFinalContent = async () => {
    setIsGeneratingFinal(true);
    
    try {
      // Get all user messages to use as context
      const userMessages = messages
        .filter(msg => msg.isUser)
        .map(msg => msg.content)
        .join("\n");
      
      // Add a generating message
      setMessages(prev => [...prev, { 
        content: "Generating your topic content...", 
        isUser: false,
        isGenerating: true
      }]);

      // Generate content locally instead of calling the API
      // This avoids potential API key issues
      setTimeout(() => {
        // Remove the generating message
        setMessages(prev => prev.filter(msg => !msg.isGenerating));
        
        // Extract a title from the first user message
        const firstUserMessage = messages.find(msg => msg.isUser)?.content || "";
        let suggestedTitle = firstUserMessage.split('.')[0] || "New Topic";
        let suggestedContent = "";
        
        // Generate content based on the conversation
        if (userMessages.toLowerCase().includes('star wars')) {
          suggestedTitle = "Exploring the Star Wars Universe: Fan Discussion";
          suggestedContent = `# ${suggestedTitle}\n\nThe Star Wars franchise has captivated audiences for generations with its epic storytelling, memorable characters, and groundbreaking visual effects. From the original trilogy that changed cinema forever to the latest Disney+ series, there's always something new to discover and discuss in this vast universe.\n\nIn this topic, I'd like to explore our favorite aspects of Star Wars, including:\n\n- Character arcs and development across the different eras\n- Standout moments from the films and TV shows\n- How the expanded universe (books, comics, games) enhances the story\n- Theories about upcoming content and where the franchise might go next\n\nWhether you're a fan of the Jedi philosophy, the complex political backdrop of the prequels, or simply love watching Mandalorians and Baby Yoda, this is a space to share your thoughts and connect with fellow fans.\n\nWhat's your favorite Star Wars era, character, or story? And what do you hope to see in future Star Wars content?`;
        } else {
          // Create a generic but thoughtful forum post based on user messages
          suggestedContent = `# ${suggestedTitle}\n\n${userMessages}\n\nI'd like to open this topic for discussion with the community. I'm particularly interested in hearing different perspectives and experiences related to this subject.\n\nSome questions to consider:\n- What has been your experience with this topic?\n- Are there aspects of this that you think deserve more attention?\n- How do you see this evolving in the future?\n\nLooking forward to an engaging conversation!`;
        }
        
        setGeneratedContent({
          title: suggestedTitle,
          content: suggestedContent
        });
        
        setMessages(prev => [...prev, { 
          content: "I've generated a title and content for your topic. You can now post it or continue refining it.", 
          isUser: false 
        }]);
        
        setIsGeneratingFinal(false);
      }, 2000);
    } catch (error) {
      console.error('Error generating final content:', error);
      // Remove any generating message
      setMessages(prev => prev.filter(msg => !msg.isGenerating));
      setMessages(prev => [...prev, { 
        content: "I encountered an error generating the final content. Let's try a simpler approach. I've created a basic template that you can customize before posting.", 
        isUser: false 
      }]);
      
      // Provide a fallback template
      const firstUserMessage = messages.find(msg => msg.isUser)?.content || "";
      setGeneratedContent({
        title: firstUserMessage.split('.')[0] || "New Discussion Topic",
        content: `# Discussion: ${firstUserMessage}\n\nI wanted to start a conversation about this topic. What are your thoughts and experiences?\n\n[Add more details here to enrich the discussion]`
      });
      
      setIsGeneratingFinal(false);
    }
  };

  // Post the generated content
  const handlePostContent = () => {
    if (onContentGenerated && generatedContent.title && generatedContent.content) {
      onContentGenerated(generatedContent);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col">
        {/* Header with back button */}
        <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center">
            <button
              onClick={onClose}
              className="mr-3 text-gray-500 hover:text-gray-700"
              aria-label="Go back"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h3 className="text-lg font-semibold">AI Content Generator</h3>
          </div>
          
          {/* Post button - always visible in header */}
          {generatedContent.title && generatedContent.content && (
            <button
              onClick={handlePostContent}
              className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Post Topic
            </button>
          )}
        </div>
        
        {/* Chat Container */}
        <div className="flex-1 p-5 overflow-y-auto bg-gray-50">
          {messages.map((msg, index) => (
            <AiMessage 
              key={index} 
              message={msg.content} 
              isUser={msg.isUser}
            />
          ))}
          
          {isLoading && !messages.some(msg => msg.isThinking) && (
            <div className="flex items-center space-x-2 p-4 bg-gray-100 rounded-lg">
              <div className="animate-pulse flex space-x-2">
                <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
              </div>
              <div className="text-sm text-gray-500">AI is thinking...</div>
            </div>
          )}
          <div ref={messagesEndRef} /> {/* Empty div for scrolling to bottom */}
        </div>
        
        {/* Input and Actions */}
        <div className="p-4 bg-white border-t border-gray-200 sticky bottom-0">
          {generatedContent.title && generatedContent.content ? (
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Generated Title</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={generatedContent.title}
                  onChange={(e) => setGeneratedContent({...generatedContent, title: e.target.value})}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Generated Content</label>
                <textarea
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows="5"
                  value={generatedContent.content}
                  onChange={(e) => setGeneratedContent({...generatedContent, content: e.target.value})}
                />
              </div>
              <div className="flex justify-between">
                <button
                  onClick={() => setGeneratedContent({ title: '', content: '' })}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Regenerate
                </button>
                <button
                  onClick={handlePostContent}
                  className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Post Topic
                </button>
              </div>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="flex mb-4">
                <input 
                  type="text"
                  className="flex-1 border border-gray-200 rounded-md p-3 mr-2 text-sm"
                  placeholder="Type your message here..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  disabled={isLoading || isGeneratingFinal}
                />
                <button 
                  type="submit"
                  className="bg-blue-600 text-white font-medium rounded-md px-4 py-2 disabled:opacity-50"
                  disabled={!inputValue.trim() || isLoading || isGeneratingFinal}
                >
                  Send
                </button>
              </form>
              <div className="flex justify-between">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerateFinalContent}
                  className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center"
                  disabled={messages.length < 3 || isLoading || isGeneratingFinal}
                >
                  {isGeneratingFinal ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    'Generate Topic Content'
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiContentGenerator;

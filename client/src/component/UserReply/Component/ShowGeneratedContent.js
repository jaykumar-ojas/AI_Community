import React, { useRef, useState, useEffect } from "react";
import { parseMarkdown } from "../../../utils/parseMarkdown";
import { useHighlightTheme } from "../../../hooks/useHighlightTheme";
import { useMathJax } from "../../../hooks/useMathJax";
import { CubeSpinner } from "../../ui/CubeSpinner";

const ShowGeneratedContent = ({ postingData, conversationHistory = [], scrollContainerRef }) => {
  const contentRef = useRef(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  useHighlightTheme();
  useMathJax(contentRef, [postingData]);

  // Auto-scroll function - always scroll to bottom during streaming
  const scrollToBottom = (forceScroll = false) => {
    if (scrollContainerRef?.current) {
      const container = scrollContainerRef.current;
      
      if (forceScroll) {
        // Force scroll to bottom (for streaming) - immediate scroll
        requestAnimationFrame(() => {
          container.scrollTop = container.scrollHeight;
        });
      } else {
        // Only scroll if near bottom (for regular updates)
        const isNearBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 50;
        if (isNearBottom) {
          container.scrollTop = container.scrollHeight;
        }
      }
    }
  };

  // Check if user has scrolled up (show scroll button)
  const checkScrollPosition = () => {
    if (scrollContainerRef?.current) {
      const container = scrollContainerRef.current;
      const isNearBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 100;
      setShowScrollButton(!isNearBottom);
    }
  };

  // Auto-scroll when content updates (especially during streaming)
  useEffect(() => {
    // Check if there's streaming content
    const hasStreamingContent = postingData.some(item => item.isLoading && item.aiText);
    if (hasStreamingContent) {
      scrollToBottom(true); // Force scroll during streaming
    } else {
      scrollToBottom(); // Normal scroll for completed content
    }
  }, [postingData]);

  // More aggressive auto-scroll during streaming
  useEffect(() => {
    const hasStreamingContent = postingData.some(item => item.isLoading && item.aiText);
    if (hasStreamingContent) {
      const interval = setInterval(() => {
        scrollToBottom(true); // Force scroll during streaming
      }, 30); // Check every 30ms during streaming for ultra-smooth experience
      
      return () => clearInterval(interval);
    }
  }, [postingData]);

  // Listen for scroll events
  useEffect(() => {
    const container = scrollContainerRef?.current;
    if (container) {
      container.addEventListener('scroll', checkScrollPosition);
      return () => container.removeEventListener('scroll', checkScrollPosition);
    }
  }, [scrollContainerRef]);

  if (!postingData || postingData.length === 0) return null;

  return (
    <div className="relative">
      <div
        ref={contentRef}
        className="flex flex-col gap-4 p-4 bg-gray-50 dark:bg-nav_hover"
      >
        {/* Conversation History Indicator */}
        {conversationHistory && conversationHistory.length > 0 && (
          <div className="flex justify-center mb-2">
            <div className="bg-blue-100 text-theme_color3 px-3 py-1 rounded-full text-xs font-medium shadow-sm">
              Memory Active • {conversationHistory.length} messages in history
            </div>
          </div>
        )}

        {postingData.map((item, index) => (
          <div key={index} className="flex flex-col gap-3">
            <ShowUserText userText={item.userText} />
            <ShowPrompt prompt={item.prompt} />
            {item.isLoading ? (
              item.loadingType === 'image' ? (
                <ImageSkeleton />
              ) : (
                // Show streaming text if available, otherwise show skeleton
                item.aiText ? (
                  <ShowAiText 
                    aiText={item.aiText} 
                    modelInfo={item.modelInfo}
                    isMemoryAware={conversationHistory && conversationHistory.length > 0}
                    isStreaming={true}
                  />
                ) : (
                  <TextSkeleton />
                )
              )
            ) : (
              <>
                <ShowAiText 
                  aiText={item.aiText} 
                  modelInfo={item.modelInfo}
                  isMemoryAware={conversationHistory && conversationHistory.length > 0}
                />
                <ShowUrl url={item.imageUrl} modelInfo={item.modelInfo} />
              </>
            )}
          </div>
        ))}
      </div>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <button
          onClick={() => {
            scrollToBottom(true); // Force scroll to bottom
          }}
          className="absolute bottom-4 right-4 bg-theme_color text-white p-2 rounded-full shadow-lg hover:bg-theme_color2 transition-colors z-10"
          title="Scroll to bottom"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
      )}
    </div>
  );
};

const ShowUserText = ({ userText }) => {
  if (!userText) return null;
  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] bg-theme_color font-manrope text-white px-4 py-2 rounded-2xl shadow-md text-sm">
        {userText}
      </div>
    </div>
  );
};

const ShowPrompt = ({ prompt }) => {
  if (!prompt) return null;
  return (
    <div className="flex justify-end">
      <div className="max-w-[70%] bg-blue-100 text-blue-800 px-3 py-2 rounded-2xl text-xs italic shadow-sm">
        {prompt}
      </div>
    </div>
  );
};

const ShowAiText = ({ aiText, modelInfo, isStreaming = false }) => {
  if (!aiText) return null;

  return (
    <div className="flex justify-start">
      <div className="max-w-[80%] bg-white font-poppins dark:bg-nav_hover2 px-4 py-3 rounded-2xl shadow-md text-sm text-gray-800 dark:text-low_text border dark:border-gray-700 border-gray-300">
        <div
          className="prose prose-sm text-gray-800"
          dangerouslySetInnerHTML={{ __html: parseMarkdown(aiText) }}
        />
        {/* Streaming indicator */}
        {isStreaming && (
          <div className="flex items-center gap-2 mt-2">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span className="text-xs text-blue-500 font-medium">Generating...</span>
          </div>
        )}
        {modelInfo && (
          <div className="mt-2 flex items-center space-x-2 text-xs text-gray-500">
            {modelInfo.iconUrl && (
              <img
                src={modelInfo.iconUrl}
                alt={`${modelInfo.providerName} icon`}
                className="w-4 h-4 rounded-full object-cover"
                onError={(e) => (e.target.style.display = "none")}
              />
            )}
            <span className="dark:text-theme_color3 font-semibold font-merriweather text-gray-500">
              {modelInfo.providerName} · {modelInfo.modelName}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

const ShowUrl = ({ url, modelInfo }) => {
  const [loaded, setLoaded] = useState(false);
  if (!url) return null;

  return (
    <div className="flex justify-start">
      <div className="max-w-[80%] bg-nav_hover2 rounded-2xl shadow-md overflow-hidden border border-gray-700">
        {modelInfo && (
          <div className="flex items-center justify-between p-2 border-b border-gray-500 ">
            <div className="text-xs text-low_text font-medium">
              Generated Image
            </div>
            <div className="flex items-center space-x-2">
              {modelInfo.iconUrl && (
                <img
                  src={modelInfo.iconUrl}
                  alt={`${modelInfo.providerName} icon`}
                  className="w-4 h-4 rounded-full object-cover"
                  onError={(e) => (e.target.style.display = "none")}
                />
              )}
              <span className="text-xs text-theme_color2 font-semibold">
                {modelInfo.providerName}
              </span>
            </div>
          </div>
        )}
        <div className="bg-white flex items-center justify-center min-h-[200px]">
          {!loaded && (
            <div className="py-6">
              <CubeSpinner size="w-12 h-12" color="orange" />
            </div>
          )}
          <img
            src={url}
            className={`max-h-[200px] w-auto object-contain ${loaded ? 'opacity-100' : 'opacity-0'}`}
            alt="Generated content"
            onLoad={() => setLoaded(true)}
            onError={(e) => (e.target.style.display = "none")}
          />
        </div>
      </div>
    </div>
  );
};

const TextSkeleton = () => (
  <div className="flex justify-start">
    <div className="max-w-[80%] bg-nav_hover2 px-4 py-3 rounded-2xl shadow-md text-sm border border-gray-100 w-full">
      <div className="mb-2">
        <LoadingMessage type="text" />
      </div>
      <div className="animate-pulse space-y-3">
        <div className="h-3 bg-gray-200 rounded w-5/6"></div>
        <div className="h-3 bg-gray-200 rounded w-4/6"></div>
        <div className="h-3 bg-gray-200 rounded w-3/6"></div>
      </div>
    </div>
  </div>
);

const ImageSkeleton = () => (
  <div className="flex justify-start">
    <div className="max-w-[80%] bg-nav_hover2 rounded-2xl shadow-md overflow-hidden border border-gray-700 w-full">
      <div className="flex flex-col items-center justify-center min-h-[200px] gap-3 p-4">
        <LoadingMessage type="image" />
        <CubeSpinner size="w-12 h-12" color="orange" />
      </div>
    </div>
  </div>
);

const LoadingMessage = ({ type = "text" }) => {
  const textPhrases = [
  "✨ Polishing your words...",
  "🧵 Weaving your ideas into text...",
  "🎯 Refining context and tone...",
  "🌊 Adding clarity and flow...",
  "📖 Crafting a narrative for you...",
  "🎨 Shaping ideas into meaning...",
  "🔍 Highlighting your key points...",
  "🕰️ Fine-tuning every detail...",
  "💡 Illuminating your thoughts...",
  "🖋️ Giving words their perfect form...",
  "🎶 Finding rhythm in your text...",
  "🪞 Reflecting your intent clearly...",
  "🛠️ Building structure and style...",
  "🚀 Elevating your expression...",
  "🌱 Nurturing your draft to grow...",
  "🔮 Sharpening your message...",
  "📐 Balancing tone and clarity...",
  "🪄 Sprinkling a touch of magic...",
  "🗝️ Unlocking the flow of words...",
  "🧩 Piecing thoughts together...",
  "🕊️ Smoothing out rough edges...",
  "🌟 Adding sparkle to your writing...",
  "📜 Unfolding your story...",
  "🧭 Guiding your ideas forward...",
  "🏗️ Constructing your final draft..."
];

  const imagePhrases = [
  "✨ Your image canvas is forming...",
  "🎨 Adding colors and textures...",
  "🌀 Polishing details for perfection...",
  "⚡ Almost ready... hang tight!",
  "🔮 Summoning creativity from the void...",
  "🖌️ Painting strokes of imagination...",
  "🌌 Mixing stardust with colors...",
  "⚙️ Aligning tiny artistic gears...",
  "🎭 Giving life to your vision...",
  "📸 Adjusting the perfect frame...",
  "🧩 Assembling all the creative pieces...",
  "🌈 Splashing a bit more color magic...",
  "🔍 Perfecting the tiniest details...",
  "💡 Bright ideas are sparking up...",
  "🚀 Creativity is blasting off...",
  "🌟 Adding some final sparkles...",
  "🧵 Weaving imagination into reality...",
  "🎇 Almost there, your masterpiece awaits...",
  "🔔 Just a moment, magic is ringing...",
  "🏆 Done soon — a work of art is coming!"
  ];
  const phrases = type === "image" ? imagePhrases : textPhrases;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % phrases.length);
    }, 4000);
    return () => clearInterval(id);
  }, [phrases.length]);

  return (
    <div className="text-xs md:text-sm font-medium bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
      {phrases[index]}
    </div>
  );
};

export default ShowGeneratedContent;
import React, { useRef } from "react";
import { parseMarkdown } from "../../../utils/parseMarkdown";
import { useHighlightTheme } from "../../../hooks/useHighlightTheme";
import { useMathJax } from "../../../hooks/useMathJax";

const ShowGeneratedContent = ({ postingData, conversationHistory = [] }) => {
  const contentRef = useRef(null);
  useHighlightTheme();
  useMathJax(contentRef, [postingData]);

  if (!postingData || postingData.length === 0) return null;

  return (
    <div
      ref={contentRef}
      className="flex flex-col gap-4 p-4 bg-gray-50 "
    >
      {/* Conversation History Indicator */}
      {conversationHistory && conversationHistory.length > 0 && (
        <div className="flex justify-center mb-2">
          <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium shadow-sm">
            Memory Active • {conversationHistory.length} messages in history
          </div>
        </div>
      )}

      {postingData.map((item, index) => (
        <div key={index} className="flex flex-col gap-3">
          <ShowUserText userText={item.userText} />
          <ShowPrompt prompt={item.prompt} />
          <ShowAiText 
            aiText={item.aiText} 
            modelInfo={item.modelInfo}
            isMemoryAware={conversationHistory && conversationHistory.length > 0}
          />
          <ShowUrl url={item.imageUrl} modelInfo={item.modelInfo} />
        </div>
      ))}
    </div>
  );
};

const ShowUserText = ({ userText }) => {
  if (!userText) return null;
  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] bg-blue-500 text-white px-4 py-2 rounded-2xl shadow-md text-sm">
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

const ShowAiText = ({ aiText, modelInfo }) => {
  if (!aiText) return null;

  return (
    <div className="flex justify-start">
      <div className="max-w-[80%] bg-white px-4 py-3 rounded-2xl shadow-md text-sm text-gray-800 border border-gray-100">
        <div
          className="prose prose-sm text-gray-800"
          dangerouslySetInnerHTML={{ __html: parseMarkdown(aiText) }}
        />
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
            <span>
              {modelInfo.providerName} · {modelInfo.modelName}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

const ShowUrl = ({ url, modelInfo }) => {
  if (!url) return null;

  return (
    <div className="flex justify-start">
      <div className="max-w-[80%] bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
        {modelInfo && (
          <div className="flex items-center justify-between p-2 border-b border-gray-100 bg-gray-50">
            <div className="text-xs text-gray-600 font-medium">
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
              <span className="text-xs text-gray-500">
                {modelInfo.providerName}
              </span>
            </div>
          </div>
        )}
        <div className="bg-white flex items-center justify-center">
          <img
            src={url}
            className="max-h-[200px] w-auto object-contain"
            alt="Generated content"
            onError={(e) => (e.target.style.display = "none")}
          />
        </div>
      </div>
    </div>
  );
};

export default ShowGeneratedContent;
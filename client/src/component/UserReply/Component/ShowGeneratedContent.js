import React, {useRef} from "react";
import {parseMarkdown} from "../../../utils/parseMarkdown";
import { useHighlightTheme } from "../../../hooks/useHighlightTheme";
import { useMathJax } from "../../../hooks/useMathJax";

const ShowGeneratedContent = ({ postingData }) => {
 const contentRef = useRef(null);
  useHighlightTheme();
  useMathJax(contentRef, [postingData]);
  if (!postingData || postingData.length === 0) return null;

  return (
 <div ref={contentRef} className="space-y-6 md:p-4">
      {postingData.map((item, index) => (
        <div key={index} className="border md:p-4 p-2 rounded-lg shadow-md bg-white">
          <ShowUserText userText= {item.userText} />
          <ShowPrompt prompt={item.prompt} />
          <ShowAiText aiText={parseMarkdown(item.aiText)} modelInfo={item.modelInfo} />
          <ShowUrl url={item.imageUrl} modelInfo={item.modelInfo} />
        </div>
      ))}
    </div>
  );
};


const ShowUserText = ({ userText }) => {
  if (!userText) return null;

  return (
    <div className="bg-blue-50 p-3 rounded-md shadow-sm mb-2">
      <h3 className="text-blue-700 text-sm font-semibold mb-2">User Input</h3>
      <div className="text-sm text-blue-800">{userText}</div>
    </div>
  );
};

const ShowPrompt = ({ prompt }) => {
  if (!prompt) return null;

  return (
    <div className="bg-gray-100 p-3 rounded-md shadow-sm mb-2">
      <h3 className="text-gray-700 text-sm font-semibold mb-2">Prompt</h3>
      <div className="text-sm italic text-gray-800">{prompt}</div>
    </div>
  );
};

const ShowAiText = ({ aiText, modelInfo }) => {
  if (!aiText) return null;

  return (
    <div className="bg-green-50 p-3 rounded-md shadow-sm mb-2">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-green-700 text-sm font-semibold">AI Response</h3>
        {modelInfo && (
          <div className="flex items-center space-x-2">
            {modelInfo.iconUrl && (
              <img 
                src={modelInfo.iconUrl} 
                alt={`${modelInfo.providerName} icon`}
                className="w-5 h-5 rounded-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            )}
            <div className="flex flex-col items-end">
              <span className="text-xs text-green-600 font-medium">
                {modelInfo.providerName}
              </span>
              <span className="text-xs text-gray-500">
                {modelInfo.modelName}
              </span>
            </div>
          </div>
        )}
      </div>
      <div className="text-sm text-green-800 whitespace-pre-wrap">

             dangerouslySetInnerHTML={{
                                   __html: parseMarkdown(aiText),
                                 }}
        </div>
    </div>
  );
};


const ShowUrl = ({ url, modelInfo }) => {
  if (!url) return null;

  return (
    <div className="mb-2">
      {/ Model Info Header for Images /}
      {modelInfo && (
        <div className="flex items-center justify-between mb-2 bg-purple-50 p-2 rounded-t-md">
          <h3 className="text-purple-700 text-sm font-semibold">Generated Image</h3>
          <div className="flex items-center space-x-2">
            {modelInfo.iconUrl && (
              <img 
                src={modelInfo.iconUrl} 
                alt={`${modelInfo.providerName} icon`}
                className="w-5 h-5 rounded-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            )}
            <div className="flex flex-col items-end">
              <span className="text-xs text-purple-600 font-medium">
                {modelInfo.providerName}
              </span>
              <span className="text-xs text-gray-500">
                {modelInfo.modelName}
              </span>
            </div>
          </div>
        </div>
      )}
      
      {/* Image Container */}
      <div className={`w-full max-h-[16px] rounded-lg bg-white flex items-center justify-center ${modelInfo ? 'rounded-t-none' : ''}`}>
        <img
          src={url}
          className="max-h-[200px] w-auto object-contain rounded-lg"
          alt="Generated content"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      </div>
    </div>
  );
};

export default ShowGeneratedContent;
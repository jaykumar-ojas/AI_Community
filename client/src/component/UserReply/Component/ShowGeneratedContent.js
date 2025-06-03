import React from "react";

const ShowGeneratedContent = ({ postingData }) => {
  if (!postingData || postingData.length === 0) return null;

  return (
    <div className="space-y-6 p-4">
      {postingData.map((item, index) => (
        <div key={index} className="border p-4 rounded-lg shadow-md bg-white">
          <ShowUserText userText={item.userText} />
          <ShowPrompt prompt={item.prompt} />
          <ShowAiText aiText={item.AiText} />
          <ShowUrl url={item.imageUrl} />
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

const ShowAiText = ({ aiText }) => {
  if (!aiText) return null;

  return (
    <div className="bg-green-50 p-3 rounded-md shadow-sm mb-2">
      <h3 className="text-green-700 text-sm font-semibold mb-2">AI Response</h3>
      <div className="text-sm text-green-800">{aiText}</div>
    </div>
  );
};

const ShowUrl = ({ url }) => {
  if (!url) return null;

  return (
    <div className="mb-2">
      <div className="w-full max-h-[200px] rounded-lg bg-white flex items-center justify-center">
        <img
          src={url}
          className="max-h-[200px] w-auto object-contain"
          alt="Generated content"
        />
      </div>
    </div>
  );
};

export default ShowGeneratedContent;

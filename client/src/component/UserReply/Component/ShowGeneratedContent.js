import React from "react";

const ShowGeneratedContent = ({ postingData }) => {
  return (
    <>
      {postingData && (
        <div className="space-y-4 p-4">
          <ShowUserText userText={postingData.userText} />
          <ShowPrompt prompt={postingData.prompt} />
          <ShowAiText aiText={postingData.AiText} />
          <ShowUrl url={postingData.imageUrl} />
        </div>

      )}
    </>
  );
};

const ShowUserText = ({ userText }) => {
  if (!userText || userText.length === 0) return null;

  return (
    <div className="bg-blue-50 p-3 rounded-md shadow-sm">
      <h3 className="text-blue-700 text-sm font-semibold mb-2">User Inputs</h3>
      {userText.map((content, index) => (
        <div key={index} className="text-sm text-blue-800 mb-1">
          {content}
        </div>
      ))}
    </div>
  );
};

const ShowPrompt = ({ prompt }) => {
  if (!prompt || prompt.length === 0) return null;

  return (
    <div className="bg-gray-100 p-3 rounded-md shadow-sm">
      <h3 className="text-gray-700 text-sm font-semibold mb-2">Prompts</h3>
      {prompt.map((content, index) => (
        <div key={index} className="text-sm italic text-gray-800 mb-1">
          {content}
        </div>
      ))}
    </div>
  );
};

const ShowAiText = ({ aiText }) => {
  if (!aiText || aiText.length === 0) return null;

  return (
    <div className="bg-green-50 p-3 rounded-md shadow-sm">
      <h3 className="text-green-700 text-sm font-semibold mb-2">AI Responses</h3>
      {aiText.map((content, index) => (
        <div key={index} className="text-sm text-green-800 mb-1">
          {content}
        </div>
      ))}
    </div>
  );
};


const ShowUrl = ({ url }) => {
  return (
    <>
      {url.map((imageUrl, index) => (
        <div
          key={index}
          className="w-full max-h-[200px] rounded-lg bg-white flex items-center justify-center mb-4"
        >
          <img
            src={imageUrl}
            className="max-h-[200px] w-auto object-contain"
            alt="Post content"
            onError={(e) => {
              console.error("Error loading image:", e);
              e.target.src = "https://via.placeholder.com/400x280?text=Image+Not+Available";
            }}
          />
        </div>
      ))}
    </>
  );
};

export default ShowGeneratedContent;

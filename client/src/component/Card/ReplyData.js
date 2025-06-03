import React from 'react';

const ReplyData = ({ content }) => {
  return (
    <div className="pt-2 text-sm text-text_content whitespace-pre-wrap leading-relaxed">
      {content?.map((item, index) => (
        <div key={index} className="mb-4">
          {item.userText && (
            <p className="mb-1 text-text_header font-serif italic">
              {item.userText}
            </p>
          )}
          {item.prompt && (
            <p className="mb-1 text-text_header font-mono uppercase tracking-wide">
              {item.prompt}
            </p>
          )}
          {item.aiText && (
            <p className="mb-1 text-text_header font-sans font-semibold">
              {item.aiText}
            </p>
          )}
          {item.imageUrl?.fileUrl && (
            <img
              src={item.imageUrl.fileUrl}
              alt={item.imageUrl.fileName || 'uploaded'}
              className="w-64 h-auto rounded-md mt-2"
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default ReplyData;

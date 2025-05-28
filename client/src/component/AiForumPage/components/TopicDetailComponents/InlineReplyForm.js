import React from 'react';
import ReplyForm from './ReplyForm';

const InlineReplyForm = ({
  replyingTo,
  replyContent,
  setReplyContent,
  replySelectedFiles,
  setReplySelectedFiles,
  loginData,
  parentUserName,
  depth,
  topic,
  emitNewReply,
  setError,
  setReplyingTo,
  setParentUserName
}) => {
  if (!replyingTo) return null;
  
  // Generate a color based on depth for thread lines
  const getThreadColor = (depth) => {
    const colors = [
      'border-blue-400', // Level 0
      'border-purple-400', // Level 1
      'border-green-400', // Level 2
      'border-yellow-400', // Level 3
      'border-red-400', // Level 4
      'border-pink-400', // Level 5
    ];
    return colors[depth % colors.length];
  };
  
  const threadColor = getThreadColor(depth);
  
  const handleReplyComplete = () => {
    setReplyingTo(null);
    setReplyContent('');
    setReplySelectedFiles([]);
    setParentUserName(null);
  };
  
  return (
    <div className={`mb-4 ml-${Math.min((depth + 1) * 4, 16)} relative`}>
      {/* Connecting line with animation - with lower z-index */}
      <div 
        className={`absolute left-0 top-0 bottom-0 border-l-2 ${threadColor} transition-all duration-300`} 
        style={{ 
          height: '100%', 
          left: `${depth * 16}px`,
          boxShadow: '0 0 5px rgba(0, 0, 0, 0.1)',
          zIndex: 1 // Lower z-index so it appears behind content
        }}
      ></div>
      <div 
        className={`absolute border-t-2 ${threadColor} transition-all duration-300`} 
        style={{ 
          width: '16px', 
          top: '24px', 
          left: `${depth * 16}px`,
          boxShadow: '0 0 5px rgba(0, 0, 0, 0.1)',
          zIndex: 1 // Lower z-index so it appears behind content
        }}
      ></div>
      
      <div className={`${threadColor.replace('border', 'border-l')} border-l-2 pl-2 relative z-10`}>
        <ReplyForm
          content={replyContent}
          setContent={setReplyContent}
          selectedFiles={replySelectedFiles}
          setSelectedFiles={setReplySelectedFiles}
          isReplyingToComment={true}
          parentUserName={parentUserName}
          loginData={loginData}
          topic={topic}
          parentReplyId={replyingTo}
          emitNewReply={emitNewReply}
          setError={setError}
          onReplyComplete={handleReplyComplete}
          threadColor={threadColor}
        />
      </div>
    </div>
  );
};

export default InlineReplyForm;

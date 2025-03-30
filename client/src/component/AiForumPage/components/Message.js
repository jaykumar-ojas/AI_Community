import React from 'react';
import { formatDate } from './ForumUtils';

const Message = ({ 
  content, 
  userName, 
  timestamp, 
  mediaAttachments = [], 
  isAuthor = false, 
  onDelete = null, 
  onLike, 
  onDislike, 
  likes = [], 
  dislikes = [], 
  currentUserId,
  replyId,
  onReply,
  depth = 0,
  hasChildren = false,
  showViewMoreButton = false,
  onViewMore = null,
  parentUserName = null
}) => {
  const isLiked = likes?.includes(currentUserId);
  const isDisliked = dislikes?.includes(currentUserId);
  const maxDepth = 3; // Maximum depth to show before pagination
  
  return (
    <div className={`mb-4 ${depth > 0 ? `ml-${Math.min(depth * 4, 12)}` : ''} relative`}>
      {/* Vertical connecting line for nested replies */}
      {depth > 0 && (
        <div 
          className="absolute left-0 top-0 bottom-0 border-l-2 border-gray-200" 
          style={{ height: '100%', left: `${(depth-1) * 16}px` }}
        ></div>
      )}
      
      {/* Horizontal connecting line for nested replies */}
      {depth > 0 && (
        <div 
          className="absolute border-t-2 border-gray-200" 
          style={{ width: '16px', top: '24px', left: `${(depth-1) * 16}px` }}
        ></div>
      )}
      
      {/* Reply indicator */}
      {parentUserName && depth > 0 && (
        <div className="text-xs text-gray-500 mb-1">
          Replying to <span className="font-medium text-blue-600">{parentUserName}</span>
        </div>
      )}
      
      <div className={`rounded-lg shadow-sm p-3 ${isAuthor ? 'bg-blue-50' : 'bg-white'} ${depth > 0 ? 'border-l border-gray-200' : ''}`}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center">
            <span className="font-medium text-blue-600 text-sm">{userName}</span>
            <span className="text-gray-400 text-xs ml-2">{formatDate(timestamp)}</span>
          </div>
          {onDelete && (
            <button
              onClick={onDelete}
              className="text-red-500 hover:text-red-700 ml-2"
              title="Delete"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
        
        <div className="text-gray-700 whitespace-pre-wrap text-sm">{content}</div>
        
        {/* Display media attachments */}
        {mediaAttachments && Array.isArray(mediaAttachments) && mediaAttachments.length > 0 && (
          <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
            {mediaAttachments.map((attachment, index) => (
              <div key={index} className="relative overflow-hidden rounded-md shadow-sm border border-gray-200 bg-gray-50" style={{ maxWidth: '120px', height: 'auto' }}>
                {attachment.fileType && attachment.fileType.startsWith('image/') ? (
                  <div className="relative" style={{ minHeight: '80px', maxHeight: '120px' }}>
                    <img
                      src={attachment.signedUrl}
                      alt={attachment.fileName}
                      className="w-full h-auto object-contain hover:scale-105 transition-transform duration-300"
                      style={{ maxHeight: '120px' }}
                      loading="lazy"
                      onError={(e) => {
                        console.error('Error loading image:', attachment.signedUrl);
                        e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Found';
                      }}
                    />
                  </div>
                ) : attachment.fileType && attachment.fileType.startsWith('video/') ? (
                  <div className="relative" style={{ minHeight: '80px', maxHeight: '120px' }}>
                    <video
                      controls
                      className="w-full h-auto"
                      style={{ maxHeight: '120px' }}
                      src={attachment.signedUrl}
                      preload="metadata"
                      onError={(e) => {
                        console.error('Error loading video:', attachment.signedUrl);
                      }}
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                ) : attachment.fileType && attachment.fileType.startsWith('audio/') ? (
                  <div className="p-2 bg-white rounded-md">
                    <audio
                      controls
                      className="w-full"
                      src={attachment.signedUrl}
                      preload="metadata"
                      onError={(e) => {
                        console.error('Error loading audio:', attachment.signedUrl);
                      }}
                    >
                      Your browser does not support the audio tag.
                    </audio>
                  </div>
                ) : (
                  <div className="p-2 flex items-center justify-center bg-white">
                    <a
                      href={attachment.signedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors duration-200 text-xs"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="truncate max-w-[60px]">{attachment.fileName}</span>
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        <div className="flex items-center mt-2 text-xs">
          <button
            onClick={onLike}
            className={`flex items-center mr-3 ${isLiked ? 'text-blue-600' : 'text-gray-500'} hover:text-blue-600`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill={isLiked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
            </svg>
            {likes?.length || 0}
          </button>
          <button
            onClick={onDislike}
            className={`flex items-center mr-3 ${isDisliked ? 'text-red-600' : 'text-gray-500'} hover:text-red-600`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill={isDisliked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018c.163 0 .326.02.485.06L17 4m-7 5v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 5h2m5 0v2a2 2 0 01-2 2h-2.5" />
            </svg>
            {dislikes?.length || 0}
          </button>
          <button
            onClick={() => onReply(replyId, userName)}
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            Reply
          </button>
        </div>
      </div>
      
      {/* View more button for deep nesting */}
      {showViewMoreButton && (
        <button 
          onClick={onViewMore}
          className="mt-2 text-sm text-blue-600 hover:text-blue-800 flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          Continue this thread
        </button>
      )}
    </div>
  );
};

export default Message; 
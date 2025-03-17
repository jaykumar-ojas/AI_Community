import React, { useContext } from 'react';
import { LoginContext } from '../../ContextProvider/context';
import { useWebSocket } from './WebSocketContext';
import { formatDate } from './ForumUtils';

const TopicList = ({ topics, onSelectTopic, onDeleteTopic, emptyMessage }) => {
  const { loginData } = useContext(LoginContext);

  return (
    <div className="divide-y">
      {topics.length > 0 ? (
        topics.map(topic => (
          <div
            key={topic._id}
            className="p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 cursor-pointer" onClick={() => onSelectTopic(topic)}>
                <h3 className="text-lg font-medium text-gray-900 mb-1">{topic.title}</h3>
                <p className="text-gray-600 text-sm line-clamp-2">{topic.content}</p>
                <div className="flex items-center mt-2 text-sm text-gray-500">
                  <span className="font-medium text-blue-600 mr-2">{topic.userName}</span>
                  <span className="mr-4">{formatDate(topic.createdAt)}</span>
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    {topic.replyCount || 0}
                  </span>
                </div>
              </div>
              
              {/* Delete button for topic owner or admin */}
              {(loginData?.validuserone?._id.toString() === topic.userId.toString() || loginData?.validuserone?.role === 'admin') && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteTopic(topic._id);
                  }}
                  className="text-red-500 hover:text-red-700 ml-4"
                  title="Delete topic"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        ))
      ) : (
        <div className="text-center text-gray-500 py-8">
          {emptyMessage || "No topics available"}
        </div>
      )}
    </div>
  );
};

export default TopicList; 
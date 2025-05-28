import React, { useState, useEffect, useContext } from 'react';
import { LoginContext } from '../../ContextProvider/context';
import { useWebSocket } from './WebSocketContext';
import axios from 'axios';
import { format } from 'date-fns';

const ForumDiscussion = ({ topic, onBack }) => {
  const { loginData } = useContext(LoginContext);
  const { joinTopic, leaveTopic, emitNewMessage, subscribeToEvent, isConnected } = useWebSocket();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Format date to "MM/DD/YYYY, HH:mm:ss AM/PM"
  const formatDate = (date) => {
    return format(new Date(date), "M/d/yyyy, h:mm:ss a");
  };

  useEffect(() => {
    if (topic && isConnected) {
      joinTopic(topic._id);
      fetchMessages();
    }
    return () => {
      if (topic && isConnected) {
        leaveTopic(topic._id);
      }
    };
  }, [topic?._id, isConnected]);

  const fetchMessages = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`/api/forum/messages?topicId=${topic._id}`);
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Message component
  const Message = ({ message }) => {
    const [isReplying, setIsReplying] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const [replyFiles, setReplyFiles] = useState([]);

    const handleReplyFileSelect = (e) => {
      const files = Array.from(e.target.files);
      setReplyFiles(files);
    };

    const handleSendReply = async () => {
      if (!replyContent.trim() && replyFiles.length === 0) return;

      try {
        const formData = new FormData();
        formData.append('content', replyContent);
        formData.append('topicId', topic._id);
        formData.append('parentMessageId', message._id);

        replyFiles.forEach(file => {
          formData.append('media', file);
        });

        const response = await axios.post('/api/forum/messages', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${loginData.token}`
          }
        });

        emitNewMessage(response.data.message);
        setReplyContent('');
        setReplyFiles([]);
        setIsReplying(false);
      } catch (error) {
        console.error('Error sending reply:', error);
      }
    };

    return (
      <div className="mb-4">
        <div className="flex items-start">
          <div className="flex-shrink-0 mr-3">
            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
              {message.userName[0].toUpperCase()}
            </div>
          </div>
          <div className="flex-grow">
            <div className="flex items-center">
              <span className="font-medium">{message.userName}</span>
              <span className="text-gray-500 text-sm ml-2">{formatDate(message.createdAt)}</span>
            </div>
            <div className="mt-1">
              <p className="text-gray-800">{message.content}</p>
              {message.mediaAttachments?.length > 0 && (
                <div className="mt-2 space-y-2">
                  {message.mediaAttachments.map((file, index) => (
                    <div key={index} className="inline-flex items-center bg-gray-100 rounded-lg p-2 mr-2">
                      <img src="/file-icon.png" alt="file" className="w-4 h-4 mr-2" />
                      <span className="text-sm text-gray-600">{file.fileName}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        {(file.fileSize / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-2">
              <button
                onClick={() => setIsReplying(!isReplying)}
                className="text-blue-600 text-sm hover:text-blue-800"
              >
                {isReplying ? 'Cancel' : 'Reply'}
              </button>
            </div>
            {isReplying && (
              <div className="mt-3 pl-4 border-l-2 border-gray-200">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write your reply..."
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                />
                <div className="mt-2 flex items-center justify-between">
                  <input
                    type="file"
                    multiple
                    onChange={handleReplyFileSelect}
                    className="text-sm"
                  />
                  <button
                    onClick={handleSendReply}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Send Reply
                  </button>
                </div>
                {replyFiles.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">Selected files:</p>
                    {replyFiles.map((file, index) => (
                      <div key={index} className="text-sm text-gray-500">
                        {file.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && selectedFiles.length === 0) return;

    try {
      const formData = new FormData();
      formData.append('content', newMessage);
      formData.append('topicId', topic._id);

      selectedFiles.forEach(file => {
        formData.append('media', file);
      });

      const response = await axios.post('/api/forum/messages', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${loginData.token}`
        }
      });

      emitNewMessage(response.data.message);
      setNewMessage('');
      setSelectedFiles([]);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="text-gray-600 hover:text-gray-800 mr-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-semibold">{topic.title}</h1>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : messages.length > 0 ? (
          messages.map((message) => (
            <Message key={message._id} message={message} />
          ))
        ) : (
          <div className="text-center text-gray-500 py-8">
            No messages yet. Start the conversation!
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t p-4">
        <div className="flex items-center space-x-2">
          <button className="p-2 text-gray-500 hover:text-gray-700">
            <label className="cursor-pointer">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              <input
                type="file"
                multiple
                className="hidden"
                onChange={(e) => setSelectedFiles(Array.from(e.target.files))}
              />
            </label>
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() && selectedFiles.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            Send
          </button>
        </div>
        {selectedFiles.length > 0 && (
          <div className="mt-2">
            <div className="text-sm text-gray-500">Selected files:</div>
            <div className="flex flex-wrap gap-2 mt-1">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center bg-gray-100 rounded px-2 py-1">
                  <span className="text-sm">{file.name}</span>
                  <button
                    onClick={() => setSelectedFiles(files => files.filter((_, i) => i !== index))}
                    className="ml-2 text-gray-500 hover:text-red-500"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForumDiscussion; 
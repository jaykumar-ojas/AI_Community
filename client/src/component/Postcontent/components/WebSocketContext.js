import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const WebSocketContext = createContext();

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  
  useEffect(() => {
    // Initialize socket connection
    const newSocket = io('http://localhost:8099');
    setSocket(newSocket);
    
    return () => {
      if (newSocket) newSocket.disconnect();
    };
  }, []);
  
  // Join a topic room
  const joinTopic = (topicId) => {
    if (socket && topicId) {
      socket.emit('join_topic', topicId);
    }
  };
  
  // Leave a topic room
  const leaveTopic = (topicId) => {
    if (socket && topicId) {
      socket.emit('leave_topic', topicId);
    }
  };
  
  // Emit new topic event
  const emitNewTopic = (topic) => {
    if (socket && topic) {
      socket.emit('new_topic', topic);
    }
  };
  
  // Emit new reply event
  const emitNewReply = (reply) => {
    if (socket && reply) {
      socket.emit('new_reply', reply);
    }
  };
  
  // Emit delete topic event
  const emitDeleteTopic = (topicId) => {
    if (socket && topicId) {
      socket.emit('delete_topic', topicId);
    }
  };
  
  // Emit delete reply event
  const emitDeleteReply = (replyId, topicId) => {
    if (socket && replyId && topicId) {
      socket.emit('delete_reply', { replyId, topicId });
    }
  };
  
  // Subscribe to socket events
  const subscribeToEvent = (event, callback) => {
    if (socket) {
      socket.on(event, callback);
      return () => socket.off(event, callback);
    }
    return () => {};
  };
  
  const value = {
    socket,
    joinTopic,
    leaveTopic,
    emitNewTopic,
    emitNewReply,
    emitDeleteTopic,
    emitDeleteReply,
    subscribeToEvent
  };
  /// git problem
  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export default WebSocketProvider; 
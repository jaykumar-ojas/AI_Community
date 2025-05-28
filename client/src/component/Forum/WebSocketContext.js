import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const WebSocketContext = createContext();

export const useWebSocket = () => {
  return useContext(WebSocketContext);
};

export const WebSocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const connectSocket = () => {
      try {
        // Connect to WebSocket server with reconnection options
        const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:8099', {
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          timeout: 20000,
          transports: ['websocket', 'polling']
        });

        // Connection event handlers
        newSocket.on('connect', () => {
          console.log('WebSocket connected');
          setIsConnected(true);
          setError(null);
        });

        newSocket.on('connect_error', (err) => {
          console.error('WebSocket connection error:', err);
          setError('Failed to connect to server');
          setIsConnected(false);
        });

        newSocket.on('disconnect', (reason) => {
          console.log('WebSocket disconnected:', reason);
          setIsConnected(false);
        });

        newSocket.on('reconnect', (attemptNumber) => {
          console.log('WebSocket reconnected after', attemptNumber, 'attempts');
          setIsConnected(true);
          setError(null);
        });

        newSocket.on('reconnect_error', (err) => {
          console.error('WebSocket reconnection error:', err);
          setError('Failed to reconnect to server');
        });

        setSocket(newSocket);

        return () => {
          if (newSocket) {
            newSocket.close();
          }
        };
      } catch (err) {
        console.error('Error initializing WebSocket:', err);
        setError('Failed to initialize WebSocket connection');
      }
    };

    const cleanup = connectSocket();
    return cleanup;
  }, []);

  // Join a topic room
  const joinTopic = (topicId) => {
    if (socket && isConnected) {
      socket.emit('join_topic', topicId);
    } else {
      console.warn('Cannot join topic: socket not connected');
    }
  };

  // Leave a topic room
  const leaveTopic = (topicId) => {
    if (socket && isConnected) {
      socket.emit('leave_topic', topicId);
    }
  };

  // Emit new message event
  const emitNewMessage = (message) => {
    if (socket && isConnected) {
      socket.emit('new_message', message);
    } else {
      console.warn('Cannot send message: socket not connected');
    }
  };

  // Emit delete message event
  const emitDeleteMessage = (messageId, topicId) => {
    if (socket && isConnected) {
      socket.emit('delete_message', messageId, topicId);
    } else {
      console.warn('Cannot delete message: socket not connected');
    }
  };

  // Subscribe to WebSocket events
  const subscribeToEvent = (event, callback) => {
    if (!socket) return () => {};

    socket.on(event, callback);
    return () => socket.off(event, callback);
  };

  const value = {
    socket,
    isConnected,
    error,
    joinTopic,
    leaveTopic,
    emitNewMessage,
    emitDeleteMessage,
    subscribeToEvent
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export default WebSocketProvider; 
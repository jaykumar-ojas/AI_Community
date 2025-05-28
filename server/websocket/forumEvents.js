const handleForumEvents = (io, socket) => {
  // Join a topic room
  socket.on('join_topic', (topicId) => {
    socket.join(`topic_${topicId}`);
  });

  // Leave a topic room
  socket.on('leave_topic', (topicId) => {
    socket.leave(`topic_${topicId}`);
  });

  // New message created
  socket.on('new_message', (message) => {
    io.to(`topic_${message.topicId}`).emit('message_created', message);
  });

  // Message deleted
  socket.on('delete_message', (messageId, topicId) => {
    io.to(`topic_${topicId}`).emit('message_deleted', messageId);
  });
};

module.exports = handleForumEvents; 
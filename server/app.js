const express = require("express");
const dotenv = require("dotenv"); // Import dotenv
const app = express();
const cors = require("cors");
const cookieparser= require("cookie-parser")
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: ["https://pixxelmind.com", "http://localhost:3000", "http://192.168.31.212:3000"],
    methods: ["GET", "POST"],
    credentials:true
  }
});

// importing route
const awsRoute = require("./routes/awsRoute");
const postRoute = require("./routes/postRoute");
const googleRoute = require("./routes/googleRoute");
const userRouter= require("./routes/userRoute")
const otpRouter = require("./routes/otpRoute");
const forgetOtpRoute = require("./routes/forgetOtpRoute");
const commentsRouter = require("./routes/comments"); 
const forumRoutes = require("./routes/forumRoutes");
const llmRoutes = require("./routes/llmRoute");
const llm = require("./routes/llmRoutes");
const batchRoutes = require("./routes/batchRoute");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const notificationRoutes = require("./routes/notificationRoute");

const bookMarkRoutes = require("./routes/bookMarkRoute");

const aiModelRoutes = require("./routes/aiModelRoutes");




// Load environment variables from .env file
dotenv.config();

const port = process.env.PORT || 8099; // Use environment variable or default to 8099

// Database connection
require("./db/conn");


// Database connection
require("./db/conn");

// for express json
app.use(express.json());

// for cors
app.use(
  cors({
      origin: ["http://localhost:3000","http://192.168.54.207:3000","http://192.168.43.202:3000","http://10.126.13.207:3000", "http://192.168.31.212:3000"], // Frontend URL
      methods:"GET,PUT,POST,DELETE,UPDATE",
      credentials: true,
  })
); 

// for sending cookies user credentials
app.use(cookieparser());

// Test route to verify server is running
app.get("/", (req, res) => {
  res.json({ message: "Server is running" });
});

// for google authenticating full code in googleroute in any problem

app.use("/",userRouter);
app.use("/",awsRoute);
app.use("/",postRoute);
app.use("/",googleRoute);
app.use("/",otpRouter);
app.use("/",forgetOtpRoute);
app.use("/", commentsRouter);
app.use("/forum", forumRoutes);
app.use("/", llmRoutes);
app.use("/", llm);
app.use("/", batchRoutes);
app.use("/", subscriptionRoutes);
app.use("/",notificationRoutes);
app.use("/",bookMarkRoutes);
app.use("/", aiModelRoutes);



// WebSocket event handlers
io.on('connection', (socket) => {
  // console.log('A user connected');

  // Join a topic room
  socket.on('join_topic', (topicId) => {
    const room = `topic_${topicId}`;
    socket.join(room);
    // console.log(`User joined room: ${room}`);
  });

  // Leave a topic room
  socket.on('leave_topic', (topicId) => {
    const room = `topic_${topicId}`;
    socket.leave(room);
    console.log(`User left room: ${room}`);
  });

  // New topic created
  socket.on('new_topic', (topic) => {
    io.emit('topic_created', topic);
  });

  // New reply added
  socket.on('new_reply', (reply) => {
    const room = `topic_${reply.topicId}`;
    // Broadcast to all clients in the room except the sender
    socket.to(room).emit('reply_created', reply);
    // Also emit to the sender to ensure they get the update
    socket.emit('reply_created', reply);
  });

  // Topic deleted
  socket.on('delete_topic', (topicId) => {
    io.emit('topic_deleted', topicId);
  });

  // Reply deleted
  socket.on('delete_reply', (data) => {
    const room = `topic_${data.topicId}`;
    io.to(room).emit('reply_deleted', data.replyId);
  });

  // Join a post room
  socket.on('join_post', (postId) => {
    const room = `post_${postId}`;
    socket.join(room);
  });

  // Leave a post room
  socket.on('leave_post', (postId) => {
    const room = `post_${postId}`;
    socket.leave(room);
  });

  // New comment created
  socket.on('new_comment', (comment) => {
    const room = `post_${comment.postId}`;
    // Broadcast to all clients in the room except the sender
    socket.to(room).emit('comment_created', comment);
    // Also emit to the sender to ensure they get the update
    socket.emit('comment_created', comment);
  });

  // Comment deleted
  socket.on('delete_comment', (data) => {
    const room = `post_${data.postId}`;
    io.to(room).emit('comment_deleted', data.commentId);
  });

  // Comment liked/disliked
  socket.on('comment_reaction', (data) => {
    const room = `post_${data.postId}`;
    io.to(room).emit('comment_reaction_updated', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Change app.listen to server.listen
server.listen(8099, () => {
  console.log("Server started at port 8099");
});

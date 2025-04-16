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
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
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
      origin: "http://localhost:3000", // Frontend URL
      methods:"GET,PUT,POST,DELETE,UPDATE",
      credentials: true,
  })
); 

// for sending cookies user credentials
app.use(cookieparser());

// for google authenticating full code in googleroute in any problem

app.use("/",userRouter);
app.use("/",awsRoute);
app.use("/",postRoute);
app.use("/",googleRoute);
app.use("/",otpRouter);
app.use("/",forgetOtpRoute);
app.use("/comments", commentsRouter);
app.use("/forum", forumRoutes);
app.use("/",llmRoutes);

// WebSocket event handlers
io.on('connection', (socket) => {
  console.log('A user connected');

  // Join a topic room
  socket.on('join_topic', (topicId) => {
    socket.join(`topic_${topicId}`);
  });

  // Leave a topic room
  socket.on('leave_topic', (topicId) => {
    socket.leave(`topic_${topicId}`);
  });

  // New topic created
  socket.on('new_topic', (topic) => {
    console.log("i ma going to emit new topic");
    io.emit('topic_created', topic);
  });

  // New reply added
  socket.on('new_reply', (reply) => {
    console.log("i m sending to frontend",reply);
    io.to(`topic_${reply.topicId}`).emit('reply_created', reply);
  });

  // Topic deleted
  socket.on('delete_topic', (topicId) => {
    io.emit('topic_deleted', topicId);
  });

  // Reply deleted
  socket.on('delete_reply', (data) => {
    io.to(`topic_${data.topicId}`).emit('reply_deleted', data.replyId);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Change app.listen to server.listen
server.listen(8099, () => {
  console.log("Server started at port 8099");
});

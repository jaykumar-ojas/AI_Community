const express = require("express");
const dotenv = require("dotenv"); // Import dotenv
const app = express();
const cors = require("cors");

const userRouter= require("./routes/userRoute")

// Load environment variables from .env file
dotenv.config();

const port = process.env.PORT || 8099; // Use environment variable or default to 8099

// Database connection
require("./db/conn");

// Define a basic route
// app.get("/", (req, res) => {
//   res.status(201).json("Server created");
// });


app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
      res.status(201).json("Server created");
    });
    
app.use(userRouter);

// Start the server
app.listen(port, () => {
  console.log(`Server started at port: ${port}`);
});

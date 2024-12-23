const express = require("express");
const dotenv = require("dotenv"); // Import dotenv
const app = express();
const cors = require("cors");
const cookieparser= require("cookie-parser")

// importing route
const awsRoute = require("./routes/awsRoute");
const postRoute = require("./routes/postRoute");
const googleRoute = require("./routes/googleRoute");
const userRouter= require("./routes/userRoute")

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

// Start the server
app.listen(port, () => {
  console.log(`Server started at port: ${port}`);
});

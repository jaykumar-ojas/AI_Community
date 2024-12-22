const express = require("express");
const dotenv = require("dotenv"); // Import dotenv
const app = express();
const cors = require("cors");
const cookieparser= require("cookie-parser")
const passport = require("passport");
const session = require("express-session");
const oauth2Strategy = require("passport-google-oauth2").Strategy;
const goodledb = require("./models/googleSchema");
const awsRoute = require("./routes/awsRoute");
const postRoute = require("./routes/postRoute");


const userRouter= require("./routes/userRoute")

// Load environment variables from .env file
dotenv.config();

const port = process.env.PORT || 8099; // Use environment variable or default to 8099

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

app.use(userRouter);

// for sending cookies user credentials
app.use(cookieparser());

// for google auth session

app.use(
  session({
      secret:"jdafslkhlusriyerghjfdksfa",
      resave:false,
      saveUninitialized:true
    })
)

app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new oauth2Strategy({
    clientID : process.env.CLIENT_ID,
    clientSecret : process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:8099/auth/google/callback",
    scope:["profile","email"]
  },  
  async(accessToken,refreshToken,profile,done)=>{
    console.log(profile);

    try{
      let googleuser = await goodledb.findOne({googleId : profile.id});

      if(!googleuser){
        googleuser = new goodledb({
          googleId:profile.id,
          displayName : profile.displayName,
          email : profile.emails[0].value,
          image : profile.photos[0].value
        });

        await googleuser.save();
      }
      return done(null,googleuser);
    }
    catch(error){
      return done(error,null)
    }
  }
)
)

passport.serializeUser((user,done)=>{
  done(null,user);
})

passport.deserializeUser((user,done)=>{
  done(null,user);
})

app.get("/",passport.authenticate("google",{scope:["profile","email"]}));

app.use("/",awsRoute);

app.use("/",postRoute);


app.get("/auth/google/callback",passport.authenticate("google",{
    successRedirect:"http://localhost:3000/",
    failureRedirect:"http://localhost:3000/login"
}))















// Start the server
app.listen(port, () => {
  console.log(`Server started at port: ${port}`);
});

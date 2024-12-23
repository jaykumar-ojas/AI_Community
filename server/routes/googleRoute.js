const passport = require("passport");
const express = require("express");
const router = new express.Router();
const goodledb = require('../models/googleSchema');


const session = require("express-session");
const oauth2Strategy = require("passport-google-oauth2").Strategy;

router.use(
  session({
    secret: "jdafslkhlusriyerghjfdksfa",
    resave: false,
    saveUninitialized: true,
  })
);

router.use(passport.initialize());
router.use(passport.session());

passport.use(
  new oauth2Strategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "http://localhost:8099/auth/google/callback",
      scope: ["profile", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      console.log(profile);

      try {
        let googleuser = await goodledb.findOne({ googleId: profile.id });

        if (!googleuser) {
          googleuser = new goodledb({
            googleId: profile.id,
            displayName: profile.displayName,
            email: profile.emails[0].value,
            image: profile.photos[0].value,
          });

          await googleuser.save();
        }
        return done(null, googleuser);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

router.get(
  "/",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    successRedirect: "http://localhost:3000/",
    failureRedirect: "http://localhost:3000/*",
  })
);

router.get("/",passport.authenticate("google",{scope:["profile","email"]}));

module.exports= router;


// for google auth session

// app.use(
//   session({
//       secret:"jdafslkhlusriyerghjfdksfa",
//       resave:false,
//       saveUninitialized:true
//     })
// )

// app.use(passport.initialize());
// app.use(passport.session());

// passport.use(
//   new oauth2Strategy({
//     clientID : process.env.CLIENT_ID,
//     clientSecret : process.env.CLIENT_SECRET,
//     callbackURL: "http://localhost:8099/auth/google/callback",
//     scope:["profile","email"]
//   },  
//   async(accessToken,refreshToken,profile,done)=>{
//     console.log(profile);

//     try{
//       let googleuser = await goodledb.findOne({googleId : profile.id});

//       if(!googleuser){
//         googleuser = new goodledb({
//           googleId:profile.id,
//           displayName : profile.displayName,
//           email : profile.emails[0].value,
//           image : profile.photos[0].value
//         });

//         await googleuser.save();
//       }
//       return done(null,googleuser);
//     }
//     catch(error){
//       return done(error,null)
//     }
//   }
// )
// )

// passport.serializeUser((user,done)=>{
//   done(null,user);
// })

// passport.deserializeUser((user,done)=>{
//   done(null,user);
// })

// app.get("/auth/google/callback",passport.authenticate("google",{
//   successRedirect:"http://localhost:3000/",
//   failureRedirect:"http://localhost:3000/login"
// }))

// app.get("/",passport.authenticate("google",{scope:["profile","email"]}));

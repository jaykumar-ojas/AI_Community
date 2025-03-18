const passport = require("passport");
const express = require("express");
const router = new express.Router();
const goodledb = require('../models/googleSchema');
const jwt = require("jsonwebtoken");

const keySecret = "8eH3$!q@LkP%zT^Xs#fD9&hVJ*aR07v";
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
      try {
        let googleuser = await goodledb.findOne({ googleId: profile.id });

        if (!googleuser) {
          googleuser = new goodledb({
            googleId: profile.id,
            userName: profile.displayName,
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

router.get("/",passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "http://localhost:3000/login",
  }),
  async (req, res) => {
    try {
      const googleUser = req.user;
      console.log(googleUser);

      // Generate JWT token
      const token = await googleUser.generateAuthToken();
      console.log(token);

      // Optionally, set a cookie for the token
      res.cookie("usercookie", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 3600000, // 1 hour
      });

      // Redirect to frontend with token
      console.log("we redirect to dashboard");
      res.redirect(`http://localhost:3000?token=${token}`);
      console.log("we are succesfully redirect")
    } catch (error) {
      res.redirect("http://localhost:3000/login");
    }
  }
);

router.get("/",passport.authenticate("google",{scope:["profile","email"]}));

module.exports= router;
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const mongoose = require("mongoose");
const keys = require("../config/keys");

// access user model class
const User = mongoose.model("users");

// takes in the user that was just pulled from the database and serializes it for cookie
passport.serializeUser((user, done) => {
  // user.id here is not googleId, it is an unique ID generated by mongo
  // using mongo's ID allows for facebook auth in future and not just google auth
  done(null, user.id);
});

// function to deserialize user.id into a user model
passport.deserializeUser((id, done) => {
  // promise returned for asynchronous call to database
  User.findById(id).then(user => {
    done(null, user);
  });
});

passport.use(
  new GoogleStrategy(
    {
      clientID: keys.googleClientID,
      clientSecret: keys.googleClientSecret,
      callbackURL: "/auth/google/callback"
    },
    (accessToken, refreshToken, profile, done) => {
      User.findOne({ googleId: profile.id }).then(existingUser => {
        if (existingUser) {
          // profile ID already exists in database
          // done is a callback you have to call after work is done in passport,
          // first argument is an error object if one exists
          done(null, existingUser);
        } else {
          // creates a new model instance and saves it to the database
          new User({ googleId: profile.id })
            .save()
            // needs to be a promise because saving to database is asynchronous
            // the user here is a separate model instance returned from database
            .then(user => done(null, user));
        }
      });
    }
  )
);

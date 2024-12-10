require("dotenv").config();
const express = require("express");
const cors = require("cors");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const GitHubStrategy = require("passport-github").Strategy;
const passportJWT = require("passport-jwt");
const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;
const { User } = require("./models");  
require("dotenv").config();

const app = express();

 app.use(
  cors({
    origin: "http://localhost:5173",  
    methods: ["GET", "POST"],
    credentials: true,  
  })
);

// Passport Strategies
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const [user, created] = await User.findOrCreate({
          where: { oauthId: profile.id }, 
          defaults: {
            name: profile.displayName,
            email: profile.emails[0]?.value,
          },
        });

         if (created || !user.userId) {
           const token = jwt.sign({ oauthId: user.oauthId, isNew: true }, process.env.JWT_SECRET, {
            expiresIn: "1h",
          });
          return done(null, { token, isNew: true });
        }

        // Existing user with userId
        const token = jwt.sign({ userId: user.userId }, process.env.JWT_SECRET, { expiresIn: "1h" });
        return done(null, { token });
      } catch (error) {
        return done(error);
      }
    }
  )
);

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: "/auth/github/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const [user, created] = await User.findOrCreate({
          where: { oauthId: profile.id },  
          defaults: {
            name: profile.displayName,
            email: profile.emails[0]?.value,
          },
        });

        // Check if userId is set
        if (created || !user.userId) {
           const token = jwt.sign({ oauthId: user.oauthId, isNew: true }, process.env.JWT_SECRET, {
            expiresIn: "1h",
          });
          return done(null, { token, isNew: true });
        }

         const token = jwt.sign({ userId: user.userId }, process.env.JWT_SECRET, { expiresIn: "1h" });
        return done(null, { token });
      } catch (error) {
        return done(error);
      }
    }
  )
);

passport.use(
  new JWTStrategy(
    {
      jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
    },
    (jwtPayload, done) => {
      return done(null, jwtPayload);
    }
  )
);

app.use(passport.initialize());

// Routes

// Google OAuth
app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"], session: false }));
app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/", session: false }),
  (req, res) => {
    const { token, isNew } = req.user;
    if (isNew) {
      res.redirect(`http://localhost:5173/userid?token=${token}`);
    } else {
      res.redirect(`http://localhost:5173/home?token=${token}`);
    }
  }
);

// GitHub OAuth
app.get("/auth/github", passport.authenticate("github", { session: false }));
app.get(
  "/auth/github/callback",
  passport.authenticate("github", { failureRedirect: "/", session: false }),
  (req, res) => {
    const { token, isNew } = req.user;
    if (isNew) {
      res.redirect(`http://localhost:5173/userid?token=${token}`);
    } else {
      res.redirect(`http://localhost:5173/home?token=${token}`);
    }
  }
);

// Set UserId
app.post("/userid", passport.authenticate("jwt", { session: false }), async (req, res) => {
  const { userId } = req.body;
  const { oauthId } = req.user;

  if (!userId) {
    return res.status(400).json({ message: "userId is required" });
  }

  try {
    // Ensure userId is unique
    const existingUser = await User.findOne({ where: { userId } });
    if (existingUser) {
      return res.status(409).json({ message: "userId already exists" });
    }

    // Update the user's record with the userId
    const user = await User.findOne({ where: { oauthId } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.userId = userId;
    await user.save();

    const token = jwt.sign({ userId: user.userId }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.status(200).json({ token });
  } catch (error) {
    console.error("Error setting userId:", error);
    res.status(500).json({ message: "Error setting userId" });
  }
});

 app.get("/home", passport.authenticate("jwt", { session: false }), (req, res) => {
  res.json({ message: "Welcome to your home page!", user: req.user });
});

 app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});

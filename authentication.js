require("dotenv").config();
const express = require("express");
const cors = require("cors");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const GitHubStrategy = require("passport-github").Strategy;
const passportJWT = require("passport-jwt");
const { User } = require("./models");
const fetch = require("node-fetch");

const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;

const app = express();

// Middleware
app.use(express.json()); // Parse JSON request bodies
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  })
);
app.use(passport.initialize());

// Google OAuth Callback
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
            oauthId: profile.id,
          },
        });

        // Include `userId` in the JWT payload
        const tokenPayload = {
          oauthId: user.oauthId,
          userId: user.userId || null, // Include userId if available
          isNew: created,
        };

        const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: "7d" });
        return done(null, { token, isNew: created });
      } catch (error) {
        return done(error);
      }
    }
  )
);

// GitHub OAuth Callback
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: "/auth/github/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let email = profile.emails?.[0]?.value;
        if (!email) {
          const response = await fetch("https://api.github.com/user/emails", {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          const emails = await response.json();
          email = emails.find((email) => email.primary)?.email || emails[0]?.email;
        }

        const [user, created] = await User.findOrCreate({
          where: { oauthId: profile.id },
          defaults: {
            name: profile.displayName,
            email,
          },
        });

        // Include `userId` in the JWT payload
        const tokenPayload = {
          oauthId: user.oauthId,
          userId: user.userId || null, // Include userId if available
          isNew: created,
        };

        const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: "7d" });
        return done(null, { token, isNew: created });
      } catch (error) {
        return done(error);
      }
    }
  )
);


// JWT Strategy
passport.use(
  new JWTStrategy(
    {
      jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
    },
    (jwtPayload, done) => {
      if (!jwtPayload) {
        return done(null, false, { message: "Invalid token" });
      }
      return done(null, jwtPayload);
    }
  )
);

// Routes

// OAuth Routes
app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"], session: false }));

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/", session: false }),
  async (req, res) => {
    try {
      const { token, isNew } = req.user;

       const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findOne({ where: { oauthId: decoded.oauthId } });

      if (!user) {
        console.error("Error: User not found in the database.");
        return res.redirect("http://localhost:5173/error");
      }

       if (!user.userId || user.userId.trim() === "") {
        return res.redirect(`http://localhost:5173/userid?token=${token}`);
      }

       res.redirect(`http://localhost:5173/home?token=${token}`);
    } catch (error) {
      console.error("Error during Google callback:", error);
      res.redirect("http://localhost:5173/error");
    }
  }
);

app.get("/auth/github", passport.authenticate("github", { session: false }));

app.get(
  "/auth/github/callback",
  passport.authenticate("github", { failureRedirect: "/", session: false }),
  async (req, res) => {
    try {
      const { token, isNew } = req.user;

      // Fetch the user details from the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findOne({ where: { oauthId: decoded.oauthId } });

      if (!user) {
        console.error("Error: User not found in the database.");
        return res.redirect("http://localhost:5173/error");
      }

      // Redirect to /userid if the userId is null or empty
      if (!user.userId || user.userId.trim() === "") {
        return res.redirect(`http://localhost:5173/userid?token=${token}`);
      }

      // Otherwise, redirect to home
      res.redirect(`http://localhost:5173/home?token=${token}`);
    } catch (error) {
      console.error("Error during GitHub callback:", error);
      res.redirect("http://localhost:5173/error");
    }
  }
);

app.post(
  "/userid",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const { userId } = req.body;
      const { oauthId } = req.user;

      if (!userId || typeof userId !== "string" || !userId.trim()) {
        return res.status(400).json({ message: "Valid userId is required" });
      }

      const user = await User.findOne({ where: { oauthId } });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const existingUser = await User.findOne({ where: { userId } });
      if (existingUser) {
        return res.status(409).json({ message: "userId already exists" });
      }

      user.userId = userId.trim();
      await user.save();

      // Create a new token with the updated userId
      const token = jwt.sign(
        { oauthId: user.oauthId, userId: user.userId },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      // Debugging: Log the new token
      console.log("New JWT Token Payload:", { oauthId: user.oauthId, userId: user.userId });

      res.status(200).json({ token });
    } catch (error) {
      console.error("Error processing /userid request:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);




 app.get("/home", passport.authenticate("jwt", { session: false }), (req, res) => {
  res.json({ message: "Welcome to your home page!", user: req.user });
});

 app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});

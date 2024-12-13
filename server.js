const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { sequelize, Project } = require("./models");

const app = express();
const PORT = 4000;

// Middleware
app.use(cors({
  origin: "http://localhost:5173", // Replace with your frontend URL
  methods: ["GET", "POST", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(bodyParser.json());

// JWT Authentication Middleware
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(" ")[1];

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: "Invalid or expired token" });
      }

      // Attach userId and full JWT payload to request
      req.userId = decoded.userId; // Ensure userId is accessible
      req.user = decoded;
      console.log("Decoded JWT Payload:", decoded);

      next();
    });
  } else {
    res.status(401).json({ message: "Authorization token required" });
  }
};



// Routes
app.get("/", (req, res) => res.send("Welcome to the Projects API"));

// Get All Projects (Optional: Filter by userId)
app.get("/projects", authenticateJWT, async (req, res) => {
  try {
    // Fetch projects for the authenticated user
    const projects = await Project.findAll({ where: { userId: req.userId } });
    res.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ message: "Error fetching projects" });
  }
});

// Create a New Project
app.post('/projects', authenticateJWT, async (req, res) => {
  try {
    const { name, description, url, language, visibility } = req.body;
    const userId = req.userId; // Use the verified user ID from middleware
    console.log(userId)

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const project = await Project.create({
      name,
      description,
      url,
      language,
      visibility,
      userId  // Ensure this matches your model's column name
    });

    res.status(201).json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ message: 'Error creating project', error: error.message });
  }
});

// Delete a Project
app.delete("/projects/:id", authenticateJWT, async (req, res) => {
  const { id } = req.params;

  try {
    // Ensure only the owner can delete their project
    const deleted = await Project.destroy({
      where: { id, userId: req.userId }, // Match userId as well
    });

    if (deleted) {
      res.status(204).send();
    } else {
      res.status(404).json({ message: "Project not found or not authorized" });
    }
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({ message: "Error deleting project" });
  }
});

// Start Server
app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  await sequelize.sync({ force: false });
  console.log("Database connected!");
});
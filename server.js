const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { sequelize, Project } = require("./models");

const app = express();
const PORT = 4000;

app.use(cors());
app.use(bodyParser.json());

 app.get("/", (req, res) => res.send("Welcome to the Projects API"));

 app.get("/projects", async (req, res) => {
  try {
    const projects = await Project.findAll();
    res.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ message: "Error fetching projects" });
  }
});

 app.post("/projects", async (req, res) => {
  const { name, url, description, language, visibility } = req.body;

  try {
    const newProject = await Project.create({ name, url, description, language, visibility });
    res.status(201).json(newProject);
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({ message: "Error creating project" });
  }
});

 app.delete("/projects/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await Project.destroy({ where: { id } });
    if (deleted) {
      res.status(204).send();
    } else {
      res.status(404).json({ message: "Project not found" });
    }
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({ message: "Error deleting project" });
  }
});

 app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  await sequelize.sync({ force: false });  
  console.log("Database connected!");
});

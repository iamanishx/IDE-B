require("dotenv").config();  
const { Sequelize, DataTypes } = require("sequelize");

 const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: "postgres",
  logging: false, 
});

 const User = require("./models/user")(sequelize, DataTypes);
const Project = require("./models/project")(sequelize, DataTypes);

// Apply associations
User.associate({ Project });
Project.associate({ User });

// Sync database
async function syncDatabase() {
  try {
    await sequelize.sync({ force: false }); 
    console.log("Database synchronized successfully!");
  } catch (error) {
    console.error("Error syncing the database:", error);
  }
}

syncDatabase();

module.exports = { sequelize, User, Project };

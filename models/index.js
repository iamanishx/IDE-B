require("dotenv").config();
const { Sequelize, DataTypes } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
    logging: false,
  }
);

const User = require("./user")(sequelize, DataTypes);
const Project = require("./project")(sequelize, DataTypes);

// Define associations
User.hasMany(Project, { foreignKey: "userId", sourceKey: "userId", as: "projects" });
Project.belongsTo(User, { foreignKey: "userId", targetKey: "userId", as: "user" });

module.exports = { sequelize, User, Project };

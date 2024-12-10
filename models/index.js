require("dotenv").config();
const { Sequelize, DataTypes } = require("sequelize");
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
  }
);

const User = require("./user")(sequelize, DataTypes);
const Project = require("./project")(sequelize, DataTypes);

 
User.hasMany(Project, { foreignKey: "user_id", as: "projects" });
Project.belongsTo(User, { foreignKey: "user_id", as: "user" });

module.exports = { sequelize, User, Project };

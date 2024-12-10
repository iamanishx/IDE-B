const { Sequelize, DataTypes } = require("sequelize");

const sequelize = new Sequelize("projects_db", "postgres", "mbxd", {
  host: "localhost",
  dialect: "postgres",
});

const Project = require("./models/project")(sequelize, DataTypes);

module.exports = { sequelize, Project };
 
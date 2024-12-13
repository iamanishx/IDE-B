const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Project = sequelize.define(
    "Project",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
       language: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      visibility: {
        type: DataTypes.ENUM("public", "private"),
        allowNull: false,
        defaultValue: "private",
      },
      userId: {
        type: DataTypes.STRING, // Ensure it's the same type as in User model
        allowNull:false,
        references: {
          model: "users",
          key: "userId", // Point to the userId field in the User model
        },
        onDelete: "CASCADE",
      },
    },
    {
      timestamps: true,
      tableName: "projects",
    }
  );

  return Project;
};

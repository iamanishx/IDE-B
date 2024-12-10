module.exports = (sequelize, DataTypes) => {
  const Project = sequelize.define("Project", {
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
      defaultValue: "public",
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  });

  // Define Associations
  Project.associate = (models) => {
    Project.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "user",
      onDelete: "CASCADE",
    });
  };

  return Project;
};

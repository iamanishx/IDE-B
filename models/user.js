module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define("User", {
    oauthId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: true,  
      unique: true,  
    },
  });

  // Define Associations
  User.associate = (models) => {
    User.hasMany(models.Project, {
      foreignKey: "user_id",
      as: "projects", 
    });
  };

  return User;
};

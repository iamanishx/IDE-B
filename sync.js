require("dotenv").config();
const { sequelize } = require("./models/index");

(async () => {
  try {
    await sequelize.sync({ force: false }); // Use `force: true` to reset the database
    console.log("Database synced successfully!");
    process.exit(0); // Exit the process on success
  } catch (error) {
    console.error("Error syncing database:", error);
    process.exit(1); // Exit with an error code
  }
})();

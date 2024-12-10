const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('new_projects_db', 'postgres', 'xdmb', {
  host: 'localhost',
  dialect: 'postgres',
});

sequelize
  .authenticate()
  .then(() => {
    console.log('Connection has been established successfully.');
  })
  .catch((error) => {
    console.error('Unable to connect to the database:', error);
  });

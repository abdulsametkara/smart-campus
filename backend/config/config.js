require('dotenv').config();

const common = {
  username: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'campus123',
  database: process.env.DB_NAME || 'campus_db',
  dialect: 'postgres',
};

module.exports = {
  development: {
    ...common,
    host: process.env.DB_HOST || 'localhost',
    logging: false,
  },
  test: {
    username: process.env.DB_USER || 'admin',
    password: process.env.DB_PASSWORD || 'campus123',
    database: process.env.DB_NAME_TEST || 'campus_db_test',
    host: process.env.DB_HOST || 'localhost',
    dialect: 'postgres',
    logging: false,
  },
  production: {
    ...common,
    host: process.env.DB_HOST || 'postgres',
    logging: false,
  },
};

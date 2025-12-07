'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
// Prefer config.js (env-aware, JS) if available, otherwise fallback to config.json
let config;
const db = {};
let sequelize;

if (env === 'test') {
  sequelize = new Sequelize('sqlite::memory:', {
    dialect: 'sqlite',
    logging: false
  });
} else {
  const configJsPath = path.join(__dirname, '..', 'config', 'config.js');
  if (fs.existsSync(configJsPath)) {
    // eslint-disable-next-line import/no-dynamic-require, global-require
    config = require(configJsPath)[env];
  } else {
    // eslint-disable-next-line global-require
    config = require(__dirname + '/../config/config.json')[env];
  }

  if (config.use_env_variable) {
    sequelize = new Sequelize(process.env[config.use_env_variable], config);
  } else {
    sequelize = new Sequelize(config.database, config.username, config.password, config);
  }
}

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;

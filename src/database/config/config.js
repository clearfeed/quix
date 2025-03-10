'use strict';

require('dotenv').config();

module.exports = {
  development: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    dialect: 'postgres',
    dialectOptions: {
      ssl: false
    },
    define: {
      underscored: true,
      timestamps: true
    }
  },
  production: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    define: {
      underscored: true,
      timestamps: true
    }
  }
}; 
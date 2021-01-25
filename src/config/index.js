const dotenv = require('dotenv');

dotenv.config();

module.exports = {
  nodeEnv: process.env.NODE_ENV,
  logging: process.env.LOG_LEVEL,
  port: process.env.APP_PORT,
  appName: process.env.APP_NAME,
  version: process.env.APP_VERSION,
  minVersion: process.env.APP_MIN_VERSION,
  webURL: process.env.WEB_URL,
  databaseEmpresa: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    name: process.env.DB_NAME,
  },
  databaseComun: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    name: process.env.DB_NAME_COMUN,
  },
  auth: {
    key: process.env.AUTH_KEY,
  },
}
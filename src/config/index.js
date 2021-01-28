const dotenv = require('dotenv');

dotenv.config();

process.env.TZ = "Europe/London";

module.exports = {
  nodeEnv: process.env.NODE_ENV,
  logging: process.env.LOG_LEVEL,
  port: process.env.APP_PORT,
  appName: process.env.APP_NAME,
  version: process.env.APP_VERSION,
  minVersion: process.env.APP_MIN_VERSION,
  webURL: process.env.WEB_URL,
  database: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    dir: process.env.DB_DIR,
    comun: process.env.DB_COMUN,
    empresa: process.env.DB_EMPRESA,
  },
  auth: {
    key: process.env.AUTH_KEY,
  },
  log: {
    SQL: true,
  },
}
const dotenv = require('dotenv');

dotenv.config();

process.env.TZ = "Europe/London";

module.exports = {
  nodeEnv: process.env.NODE_ENV,
  port: process.env.APP_PORT,
  appName: process.env.APP_NAME,
  version: process.env.APP_VERSION,
  minVersion: process.env.APP_MIN_VERSION,
  secret_key: process.env.SECRET_KEY,
  time_check: process.env.TIME_CHECK,
  url_store: process.env.URL_STORE,
  consumer_key: process.env.CONSUMER_KEY,
  consumer_secret: process.env.CONSUMER_SECRET,
  database: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    dir: process.env.DB_DIR,
    comun: process.env.DB_COMUN,
    empresa: process.env.DB_EMPRESA,
  },
  log: {
    SQL: process.env.LOG,
  },
}
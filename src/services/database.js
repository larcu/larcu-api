const firebird = require('node-firebird');
const config = require('../config/index.js');

let optionsEmpresa = {
  host: config.databaseEmpresa.host,
  port: config.databaseEmpresa.port,
  database: config.databaseEmpresa.name,
  user: config.databaseEmpresa.user,
  password: config.databaseEmpresa.password,
  lowercase_keys: false, // set to true to lowercase keys
  role: null,            // default
  pageSize: 4096,        // default when creating database
};

// 5 = the number is count of opened sockets
let poolEmpresa = firebird.pool(5, optionsEmpresa);

// Get a free pool
poolEmpresa.get(function(err, db) {
  if (err){
    throw err;
  }

  db.query("SHOW TABLES;", function(err, result) {
      db.detach();
  });
});

let optionsComun = {
  host: config.databaseComun.host,
  port: config.databaseComun.port,
  database: config.databaseComun.name,
  user: config.databaseComun.user,
  password: config.databaseComun.password,
  lowercase_keys: false, // set to true to lowercase keys
  role: null,            // default
  pageSize: 4096,        // default when creating database
};

// 5 = the number is count of opened sockets
let poolComun = firebird.pool(5, optionsComun);

// Get a free pool
poolComun.get(function(err, db) {
  if (err){
    throw err;
  }

  db.query("SHOW TABLES;", function(err, result) {
      db.detach();
  });
});

module.exports = {poolComun, poolEmpresa};
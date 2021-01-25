const firebird = require('node-firebird');
const config = require('../config/index.js');

let optionsEmpresa = {
  host: config.databaseEmpresa.host,
  port: config.databaseEmpresa.port,
  database: config.databaseEmpresa.name,
  user: config.databaseEmpresa.user,
  password: config.databaseEmpresa.password,
  lowercase_keys: false, // set to true to lowercase keys
  role: null, // default
  pageSize: 4096, // default when creating database
};
let optionsComun = {
  host: config.databaseComun.host,
  port: config.databaseComun.port,
  database: config.databaseComun.name,
  user: config.databaseComun.user,
  password: config.databaseComun.password,
  lowercase_keys: false, // set to true to lowercase keys
  role: null, // default
  pageSize: 4096, // default when creating database
};

// 5 = the number is count of opened sockets
const poolEmpresa = firebird.pool(5, optionsEmpresa, () => {});
const poolComun = firebird.pool(5, optionsComun, () => {});

class FirebirdPromise {
  static attachPool(bbdd) {
    return new Promise(
      (resolve, reject) => {
        if(bbdd=="comun"){
          poolComun.get((err, db) => {
            if (err) return reject(err);
            resolve(db);
          });
        }else{
          poolEmpresa.get((err, db) => {
            if (err) return reject(err);
            resolve(db);
          });
        }
      });
  }

  async aquery(querysql, params, bbdd) {
    const db = await FirebirdPromise.attachPool(bbdd);
    if (db) {
      return new Promise(
        (resolve, reject) => {
          if (config.log.SQL) {
            console.log(querysql)
          };
          db.query(querysql, params, (err, data) => {
            if (err) {
              db.detach();
              return reject(err);
            }
            db.detach();
            resolve(data);
          });
        });
    } else {
      throw "Not enough connections: Cannot get db from the pool!";
    }
  }
}

module.exports = new FirebirdPromise();
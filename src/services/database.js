const firebird = require('node-firebird');
const config = require('../config/index.js');

let optionsComun = {
  host: config.database.host,
  port: config.database.port,
  database: config.database.dir+config.database.comun+".FDB",
  user: config.database.user,
  password: config.database.password,
  lowercase_keys: false, // set to true to lowercase keys
  role: null, // default
  pageSize: 4096, // default when creating database
};

const poolComun = firebird.pool(5, optionsComun, () => {});

async function getPoolEmpresa(){
  const data = await FirebirdPromiseComun.aquery("SELECT EMPRESA_CODIGO FROM TIENDA_VIRTUAL WHERE ID=1");
  let code = data[0].EMPRESA_CODIGO;
  if(code<10){code = "0"+code;}
  const bbddEmpresa = config.database.dir+config.database.empresa+code+".FDB";

  let optionsEmpresa = {
    host: config.database.host,
    port: config.database.port,
    database: bbddEmpresa,
    user: config.database.user,
    password: config.database.password,
    lowercase_keys: false, // set to true to lowercase keys
    role: null, // default
    pageSize: 4096, // default when creating database
  };
  return firebird.pool(5, optionsEmpresa, () => {});
}

class FirebirdPromiseComun {
  static async attachPool() {
    return new Promise(
      (resolve, reject) => {
        poolComun.get((err, db) => {
          if (err) return reject(err);
          resolve(db);
        });
      });
  }

  static async aquery(querysql, params) {
    const db = await FirebirdPromiseComun.attachPool();
    if (db) {
      return new Promise(
        (resolve, reject) => {
          if (config.log.SQL=="true") {
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

class FirebirdPromiseEmpresa {
  constructor(poolEmpresa){
    if(!poolEmpresa){
      throw new Error("Cannot be called directly");
    }
    this.poolEmpresa = poolEmpresa;
  }

  static async build(){
    let poolEmpresa = await getPoolEmpresa();
    return new FirebirdPromiseEmpresa(poolEmpresa);
  }

  async attachPool() {
    return new Promise(
      (resolve, reject) => {
        this.poolEmpresa.get((err, db) => {
          if (err) return reject(err);
          resolve(db);
        });
      });
  }

  async aquery(querysql, params) {
    const db = await this.attachPool();
    if (db) {
      return new Promise(
        (resolve, reject) => {
          if (config.log.SQL=="true") {
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

class FirebirdPromise {
  static async aquery(querysql, params, bbdd) {
    if(bbdd=="comun"){
      return FirebirdPromiseComun.aquery(querysql, params);
    }else{
      let db = await FirebirdPromiseEmpresa.build();
      return db.aquery(querysql, params);
    }
  }
}

module.exports = FirebirdPromise;
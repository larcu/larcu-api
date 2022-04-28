const FirebirdPromise = require("../../services/database.js");

async function checkValidUser(req, res, next) {
  try {
    let user = "", pass = "";
    if(req.headers.usuario && req.headers.clave){
      user = req.headers.usuario;
      pass = req.headers.clave;
    }else{
      throw "errorHeaders";
    }

    let query;
    const params = [];

    query = "SELECT ID_USUARIO FROM USUARIO WHERE 1=1";
    if (user) {
      query += " AND NOMBRE_USUARIO=?";
      params.push(user);
    }
    if (pass) {
      query += " AND CLAVE=?";
      params.push(pass);
    }
    
    let data = await FirebirdPromise.aquery(query, params, "comun");

    if (!data[0]) {
      // User doesn't exist
      throw 'wrongCredentials';
    }else{
      return next();
    }
  } catch (error) {
    if (error == 'errorHeaders') {
      res.status(401).send('invalid headers');
    } else {
      if (error == 'wrongCredentials') {
        res.status(401).send('invalid user or password');
      }else{
        res.status(500).send('error');
        console.log("Error at checkValidUser: ");
        console.log(error);
      }
    }
    return;
  }
}

module.exports = checkValidUser;
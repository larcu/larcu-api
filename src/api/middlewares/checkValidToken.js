const jsonwebtoken = require('jsonwebtoken');
const authenticationService = require('../../services/authentication');
const config = require('../../config/index.js');
const lib = require('../../lib/index.js');

/**
 * Call next if credentials are correct,
 * send 401 response if the jwt is invalid (wrong or iat/email not match in db)
*/
async function checkValidToken(req, res, next) {
  try {
    const token = lib.getTokenFromHeader(req);
    const {email, iat} = jsonwebtoken.verify(token, config.auth.key);

    const validToken = await authenticationService.checkValidToken(email, iat);
    if (validToken) {
      return next();
    } else {
      res.status(401).send('invalid token');
      return;
    }
  } catch (error) {
    if (error.name == 'JsonWebTokenError') {
      res.status(401).send('invalid token');
    } else {
      res.status(500).send('error');
      console.log("Error at checkValidToken: ");
      console.log(error);
    }
    return;
  }
}

module.exports = checkValidToken;
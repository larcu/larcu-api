const jsonwebtoken = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const lib = require('../lib/index.js');
const pool = require('./database.js');
const config = require('../config/index');

class AuthenticationService {
  /**
   * Return auth token if the login is correct, an error code otherwise
   */
  async login(email, password) {
    if (!email || !password || !lib.validEmail(email)) {
      return "badArguments";
    }
    let conn;
    try {
      conn = await pool.getConnection();
      let query = "SELECT id, contrasena FROM profesionales WHERE email=?";

      const stored = await conn.query(query, email);
      if (!stored[0] || !stored[0]['contrasena']) {
        // User doesn't exist
        return 'wrongUser';
      }

      const passwordCorrect = bcrypt.compareSync(password, stored[0]['contrasena']);
      if (!passwordCorrect) {
        return 'wrongPassword';
      }

      // Send the token and save issued time
      const iat = Math.floor(Date.now() / 1000);
      conn.query(
        `UPDATE profesionales SET iat=FROM_UNIXTIME(?) WHERE email=?`,
        [iat, email]
      );

      // TODO: add an expiration date ("exp": seconds unix epoch)
      const payload = {
        "iat": iat,
        "email": email,
      };

      // Default algorithm is HS256 (HMAC with SHA-256), the one we'll use, so 
      // I don't need to specify it
      // The key must be at least 256 bits to be secure, I'm using a 512 bits one
      const token = jsonwebtoken.sign(payload, config.auth.key);

      return {
        "JWT": token,
        "id": stored[0]['id'],
      };
    } catch (error) {
      console.log("Error at AuthenticationService -> login: ");
      console.log(error);
      return 'error';
    } finally {
      if (conn)
        conn.end();
    }
  }

  /**
   * It checks the data passed is the same that in the database
   */
  async checkValidToken(email, iat) {
    if (!email || !lib.validEmail(email) || !iat) {
      return false;
    }
    let conn;
    try {
      conn = await pool.getConnection();
      const result = await conn.query("SELECT id FROM profesionales WHERE email=? AND iat=FROM_UNIXTIME(?)", [email, iat]);
      return result.length !== 0;
    } catch (error) {
      console.log("Error at AuthenticationService -> checkValidToken: ");
      console.log(error);
      return false;
    } finally {
      if (conn)
        conn.end();
    }
  }
}

module.exports = new AuthenticationService();
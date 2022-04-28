const FirebirdPromise = require("./database.js");

class FamilyService {
  /**
   * Returns family
   */
  async read({ id, cod, des }) {
    try {
      let query;
      const params = [];

      query = "SELECT * FROM FAMILIA WHERE 1=1";
      if (id) {
        query += " AND ID_FAMILIA=?";
        params.push(id);
      }
      if (cod) {
        query += " AND CODIGO=?";
        params.push(cod);
      }
      if (des) {
        query += " AND DESCRIPCION=?";
        params.push(des);
      }

      query += " ORDER BY LOWER(DESCRIPCION)";
      
      let data = await FirebirdPromise.aquery(query, params, "empresa");
      return data;
    } catch (error) {
      console.log("Error at FamilyService -> read: "+error);
      return 'error';
    }
  }
}

module.exports = new FamilyService();
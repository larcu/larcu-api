const FirebirdPromise = require("./database.js");

class ItemService {
  /**
   * Returns items
   */
  async read({ id, ref }) {
    try {
      let query;
      const params = [];

      query = "SELECT ID_ARTICULO, REFERENCIA, DESCRIPCION FROM ARTICULO WHERE 1=1";
      if (id) {
        query += " AND ID_ARTICULO=?";
        params.push(id);
      }
      if (ref) {
        query += " AND REFERENCIA=?";
        params.push(ref);
      }

      query += " ORDER BY LOWER(DESCRIPCION)";
      
      let data = await FirebirdPromise.aquery(query, params, "empresa");
      return data;
    } catch (error) {
      console.log("Error at ItemService -> read: "+error);
      return 'error';
    }
  }
}

module.exports = new ItemService();
const pool = require('./database.js');
const poolEmpresa = pool.poolEmpresa;

class ItemService {
  /**
   * Returns items
   */
  async read({ id, ref }) {
    try {
      let query;
      const params = [];

      query = "SELECT * FROM ARTICULO WHERE 1=1";
      if (id) {
        query += " AND ID_ARTICULO=?";
        params.push(id);
      }
      if (ref) {
        query += " AND REFERENCIA=?";
        params.push(ref);
      }

      query += " ORDER BY LOWER(DESCRIPCION)";
      poolEmpresa.get(function(err, db) {
        if (err){
          throw err;
        }
        db.query(query, params, function(err, result) {
          if (err){
            throw err;
          }
          console.log(result);
          db.detach();
          return result;
        });
      });
    } catch (error) {
      console.log("Error at ItemService -> read: "+error);
      return 'error';
    }
  }
}

module.exports = new ItemService();
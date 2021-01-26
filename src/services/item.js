const FirebirdPromise = require("./database.js");

class ItemService {
  /**
   * Returns items
   */
  async read({ id, ref, fam }) {
    try {
      let query;
      const params = [];

      query = "SELECT * FROM ARTICULO WHERE TELEMATICO=1";
      if (id) {
        query += " AND ID_ARTICULO=?";
        params.push(id);
      }
      if (ref) {
        query += " AND REFERENCIA=?";
        params.push(ref);
      }
      if (fam) {
        const querySelectFamilia = "SELECT ID_FAMILIA FROM FAMILIA WHERE DESCRIPCION=?";
        const paramsSelectFamilia = [fam];
        let dataFamilia = await FirebirdPromise.aquery(querySelectFamilia, paramsSelectFamilia, "empresa");
        if(dataFamilia[0]){
          const idFamilia = dataFamilia[0].ID_FAMILIA;
          query += " AND ID_FAMILIA=?";
          params.push(idFamilia);
        }else{
          return 'nonExistent';
        }
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
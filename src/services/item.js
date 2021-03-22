const FirebirdPromise = require("./database.js");

class ItemService {
  /**
   * Returns items
   */
  async read({ id, ref, fam }) {
    try {
      let query;
      const params = [];

      const querySelectTratamientoAlmacen = "SELECT EXISTENCIAS_TRATAMIENTO, EXISTENCIAS_ALMACEN, VENDER_SIN_EXISTENCIAS FROM TIENDA_VIRTUAL WHERE ID=1";
      let dataTratamientoAlmacen = await FirebirdPromise.aquery(querySelectTratamientoAlmacen, [], "comun");
      const tratamiento = dataTratamientoAlmacen[0].EXISTENCIAS_TRATAMIENTO;
      const idAlmacen = dataTratamientoAlmacen[0].EXISTENCIAS_ALMACEN;

      if(tratamiento){ //Se vende de un almacén en concreto
        query = "SELECT A.*, F.DESCRIPCION AS NOMBRE_FAMILIA, (SELECT SUM(E.EXISTENCIAS) FROM EXISTENCIA E WHERE E.ID_ARTICULO = A.ID_ARTICULO AND E.ID_ALMACEN=?) AS STOCK FROM ARTICULO A INNER JOIN FAMILIA F ON A.ID_FAMILIA = F.ID_FAMILIA WHERE A.TELEMATICO=1";
        params.push(idAlmacen);
      }else{ //Se vende globalmente sin tener en cuenta el almacén
        query = "SELECT A.*, F.DESCRIPCION AS NOMBRE_FAMILIA, (SELECT SUM(E.EXISTENCIAS) FROM EXISTENCIA E WHERE E.ID_ARTICULO = A.ID_ARTICULO) AS STOCK FROM ARTICULO A INNER JOIN FAMILIA F ON A.ID_FAMILIA = F.ID_FAMILIA WHERE A.TELEMATICO=1";
      }
      if (id) {
        query += " AND A.ID_ARTICULO=?";
        params.push(id);
      }
      if (ref) {
        query += " AND A.REFERENCIA=?";
        params.push(ref);
      }
      if (fam) {
        const querySelectFamilia = "SELECT ID_FAMILIA FROM FAMILIA WHERE DESCRIPCION=?";
        const paramsSelectFamilia = [fam];
        let dataFamilia = await FirebirdPromise.aquery(querySelectFamilia, paramsSelectFamilia, "empresa");
        if(dataFamilia[0]){
          const idFamilia = dataFamilia[0].ID_FAMILIA;
          query += " AND A.ID_FAMILIA=?";
          params.push(idFamilia);
        }else{
          return 'nonExistent';
        }
      }

      query += " ORDER BY LOWER(A.DESCRIPCION)";
      
      let data = await FirebirdPromise.aquery(query, params, "empresa");
      return data;
    } catch (error) {
      console.log("Error at ItemService -> read: "+error);
      return 'error';
    }
  }

  async exportcsv({ ref, fam }) {
    try {
      let query;
      const params = [];

      const querySelectTratamientoAlmacen = "SELECT EXISTENCIAS_TRATAMIENTO, EXISTENCIAS_ALMACEN, VENDER_SIN_EXISTENCIAS FROM TIENDA_VIRTUAL WHERE ID=1";
      let dataTratamientoAlmacen = await FirebirdPromise.aquery(querySelectTratamientoAlmacen, [], "comun");
      const tratamiento = dataTratamientoAlmacen[0].EXISTENCIAS_TRATAMIENTO;
      const idAlmacen = dataTratamientoAlmacen[0].EXISTENCIAS_ALMACEN;

      if(tratamiento){ //Se vende de un almacén en concreto
        query = "SELECT A.*, F.DESCRIPCION AS NOMBRE_FAMILIA, (SELECT SUM(E.EXISTENCIAS) FROM EXISTENCIA E WHERE E.ID_ARTICULO = A.ID_ARTICULO AND E.ID_ALMACEN=?) AS STOCK FROM ARTICULO A INNER JOIN FAMILIA F ON A.ID_FAMILIA = F.ID_FAMILIA WHERE A.TELEMATICO=1";
        params.push(idAlmacen);
      }else{ //Se vende globalmente sin tener en cuenta el almacén
        query = "SELECT A.*, F.DESCRIPCION AS NOMBRE_FAMILIA, (SELECT SUM(E.EXISTENCIAS) FROM EXISTENCIA E WHERE E.ID_ARTICULO = A.ID_ARTICULO) AS STOCK FROM ARTICULO A INNER JOIN FAMILIA F ON A.ID_FAMILIA = F.ID_FAMILIA WHERE A.TELEMATICO=1";
      }
      if (ref) {
        query += " AND A.REFERENCIA=?";
        params.push(ref);
      }
      if (fam) {
        const querySelectFamilia = "SELECT ID_FAMILIA FROM FAMILIA WHERE DESCRIPCION=?";
        const paramsSelectFamilia = [fam];
        let dataFamilia = await FirebirdPromise.aquery(querySelectFamilia, paramsSelectFamilia, "empresa");
        if(dataFamilia[0]){
          const idFamilia = dataFamilia[0].ID_FAMILIA;
          query += " AND A.ID_FAMILIA=?";
          params.push(idFamilia);
        }else{
          return 'nonExistent';
        }
      }

      query += " ORDER BY LOWER(A.DESCRIPCION)";
      
      let data = await FirebirdPromise.aquery(query, params, "empresa");
      const { Parser } = require('json2csv')
      const fields = [
        {
          label: 'ID',
          value: 'ID_ARTICULO'
        },
        {
          label: 'sku',
          value: 'REFERENCIA'
        },
        {
          label: 'post_title',
          value: 'DESCRIPCION'
        },
        {
          label: 'post_content',
          value: 'DESCRIPCION'
        },
        {
          label: 'regular_price',
          value: 'PRECIO_VENTA_TIENDA_VIRTUAL'
        },
        {
          label: 'sale_price',
          value: 'PRECIO_VENTA_TIENDA_VIRTUAL'
        },
        {
          label: 'manage_stock',
          value: 'manage_stock',
		      default: true
        },
        {
          label: 'stock',
          value: 'STOCK'
        },
        {
          label: 'weight',
          value: 'TV_PESO'
        },
        {
          label: 'Images',
          value: 'TV_IMAGEN'
        },
        {
          label: 'categories',
          value: 'NOMBRE_FAMILIA'
        },
        {
          label: 'meta:attribute_color',
          value: 'COLOR'
        }
      ];
      const json2csv = new Parser({ fields: fields });
      const csv = json2csv.parse(data);
      return csv;
    } catch (error) {
      console.log("Error at ItemService -> exportcsv: "+error);
      return 'error';
    }
  }
}

module.exports = new ItemService();
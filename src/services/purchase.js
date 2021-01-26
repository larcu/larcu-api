const FirebirdPromise = require("./database.js");
const formatDate = require('../api/basics/formatDate.js');

class PurchaseService {
  async create({ ref, alm, unid }) {
    if ((!ref)||(!unid)) {
      return "badArguments";
    }
    try {
      const fecha = formatDate(new Date(), '%d.%m.%y, %h:%m:%s')+".000";
      const querySelectArticulo = "SELECT * FROM ARTICULO WHERE TELEMATICO=1 AND REFERENCIA=?";
      const paramsSelectArticulo = [ref];
      let dataArticulo = await FirebirdPromise.aquery(querySelectArticulo, paramsSelectArticulo, "empresa");
      const idArticulo = dataArticulo[0].ID_ARTICULO;
      const referenciaArticulo = dataArticulo[0].REFERENCIA;
      const descripcionArticulo = dataArticulo[0].DESCRIPCION;
      const precioCosteM1Articulo = dataArticulo[0].PRECIO_COSTE_M1;
      const precioCosteM2Articulo = dataArticulo[0].PRECIO_COSTE_M2;
      const precioVentaM1Articulo = dataArticulo[0].PRECIO_VENTA1_M1;
      const precioVentaM2Articulo = dataArticulo[0].PRECIO_VENTA1_M2;
      const idIVAArticulo = dataArticulo[0].ID_IVA_VENTA;

      const querySelectFamilia = "SELECT CODIGO, DESCRIPCION FROM FAMILIA WHERE ID_FAMILIA=?";
      const paramsSelectFamilia = [dataArticulo[0].ID_FAMILIA];
      let dataFamilia = await FirebirdPromise.aquery(querySelectFamilia, paramsSelectFamilia, "empresa");
      const codigoFamilia = dataFamilia[0].CODIGO;
      const descripcionFamilia = dataFamilia[0].DESCRIPCION;

      const querySelectIva = "SELECT PORCENTAJE FROM IVA WHERE ID_IVA=?";
      const paramsSelectIva = [idIVAArticulo];
      let dataIva = await FirebirdPromise.aquery(querySelectIva, paramsSelectIva, "empresa");
      const porcentajeIva = dataIva[0].PORCENTAJE;

      let compra = false;
      let idAlmacen = 0;

      if(alm){
        const querySelectAlmacen = "SELECT ID_ALMACEN FROM ALMACEN WHERE DESCRIPCION=?";
        const paramsSelectAlmacen = [alm];
        let dataAlmacen = await FirebirdPromise.aquery(querySelectAlmacen, paramsSelectAlmacen, "comun");
        if(dataAlmacen[0]){
          idAlmacen = dataAlmacen[0].ID_ALMACEN;
          const querySelectExistencias = "SELECT EXISTENCIAS FROM EXISTENCIA WHERE ID_ARTICULO=? AND ID_ALMACEN>=?";
          const paramsSelectExistencias = [idArticulo, idAlmacen];
          let dataExistencias = await FirebirdPromise.aquery(querySelectExistencias, paramsSelectExistencias, "empresa");
          if(dataExistencias[0].EXISTENCIAS && dataExistencias[0].EXISTENCIAS >= unid){ compra = true; }else{ return "OutOfStock"; }
        }else{
          return "almNotExist";
        }
      }else{
        const querySelectExistencias = "SELECT SUM(EXISTENCIAS) AS SUMA_EXISTENCIAS FROM EXISTENCIA WHERE ID_ARTICULO=?";
        const paramsSelectExistencias = [idArticulo];
        let dataExistencias = await FirebirdPromise.aquery(querySelectExistencias, paramsSelectExistencias, "empresa");
        if(dataExistencias[0].SUMA_EXISTENCIAS && dataExistencias[0].SUMA_EXISTENCIAS >= unid){ 
          compra = true; 
          //TODO: Quedarme con los ids de almacenes donde hay que reducir stock y cuanto reducir de cada uno
          const querySelectAlmacen = "SELECT ID_ALMACEN FROM EXISTENCIA WHERE ID_ARTICULO=? AND EXISTENCIAS!=0";
          const paramsSelectAlmacen = [idArticulo];
          let dataAlmacen = await FirebirdPromise.aquery(querySelectAlmacen, paramsSelectAlmacen, "empresa");
          if(dataAlmacen[0].ID_ALMACEN){ compra = true; idAlmacen = dataAlmacen[0].ID_ALMACEN }else{ compra = false; return "unexpectedError";  }
        }else{ 
          return "OutOfStock"; 
        }
      }

      if (compra) {
        const queryUpdateExistencia = "UPDATE EXISTENCIA SET EXISTENCIAS=EXISTENCIAS-? WHERE ID_ARTICULO=? AND ID_ALMACEN=?";
        const paramsUpdateExistencia = [unid, idArticulo, idAlmacen];
        let dataExistencia = await FirebirdPromise.aquery(queryUpdateExistencia, paramsUpdateExistencia, "empresa");

        const queryInsertMovimiento = "INSERT INTO MOVIMIENTO (ID_TMOVIMIENTO, DESCRIPCION_MOV, FECHA, REFERENCIA,"+
          "DESCRIPCION, UNIDADES, PRECIO_COSTE_M1, PRECIO_COSTE_M2, PRECIO_VENTA_M1,"+
          "PRECIO_VENTA_M2, IVA_VENTA_PORC, IVA_VENTA_IMP_M1, IVA_VENTA_IMP_M2, ID_ALMACEN,"+
          "FAMILIA_CODIGO, FAMILIA_DESCRIPCION, LIQUIDO_M1, LIQUIDO_M2, BI_BASE_M1,"+
          "BI_BASE_M2, BI_IVA_M1, BI_IVA_M2)"+
          "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
        const ivaVentaM1 = precioVentaM1Articulo * (porcentajeIva/100);
        const ivaVentaM2 = precioVentaM2Articulo * (porcentajeIva/100);
        const liquidoM1 = precioVentaM1Articulo + ivaVentaM1;
        const liquidoM2 = precioVentaM2Articulo + ivaVentaM2;
        const baseM1 = precioVentaM1Articulo;
        const baseM2 = precioVentaM2Articulo;
        const ivaM1 = ivaVentaM1;
        const ivaM2 = ivaVentaM2;
        const paramsInsertMovimiento = [0, "Venta por internet", fecha, referenciaArticulo, descripcionArticulo, unid, precioCosteM1Articulo, precioCosteM2Articulo,
                                        precioVentaM1Articulo, precioVentaM2Articulo, porcentajeIva, ivaVentaM1, ivaVentaM2, idAlmacen, codigoFamilia, descripcionFamilia,
                                        liquidoM1, liquidoM2, baseM1, baseM2, ivaM1, ivaM2];
        let dataMovimiento = await FirebirdPromise.aquery(queryInsertMovimiento, paramsInsertMovimiento, "empresa");
        
        console.log(dataExistencia);
        console.log(dataMovimiento);
        return "ok";
      }else{
        return "OutOfStock";
      }
    } catch (error) {
      console.error("Error at services -> PurchaseService -> create: ");
      console.error(error);
      return 'error';
    }
  }
  
  async read({ startDate, endDate }) {
    let query;
    const params = [];

    query = "SELECT * FROM MOVIMIENTO WHERE DESCRIPCION_MOV='Venta por internet'";
    if (startDate) {
      query += " AND FECHA>=?";
      params.push(startDate);
    }
    if (endDate) {
      query += " AND FECHA<=?";
      params.push(endDate);
    }

    query += " ORDER BY LOWER(FECHA)";
    
    let data = await FirebirdPromise.aquery(query, params, "empresa");
    return data;
  }
}

module.exports = new PurchaseService();
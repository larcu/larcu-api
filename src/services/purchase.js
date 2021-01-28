const FirebirdPromise = require("./database.js");
const dateFormat = require('dateformat');

class PurchaseService {
  async create({ ref, unid }) {
    if ((!ref)||(!unid)) {
      return "badArguments";
    }
    try {
      const datePurchase = dateFormat(new Date(), "dd.mm.yyyy, HH:MM:ss")+".000";

      let almacenDefecto = 0;
      const querySelectTratamientoAlmacen = "SELECT EXISTENCIAS_TRATAMIENTO FROM TIENDA_VIRTUAL WHERE ID=1";
      let dataTratamientoAlmacen = await FirebirdPromise.aquery(querySelectTratamientoAlmacen, [], "comun");
      const tratamiento = dataTratamientoAlmacen[0].EXISTENCIAS_TRATAMIENTO;
      if(tratamiento){ //Hay almacén definido para coger existencias
        const querySelectAlmacenDefecto = "SELECT EXISTENCIAS_ALMACEN FROM TIENDA_VIRTUAL WHERE ID=1";
        let dataAlmacenDefecto = await FirebirdPromise.aquery(querySelectAlmacenDefecto, [], "comun");
        almacenDefecto = dataAlmacenDefecto[0].EXISTENCIAS_TRATAMIENTO;
      }

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

      let canBuy = false;
      let idAlmacen = 0;
      let reduceStock = []; 

      if(almacenDefecto){ //Existencias se obtienen de almacen definido
        const querySelectAlmacen = "SELECT ID_ALMACEN FROM ALMACEN WHERE DESCRIPCION=?";
        const paramsSelectAlmacen = [almacenDefecto];
        let dataAlmacen = await FirebirdPromise.aquery(querySelectAlmacen, paramsSelectAlmacen, "comun");
        if(dataAlmacen[0]){
          idAlmacen = dataAlmacen[0].ID_ALMACEN;
          const querySelectExistencias = "SELECT EXISTENCIAS FROM EXISTENCIA WHERE ID_ARTICULO=? AND ID_ALMACEN>=?";
          const paramsSelectExistencias = [idArticulo, idAlmacen];
          let dataExistencias = await FirebirdPromise.aquery(querySelectExistencias, paramsSelectExistencias, "empresa");
          if(dataExistencias[0].EXISTENCIAS && dataExistencias[0].EXISTENCIAS >= unid){ 
            canBuy = true; 
            reduceStock.push({almacen: idAlmacen, unidades: dataExistencias[0].EXISTENCIAS});
          }else{ 
            return "OutOfStock"; 
          }
        }else{
          return "almNotExist";
        }
      }else{ //Existencias se obtienen del total de las existencias en todos los almacenes
        const querySelectExistencias = "SELECT SUM(EXISTENCIAS) AS SUMA_EXISTENCIAS FROM EXISTENCIA WHERE ID_ARTICULO=?";
        const paramsSelectExistencias = [idArticulo];
        let dataExistencias = await FirebirdPromise.aquery(querySelectExistencias, paramsSelectExistencias, "empresa");
        if(dataExistencias[0].SUMA_EXISTENCIAS && dataExistencias[0].SUMA_EXISTENCIAS >= unid){ 
          canBuy = true; 
          let cont = 0;
          const querySelectExistenciasPorAlmacen = "SELECT EXISTENCIAS, ID_ALMACEN FROM EXISTENCIA WHERE ID_ARTICULO=? AND EXISTENCIAS>0";
          const paramsSelectExistenciasPorAlmacen = [idArticulo];
          let dataExistencias = await FirebirdPromise.aquery(querySelectExistenciasPorAlmacen, paramsSelectExistenciasPorAlmacen, "empresa");
          while((unid>0)&&(dataExistencias[cont])){
            if(dataExistencias[cont].EXISTENCIAS<=unid){
              reduceStock.push({almacen: dataExistencias[cont].ID_ALMACEN, unidades: dataExistencias[cont].EXISTENCIAS});
              unid = unid - dataExistencias[cont].EXISTENCIAS;
            }else{
              reduceStock.push({almacen: dataExistencias[cont].ID_ALMACEN, unidades: unid});
              unid = 0;
            }
            cont++;
          }
        }else{ 
          return "OutOfStock"; 
        }
      }

      if (canBuy) {
        let reduce;
        const queryUpdateExistencia = "UPDATE EXISTENCIA SET EXISTENCIAS=EXISTENCIAS-? WHERE ID_ARTICULO=? AND ID_ALMACEN=?";
        let paramsUpdateExistencia = [];
        const queryInsertMovimiento = "INSERT INTO MOVIMIENTO (ID_TMOVIMIENTO, DESCRIPCION_MOV, FECHA, REFERENCIA,"+
                                      "DESCRIPCION, UNIDADES, PRECIO_COSTE_M1, PRECIO_COSTE_M2, PRECIO_VENTA_M1,"+
                                      "PRECIO_VENTA_M2, IVA_VENTA_PORC, IVA_VENTA_IMP_M1, IVA_VENTA_IMP_M2, ID_ALMACEN,"+
                                      "FAMILIA_CODIGO, FAMILIA_DESCRIPCION, LIQUIDO_M1, LIQUIDO_M2, BI_BASE_M1,"+
                                      "BI_BASE_M2, BI_IVA_M1, BI_IVA_M2)"+
                                      "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
        let paramsInsertMovimiento = [];
        while(reduceStock.length){
          //Reducimos stock en almacen
          reduce = reduceStock.pop();
          paramsUpdateExistencia = [reduce.unidades, idArticulo, reduce.almacen];
          await FirebirdPromise.aquery(queryUpdateExistencia, paramsUpdateExistencia, "empresa");

          //Insertamos movimientos
          const baseM1 = parseFloat(precioVentaM1Articulo*reduce.unidades);
          const baseM2 = parseFloat(precioVentaM2Articulo*reduce.unidades);
          const ivaVentaM1 = parseFloat(baseM1 * (porcentajeIva/100));
          const ivaVentaM2 = parseFloat(baseM2 * (porcentajeIva/100));
          const liquidoM1 = baseM1 + ivaVentaM1;
          const liquidoM2 = baseM2 + ivaVentaM2;
          const ivaM1 = ivaVentaM1;
          const ivaM2 = ivaVentaM2;
          paramsInsertMovimiento = [4, "Venta de tienda virtual", datePurchase, referenciaArticulo, descripcionArticulo, reduce.unidades, precioCosteM1Articulo, precioCosteM2Articulo,
                                    precioVentaM1Articulo, precioVentaM2Articulo, porcentajeIva, ivaVentaM1, ivaVentaM2, reduce.almacen, codigoFamilia, descripcionFamilia,
                                    liquidoM1, liquidoM2, baseM1, baseM2, ivaM1, ivaM2];
          await FirebirdPromise.aquery(queryInsertMovimiento, paramsInsertMovimiento, "empresa");
        }
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

    query = "SELECT * FROM MOVIMIENTO WHERE DESCRIPCION_MOV=DESCRIPCION_MOV";
    if (startDate && endDate) {
      query += " AND CAST(FECHA AS DATE) BETWEEN ? AND ?";
      params.push(startDate, endDate);
    }

    query += " ORDER BY LOWER(FECHA)";
    
    let data = await FirebirdPromise.aquery(query, params, "empresa");
    return data;
  }
}

module.exports = new PurchaseService();
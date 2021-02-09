const FirebirdPromise = require("./database.js");
const dateFormat = require('dateformat');

class PurchaseService {
  async create({ ref, unid }) {
    if ((!ref)||(!unid)) {
      return "badArguments";
    }
    try {
      const datePurchase = dateFormat(new Date(), "dd.mm.yyyy, HH:MM:ss")+".000";

      const querySelectTratamientoAlmacen = "SELECT EXISTENCIAS_TRATAMIENTO, EXISTENCIAS_ALMACEN, VENDER_SIN_EXISTENCIAS FROM TIENDA_VIRTUAL WHERE ID=1";
      let dataTratamientoAlmacen = await FirebirdPromise.aquery(querySelectTratamientoAlmacen, [], "comun");
      const tratamiento = dataTratamientoAlmacen[0].EXISTENCIAS_TRATAMIENTO;
      const idAlmacen = dataTratamientoAlmacen[0].EXISTENCIAS_ALMACEN;
      const venderSinExistencias = dataTratamientoAlmacen[0].VENDER_SIN_EXISTENCIAS;

      const querySelectArticulo = "SELECT * FROM ARTICULO WHERE TELEMATICO=1 AND REFERENCIA=?";
      const paramsSelectArticulo = [ref];
      let dataArticulo = await FirebirdPromise.aquery(querySelectArticulo, paramsSelectArticulo, "empresa");
      const idArticulo = dataArticulo[0].ID_ARTICULO;
      const idProveedor = dataArticulo[0].ID_PROVEEDOR;
      const referenciaArticulo = dataArticulo[0].REFERENCIA;
      const descripcionArticulo = dataArticulo[0].DESCRIPCION;
      const precioCosteM1Articulo = dataArticulo[0].PRECIO_COSTE_M1;
      const precioCosteM2Articulo = dataArticulo[0].PRECIO_COSTE_M2;
      const precioVenta = dataArticulo[0].PRECIO_VENTA_TIENDA_VIRTUAL;
      const idIVAArticulo = dataArticulo[0].ID_IVA_VENTA;

      const querySelectFamilia = "SELECT CODIGO, DESCRIPCION, ID_GRUPO FROM FAMILIA WHERE ID_FAMILIA=?";
      const paramsSelectFamilia = [dataArticulo[0].ID_FAMILIA];
      let dataFamilia = await FirebirdPromise.aquery(querySelectFamilia, paramsSelectFamilia, "empresa");
      const codigoFamilia = dataFamilia[0].CODIGO;
      const descripcionFamilia = dataFamilia[0].DESCRIPCION;
      const grupoFamilia = dataFamilia[0].ID_GRUPO;

      const querySelectGrupoFamilia = "SELECT CODIGO, DESCRIPCION FROM GRUPO WHERE ID_GRUPO=?";
      const paramsSelectGrupoFamilia = [grupoFamilia];
      let dataGrupoFamilia = await FirebirdPromise.aquery(querySelectGrupoFamilia, paramsSelectGrupoFamilia, "empresa");
      const codigoGrupoFamilia = dataGrupoFamilia[0].CODIGO;
      const descripcionGrupoFamilia = dataGrupoFamilia[0].DESCRIPCION;

      const querySelectProveedor = "SELECT CODIGO, NOMBRE FROM PROVEEDOR WHERE ID_PROVEEDOR=?";
      const paramsSelectProveedor = [idProveedor];
      let dataProveedor = await FirebirdPromise.aquery(querySelectProveedor, paramsSelectProveedor, "empresa");
      const codigoProveedor = dataProveedor[0].CODIGO;
      const descripcionProveedor = dataProveedor[0].NOMBRE;

      const querySelectIva = "SELECT PORCENTAJE, IVA_INCLUIDO FROM IVA WHERE ID_IVA=?";
      const paramsSelectIva = [idIVAArticulo];
      let dataIva = await FirebirdPromise.aquery(querySelectIva, paramsSelectIva, "empresa");
      const porcentajeIva = dataIva[0].PORCENTAJE;
      const ivaIncluido = dataIva[0].IVA_INCLUIDO;

      let canBuy = false;
      let reduceStock = []; 

      if(tratamiento){ //Se vende de un almacén en concreto
        const querySelectExistencias = "SELECT EXISTENCIAS FROM EXISTENCIA WHERE ID_ARTICULO=? AND ID_ALMACEN=?";
        const paramsSelectExistencias = [idArticulo, idAlmacen];
        let dataExistencias = await FirebirdPromise.aquery(querySelectExistencias, paramsSelectExistencias, "empresa");
        if(dataExistencias[0].EXISTENCIAS >= unid || venderSinExistencias){ 
          canBuy = true; 
          reduceStock.push({almacen: idAlmacen, unidades: unid});
        }else{ 
          return "OutOfStock"; 
        }
      }else{ // Se vende globalmente sin tener en cuenta el almacén
        const querySelectExistencias = "SELECT SUM(EXISTENCIAS) AS SUMA_EXISTENCIAS FROM EXISTENCIA WHERE ID_ARTICULO=?";
        const paramsSelectExistencias = [idArticulo];
        let dataExistencias = await FirebirdPromise.aquery(querySelectExistencias, paramsSelectExistencias, "empresa");
        if(dataExistencias[0].SUMA_EXISTENCIAS >= unid){ // Hay existencias suficientes
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
          if(venderSinExistencias){ // No hay existencias suficientes pero se puede vender sin existencias
            canBuy = true; 
            let cont = 0;
            let last = 0; // Ultimo almacen del que se ha quitado existencias
            if(dataExistencias[0].SUMA_EXISTENCIAS > 0){ //Hay existencias en algún almacén
              const querySelectExistenciasPorAlmacen = "SELECT EXISTENCIAS, ID_ALMACEN FROM EXISTENCIA WHERE ID_ARTICULO=? AND EXISTENCIAS>0";
              const paramsSelectExistenciasPorAlmacen = [idArticulo];
              let dataExistencias = await FirebirdPromise.aquery(querySelectExistenciasPorAlmacen, paramsSelectExistenciasPorAlmacen, "empresa");
              while(dataExistencias[cont]){
                if(dataExistencias[cont].EXISTENCIAS<=unid){
                  reduceStock.push({almacen: dataExistencias[cont].ID_ALMACEN, unidades: dataExistencias[cont].EXISTENCIAS});
                  unid = unid - dataExistencias[cont].EXISTENCIAS;
                  last = dataExistencias[cont].ID_ALMACEN;
                }
                cont++;
              }
              if(unid > 0){
                reduceStock.push({almacen: last, unidades: unid});
                cont++;
              }
            }else{ // No hay existencias en ningún almacén
              const querySelectAlmacen = "SELECT ID_ALMACEN FROM ALMACEN";
              const paramsSelectAlmacen = [idAlmacen];
              let dataAlmacen = await FirebirdPromise.aquery(querySelectAlmacen, paramsSelectAlmacen, "comun");
              if(dataAlmacen[0]){
                reduceStock.push({almacen: dataAlmacen[0].ID_ALMACEN, unidades: unid});
                cont++;
              }else{
                return "almNotExist";
              }
            }
          }else{
            return "OutOfStock"; 
          }
        }
      }

      if (canBuy) {
        let reduce;
        const queryUpdateExistencia = "UPDATE EXISTENCIA SET EXISTENCIAS=EXISTENCIAS-? WHERE ID_ARTICULO=? AND ID_ALMACEN=?";
        let paramsUpdateExistencia = [];
        const queryInsertMovimiento = "INSERT INTO MOVIMIENTO (ID_TMOVIMIENTO, DESCRIPCION_MOV, FECHA, FECHA_SISTEMA, FECHA_OPERACION, REFERENCIA,"+
                                      "DESCRIPCION, UNIDADES, PRECIO_COSTE_M1, PRECIO_COSTE_M2, PRECIO_VENTA_M1,"+
                                      "IVA_VENTA_PORC, IVA_VENTA_IMP_M1, ID_ALMACEN, PROVEEDOR_CODIGO, PROVEEDOR_DESCRIPCION,"+
                                      "FAMILIA_CODIGO, FAMILIA_DESCRIPCION, LIQUIDO_M1, BI_BASE_M1,"+
                                      "BI_IVA_M1, GRUPO_VENTA_CODIGO, GRUPO_VENTA_DESCRIPCION)"+
                                      "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
        let paramsInsertMovimiento = [];
        while(reduceStock.length){
          //Reducimos stock en almacen
          reduce = reduceStock.pop();
          paramsUpdateExistencia = [reduce.unidades, idArticulo, reduce.almacen];
          await FirebirdPromise.aquery(queryUpdateExistencia, paramsUpdateExistencia, "empresa");

          //Insertamos movimientos
          let ivaVenta, liquido, base = 0
          if(ivaIncluido){
            liquido = parseFloat(precioVenta*reduce.unidades);
            base = parseFloat(liquido/(1+(porcentajeIva/100)));
            ivaVenta = parseFloat(liquido - base);
          }else{
            liquido = parseFloat(precioVenta*reduce.unidades);
            base = liquido;
            ivaVenta = parseFloat(base * (porcentajeIva/100));
          }

          paramsInsertMovimiento = [8, "Venta de tienda virtual", datePurchase, datePurchase, datePurchase, referenciaArticulo, descripcionArticulo, reduce.unidades, precioCosteM1Articulo, precioCosteM2Articulo,
                                    precioVenta, porcentajeIva, ivaVenta, reduce.almacen, codigoProveedor, descripcionProveedor, codigoFamilia, descripcionFamilia,
                                    liquido, base, ivaVenta, codigoGrupoFamilia, descripcionGrupoFamilia];
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

    query = "SELECT * FROM MOVIMIENTO WHERE DESCRIPCION_MOV='Venta de tienda virtual'";
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
const FirebirdPromise = require("./database.js");
const dateFormat = require("dateformat");

class ClientService {
  async create({
    apellidos,
    nombre,
    direccion,
    nif,
    telefono,
    telefono_movil,
    localidad,
    profesion,
    viene_por,
    sexo,
    fecha_nacimiento,
    email,
    web,
    tienda,
    lopd_consentimiento,
    lopd_correo_normal,
    lopd_correo_publicidad,
  }) {
    if (!apellidos || !nombre) {
      return "badArguments";
    }
    if (!tienda || !Number.isInteger(tienda)) {
      const queryGetShopId = "SELECT TIENDA FROM PACIENTE ROWS 1";
      let dataGetShopId = await FirebirdPromise.aquery(
        queryGetShopId,
        [],
        "empresa"
      );
      if (dataGetShopId[0]) {
        tienda = dataGetShopId[0].TIENDA;
      } else {
        tienda = 1;
      }
    }
    if (!localidad) {
      const queryGetCityId =
        "SELECT ID_LOCALIDAD_COMERCIAL FROM TIENDA WHERE CODIGO=?";
      let dataGetCityId = await FirebirdPromise.aquery(
        queryGetCityId,
        [tienda],
        "comun"
      );
      if (dataGetCityId[0]) {
        localidad = dataGetCityId[0].ID_LOCALIDAD_COMERCIAL;
      } else {
        localidad = -1;
      }
    }
    if (!sexo) {
      sexo = 0;
    } else {
      if (!(Number.isInteger(sexo) && sexo >= 0 && sexo <= 2)) {
        if (sexo == "Masculino" || sexo == "Hombre") {
          sexo = 1;
        }
        if (sexo == "Femenino" || sexo == "Mujer") {
          sexo = 2;
        }
        if (sexo == "Desconocido") {
          sexo = 0;
        }
        if (sexo < 0 || sexo > 2) {
          sexo = 0;
        }
      }
    }
    if (fecha_nacimiento) {
      fecha_nacimiento =
        dateFormat(fecha_nacimiento, "dd.mm.yyyy, HH:MM:ss") + ".000";
    }
    try {
      const queryGetClientId =
        "SELECT MAX(CODIGO) AS MC, LICENCIA FROM PACIENTE WHERE BORRADO=0 GROUP BY LICENCIA";
      let dataGetClientId = await FirebirdPromise.aquery(
        queryGetClientId,
        [],
        "empresa"
      );
      let clientId = 1;
      let licencia = 0;
      if (dataGetClientId[0].MC > 0) {
        clientId = dataGetClientId[0].MC + 1;
      }
      if (dataGetClientId[0].LICENCIA > 0) {
        licencia = dataGetClientId[0].LICENCIA;
      }

      const queryInsertMovimiento =
        "INSERT INTO PACIENTE (CODIGO, APELLIDOS, NOMBRE, DIRECCION, NIF, TELEFONO, TELEFONO_MOVIL," +
        "PROFESION, VIENE_POR, SEXO, FECHA_NACIMIENTO, E_MAIL, ID_LOCALIDAD," +
        "WEB, TIENDA, LOPD_CONSENTIMIENTO, LOPD_CORREO_NORMAL, LOPD_CORREO_PUBLICIDAD, LICENCIA)" +
        "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
      const paramsUpdateExistencia = [
        clientId,
        apellidos,
        nombre,
        direccion,
        nif,
        telefono,
        telefono_movil,
        profesion,
        viene_por,
        sexo,
        fecha_nacimiento,
        email,
        localidad,
        web,
        tienda,
        lopd_consentimiento,
        lopd_correo_normal,
        lopd_correo_publicidad,
        licencia,
      ];
      await FirebirdPromise.aquery(
        queryInsertMovimiento,
        paramsUpdateExistencia,
        "empresa"
      );

      return "ok";
    } catch (error) {
      console.error("Error at services -> ClientService -> create: ");
      console.error(error);
      return "error";
    }
  }

  async read({ codigo, apellidos, nombre, nif, telefono }) {
    let query;
    const params = [];

    query = "SELECT * FROM PACIENTE WHERE BORRADO=0";
    if (codigo) {
      query += " AND CODIGO=?";
      params.push(codigo);
    }
    if (nombre) {
      query += " AND NOMBRE=?";
      params.push(nombre);
    }
    if (apellidos) {
      query += " AND APELLIDOS=?";
      params.push(apellidos);
    }
    if (nif) {
      query += " AND NIF=?";
      params.push(nif);
    }
    if (telefono) {
      query += " AND TELEFONO=?";
      params.push(telefono);
    }

    if (codigo) {
      query += " ORDER BY CODIGO ASC";
    } else {
      query += " ORDER BY APELLIDOS ASC";
    }

    let data = await FirebirdPromise.aquery(query, params, "empresa");
    return data;
  }

  async update({
    codigo,
    apellidos,
    nombre,
    direccion,
    nif,
    telefono,
    telefono_movil,
    localidad,
    profesion,
    viene_por,
    sexo,
    fecha_nacimiento,
    email,
    web,
    tienda,
    lopd_consentimiento,
    lopd_correo_normal,
    lopd_correo_publicidad,
  }) {
    if (
      (!codigo) || (apellidos != undefined && apellidos=="") || (nombre != undefined && nombre=="")
    ) {
      return "badArguments";
    }
    if (tienda && !Number.isInteger(tienda)) {
      const queryGetShopId = "SELECT TIENDA FROM PACIENTE ROWS 1";
      let dataGetShopId = await FirebirdPromise.aquery(
        queryGetShopId,
        [],
        "empresa"
      );
      if (dataGetShopId[0]) {
        tienda = dataGetShopId[0].TIENDA;
      } else {
        tienda = 1;
      }
    }
    if (localidad && !Number.isInteger(localidad)) {
      const queryGetCityId =
        "SELECT ID_LOCALIDAD_COMERCIAL FROM TIENDA WHERE CODIGO=?";
      let dataGetCityId = await FirebirdPromise.aquery(
        queryGetCityId,
        [tienda],
        "comun"
      );
      if (dataGetCityId[0]) {
        localidad = dataGetCityId[0].ID_LOCALIDAD_COMERCIAL;
      } else {
        localidad = -1;
      }
    }
    if (sexo) {
      if (!(Number.isInteger(sexo) && sexo >= 0 && sexo <= 2)) {
        if (sexo == "Masculino" || sexo == "Hombre") {
          sexo = 1;
        }
        if (sexo == "Femenino" || sexo == "Mujer") {
          sexo = 2;
        }
        if (sexo == "Desconocido") {
          sexo = 0;
        }
        if (sexo < 0 || sexo > 2) {
          sexo = 0;
        }
      }
    }
    if (fecha_nacimiento) {
      fecha_nacimiento =
        dateFormat(fecha_nacimiento, "dd.mm.yyyy, HH:MM:ss") + ".000";
    }
    try {
      let query = "UPDATE PACIENTE SET ";
      const params = [];
      if (nombre) {
        query += "nombre=?, ";
        params.push(nombre);
      }
      if (apellidos) {
        query += "apellidos=?, ";
        params.push(apellidos);
      }
      if (direccion) {
        query += "direccion=?, ";
        params.push(direccion);
      }
      if (nif) {
        query += "nif=?, ";
        params.push(nif);
      }
      if (telefono) {
        query += "telefono=?, ";
        params.push(telefono);
      }
      if (telefono_movil) {
        query += "telefono_movil=?, ";
        params.push(telefono_movil);
      }
      if (localidad) {
        query += "localidad=?, ";
        params.push(localidad);
      }
      if (profesion) {
        query += "profesion=?, ";
        params.push(profesion);
      }
      if (viene_por) {
        query += "viene_por=?, ";
        params.push(viene_por);
      }
      if (sexo != undefined) {
        query += "sexo=?, ";
        params.push(sexo);
      }
      if (fecha_nacimiento) {
        query += "fecha_nacimiento=?, ";
        params.push(fecha_nacimiento);
      }
      if (email) {
        query += "email=?, ";
        params.push(email);
      }
      if (web) {
        query += "web=?, ";
        params.push(web);
      }
      if (tienda) {
        query += "tienda=?, ";
        params.push(tienda);
      }
      if (lopd_consentimiento != undefined) {
        query += "lopd_consentimiento=?, ";
        params.push(lopd_consentimiento);
      }
      if (lopd_correo_normal != undefined) {
        query += "lopd_correo_normal=?, ";
        params.push(lopd_correo_normal);
      }
      if (lopd_correo_publicidad != undefined) {
        query += "lopd_correo_publicidad=?, ";
        params.push(lopd_correo_publicidad);
      }
      query = query.substring(0, query.length - 2);
      query += " WHERE CODIGO=? AND BORRADO='0'";
      params.push(codigo);
      await FirebirdPromise.aquery(
        query,
        params,
        "empresa"
      );
      return "ok";
    } catch (error) {
      console.log("Error at ClientService -> update: ");
      if (error.code === "ER_DUP_ENTRY") {
        return "duplicate";
      }
      console.log(error);
      return "error";
    }
  }
}

module.exports = new ClientService();

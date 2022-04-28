const config = require("../src/config/index.js");
const FirebirdPromise = require("../src/services/database.js");
const WooCommerce = require("@woocommerce/woocommerce-rest-api").default;

//Sube de forma automática los nuevos productos creados en Winvisión. También actualiza los stocks de las reposiciones
async function match() {
  try {
    if (config.consumer_key && config.consumer_secret) {
      const apiWooCommerce = new WooCommerce({
        url: config.url_store,
        consumerKey: config.consumer_key,
        consumerSecret: config.consumer_secret,
        version: "wc/v3",
        verifySsl: false,
        queryStringAuth: true
      });
      let query;
      const params = [];
      //Selecciona artículos vendibles en Winvisión
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

      query += " ORDER BY LOWER(A.DESCRIPCION)";
      
      let items = await FirebirdPromise.aquery(query, params, "empresa");

      //Recorremos los artículos de Winvisión para cambiar el stock si es necesario
      for (const element of items) {
        await apiWooCommerce.get('products?sku='+element.REFERENCIA)
					.then(async (response) => {
            console.log("Producto: "+element.DESCRIPCION);
            if(response && response.status==200 && response.data[0]!=undefined){ // Existe producto en la tienda
              if(response.data[0].stock_quantity != element.STOCK){
                //Actualizo stock
                const dataPUT = {
                  stock_quantity: element.STOCK
                };
                await apiWooCommerce.put("products/"+response.data[0].id, dataPUT)
                  .then((responsePUT) => {
                    if(responsePUT.status==200){
                      console.log("Stock actualizado");
                    }else{
                      console.log("Stock NO actualizado");
                    }
                  })
                  .catch((error) => {
                    console.log("ERROR al actualizar stock: "+error.response.data);
                  });
              }
            }else{ // No existe producto en la tienda y se crea
              await apiWooCommerce.get('products/categories?search='+element.NOMBRE_FAMILIA) // Coger id de categoría
					      .then(async (responseCAT) => {
                  const dataPOST = {
                    ID: element.ID_ARTICULO,
                    name: element.DESCRIPCION,
                    sku: element.REFERENCIA,
                    type: "simple",
                    regular_price: element.PRECIO_VENTA_TIENDA_VIRTUAL.toString(),
                    sale_price: element.PRECIO_VENTA_TIENDA_VIRTUAL.toString(),
                    description: element.DESCRIPCION,
                    in_stock: true,
                    manage_stock: true,
                    stock_quantity: element.STOCK,
                    categories: [
                      {
                        id: responseCAT.data[0].id
                      }
                    ],
                    images: [
                      {
                        src: element.TV_IMAGEN
                      }
                    ],
                    attributes: [
                      {
                        name: "color",
                        option: element.COLOR
                      },
                      {
                        name: "weight",
                        option: element.TV_PESO
                      }
                    ]
                  };
                  await apiWooCommerce.post("products", dataPOST)
                    .then((responsePOST) => {
                      console.log("Producto creado");
                    })
                    .catch((error) => {
                      console.log(error.response);
                      console.log("ERROR al crear producto: "+error.response.data);
                    });
                  })
                .catch((error) => {
                  console.log("ERROR al cargar categoría de producto: "+error.response.data);
                });
            }
          })
					.catch((error) => {
						console.log(error);
					});
      }
    }else{
      console.log("Error at script -> match: You must configure consumer_key and consumer_secret in .env");
      return 'error';
    }
  } catch (error) {
    console.log("Error at script -> match: "+error);
    return 'error';
  }
}

match();
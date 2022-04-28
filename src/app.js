const express = require('express');
const bodyParser = require("body-parser");
const config = require("./config/index.js");
const api = require("./api/index.js");
const FirebirdPromise = require("./services/database.js");
const WooCommerce = require("@woocommerce/woocommerce-rest-api").default;

const app = express();
if (config.nodeEnv === "development") {
	const cors = require('cors');
	app.use(cors());
}

app.get('/', function (req, res) {
	res.status(200).send("La API de Winvisión está funcionando correctamente");
});

const querySelectCount = "SELECT COUNT(*) AS NUMMOVE FROM MOVIMIENTO WHERE UNIDADES>0 AND DESCRIPCION_MOV NOT LIKE 'Venta de tienda virtual%'";

async function checkMove() {
	let dataCount = await FirebirdPromise.aquery(querySelectCount, [], "empresa");
	return dataCount[0].NUMMOVE;
}

if (config.consumer_key && config.consumer_secret) {
	const apiWooCommerce = new WooCommerce({
		url: config.url_store,
		consumerKey: config.consumer_key,
		consumerSecret: config.consumer_secret,
		version: "wc/v3"
	});
	let prevCounter = -1;
	async function initPrevCounter() {
		prevCounter = await checkMove();
	}
	initPrevCounter();
	setInterval(async function () {
		// Actualiza el stock de la tienda online cada vez que se vende algo en winvision
		let number = 0;
		let counter = await checkMove();
		if (counter > prevCounter) {
			number = counter - prevCounter;
			const querySelectArticulos = "SELECT FIRST ? REFERENCIA, UNIDADES FROM MOVIMIENTO WHERE DESCRIPCION_MOV NOT LIKE 'Venta de tienda virtual%' ORDER BY ID_MOVIMIENTO DESC";
			const paramsSelectArticulos = [number];
			let dataArticulos = await FirebirdPromise.aquery(querySelectArticulos, paramsSelectArticulos, "empresa");
			for (let i = 0; i < dataArticulos.length; i++) {
				apiWooCommerce.get("products/?sku=" + dataArticulos[i].REFERENCIA)
					.then((response) => {
						let idProducto = response.data[0].id;
						let stockProducto = response.data[0].stock_quantity;
						let stockActual = stockProducto - dataArticulos[i].UNIDADES;
						if (idProducto && stockProducto) {
							const data = {
								stock_quantity: stockActual
							};

							apiWooCommerce.put("products/" + idProducto, data)
								.then((response) => {
									if (config.log.SQL) {
										console.log("Stock del producto " + dataArticulos[i].REFERENCIA + " actualizado. Actualmente hay " + stockActual + " unidades en stock");
									}
								})
								.catch((error) => {
									console.log(error);
								});
						}
					})
					.catch((error) => {
						console.log(error);
					});
			}
		}
		prevCounter = counter;
	}, config.time_check);
}

// Middlewares to parse the body of the requests
app.use(bodyParser.urlencoded({
	extended: true,
	limit: "10mb"
}));
app.use(bodyParser.json({
	verify: function (req, res, buf) {
		req.rawBody = buf
	}
}));

app.use('/api', api);
app.listen(config.port, () => console.log(`Express app started on port ${config.port}`));
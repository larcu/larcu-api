const express = require('express');
const bodyParser = require("body-parser");
const config = require("./config/index.js");
const api = require("./api/index.js");

const app = express();
if (config.nodeEnv === "development") {
  const cors = require('cors');
  app.use(cors());
}

app.get('/', function (req, res) {
  res.status(200).send("La API de Winvisión está funcionando correctamente");
});

// Middlewares to parse the body of the requests
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));
app.use(bodyParser.json());

app.use('/api', api);
app.listen(config.port, () => console.log(`Express app started on port ${config.port}`));
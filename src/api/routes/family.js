const express = require('express');
const familyService = require('../../services/family');
const middlewares = require('../middlewares/index');

const route = express.Router();

// All operations require to be logged
route.use('/', middlewares.checkValidUser);

route.get('/:id?', async (req, res) => {
  const result = await familyService.read({
    id: req.params['id'],
    cod: req.body['codigo'],
    des: req.body['descripcion'],
  });

  if (result === "error") {
    res.status(500).send("error");
    return;
  }
  res.send(result);
});

module.exports = route;
const express = require('express');
const itemService = require('../../services/item');
const middlewares = require('../middlewares/index');

const route = express.Router();

// All operations require to be logged
// route.use('/', middlewares.checkValidToken);

route.get('/:id?', async (req, res) => {
  const result = await itemService.read({
    id: req.params['id'],
    ref: req.query['referencia'],
  });

  if (result === "error") {
    res.status(500).send("error");
    return;
  }
  res.send(result);
});

module.exports = route;
const express = require('express');
const itemService = require('../../services/item');
const middlewares = require('../middlewares/index');

const route = express.Router();

// All operations require to be logged
route.use('/', middlewares.checkValidUser);

route.get('/export', async (req, res) => {
  const result = await itemService.exportcsv({
    ref: req.query['referencia'],
    fam: req.query['familia'],
  });

  if (result === "nonExistent") {
    res.status(401).send("non existent family");
    return;
  }
  if (result === "error") {
    res.status(500).send("error");
    return;
  }

  res.attachment('data.csv');
  res.status(200).send(result);
});

route.get('/:id?', async (req, res) => {
  const result = await itemService.read({
    id: req.params['id'],
    ref: req.query['referencia'],
    fam: req.query['familia'],
  });

  if (result === "nonExistent") {
    res.status(401).send("non existent family");
    return;
  }
  if (result === "error") {
    res.status(500).send("error");
    return;
  }
  res.send(result);
});

module.exports = route;
const express = require('express');
const purchaseService = require('../../services/purchase');
const middlewares = require('../middlewares/index');

const route = express.Router();

// All operations require to be logged
route.use('/', middlewares.checkValidUser);

route.post('/', async (req, res) => {
  const result = await purchaseService.create({
    ref: req.body['referencia'],
    unid: req.body['unidades'],
  });

  switch (result) {
    case 'badArguments':
      res.status(400).send('bad request');
      return;
    case 'OutOfStock':
      res.status(400).send('out of stock');
      return;
    case 'almNotExist':
      res.status(400).send('store does not exist');
      return;
    case 'ok':
      res.status(200).send('ok');
      return;
    case 'error':
      res.status(500).send('error');
      return;
  }
});

route.get('/', async (req, res) => {
  const result = await purchaseService.read({
    startDate: req.query['inicio'],
    endDate: req.query['fin'],
  });
  if (result === "error") {
    res.status(500).send("error");
    return;
  }
  res.status(200).send(result);
});

module.exports = route;
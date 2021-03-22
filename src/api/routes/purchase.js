const express = require('express');
const purchaseService = require('../../services/purchase');
const middlewares = require('../middlewares/index');
const config = require('../../config/index.js');
const crypto = require('crypto');

const route = express.Router();

function processWebHookSignature(secret, body, signature) {
  signatureComputed = crypto.createHmac('SHA256', secret)
  .update(body)
  .digest('base64');
  return ( signatureComputed === signature );
}

route.post('/woocommerce', async (req, res) => {
  const secret = config.secret_key;
  const signature = req.header("X-WC-Webhook-Signature");
  let result;
  if(processWebHookSignature(secret, req.rawBody, signature)){
	const id = req.body['id'];
	const items = req.body['line_items'];
	items.forEach(async function(item) {
	  result = await purchaseService.create({
      ref: item.sku,
      unid: item.quantity,
      id: id,
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
  }else{
	  res.status(400).send('unauthorized');
    return;
  }
});

route.post('/', middlewares.checkValidUser, async (req, res) => {
  const result = await purchaseService.create({
    ref: req.body['referencia'],
    unid: req.body['unidades'],
    id: req.body['id'],
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

route.get('/', middlewares.checkValidUser, async (req, res) => {
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
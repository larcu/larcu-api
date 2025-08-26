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
  const signature = req.headers['x-wc-webhook-signature'];

  // Si no viene firma, probablemente sea un "ping" de WordPress al crear webhook
  if (!signature) {
    console.log('Webhook ping recibido desde WordPress (sin firma)');
    return res.status(200).send('pong');
  }
  
  if(processWebHookSignature(secret, req.rawBody, signature)){
    const id = req.body['id'];
    const items = req.body['line_items'];
  
    for (const item of items) {
      try {
        const result = await purchaseService.create({
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
            // Continuar con la iteración para procesar los siguientes items
            break;
          case 'error':
            res.status(500).send('error');
            return;
        }
      } catch (error) {
        console.error("Error at /woocommerce route: ");
        console.error(error);
        res.status(500).send('error');
        return;
      }
    }
    res.status(200).send('ok');
  }else{
	  res.status(400).send('unauthorized');
    return;
  }
});

function verifyShopifyWebhookSignature(secret, body, signature) {
  const calculatedSignature = crypto
    .createHmac('sha256', secret)
    .update(body, 'utf8')
    .digest('base64');

  return calculatedSignature === signature;
}

route.post('/shopify', async (req, res) => {
  const secret = config.shopify_signature;
  const signature = req.headers['x-shopify-hmac-sha256'];

  if(verifyShopifyWebhookSignature(secret, req.rawBody, signature)){
    const id = req.body['id'];
    const items = req.body['line_items'];

    for (const item of items) {
      try {
        const result = await purchaseService.create({
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
            // Continuar con la iteración para procesar los siguientes items
            break;
          case 'error':
            res.status(500).send('error');
            return;
        }
      } catch (error) {
        console.error("Error at /shopify route: ");
        console.error(error);
        res.status(500).send('error');
        return;
      }
    }
    res.status(200).send('ok');
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
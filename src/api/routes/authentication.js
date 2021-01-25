const express = require('express');
const authenticacionService = require('../../services/authentication');
const middlewares = require('../middlewares/index');

const route = express.Router();

route.post('/login', async (req, res) => {
  // Check user credentials
  const tryLog = await authenticacionService.login(req.body['email'], req.body['contrasena']);
  switch (tryLog) {
    case 'badArguments':
      res.status(400).send('bad request');
      return;
    case 'wrongUser':
    case 'wrongPassword':
      res.status(401).send('wrong credentials');
      return;
    case 'error':
      res.status(500).send('error');
      return;
  }

  res.send(tryLog);
});

route.post('/checkJWT', middlewares.checkValidToken);
route.post('/checkJWT', async (req, res) => {
  // If it is here, it passed the checkValidToken middleware => token correct
  res.status(200).send('ok');
});

route.put('/recoverPass', async (req, res) => {
  const response = await authenticacionService.recoverPassRequest(req.body['email']);
  switch (response) {
    case 'badArguments':
      res.status(400).send('bad request');
      return;
    case "ok":
      res.status(202).send("ok");
      return;
    default:
      res.status(500).send("error");
      return;
  }
});

module.exports = route;
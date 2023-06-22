const express = require('express');
const clientService = require('../../services/client');
const middlewares = require('../middlewares/index');

const route = express.Router();

route.post('/', middlewares.checkValidUser, async (req, res) => {
  const result = await clientService.create({
    apellidos: req.body['apellidos'],
    nombre: req.body['nombre'],
    direccion: req.body['direccion'],
    nif: req.body['nif'],
    telefono: req.body['telefono'],
    telefono_movil: req.body['telefono_movil'],
    localidad: req.body['localidad'],
    profesion: req.body['profesion'],
    viene_por: req.body['viene_por'],
    sexo: req.body['sexo'],
    fecha_nacimiento: req.body['fecha_nacimiento'],
    email: req.body['email'],
    web: req.body['web'],
    tienda: req.body['tienda'],
    lopd_consentimiento: req.body['lopd_consentimiento'],
    lopd_correo_normal: req.body['lopd_correo_normal'],
    lopd_correo_publicidad: req.body['lopd_correo_publicidad'],
  });

  switch (result) {
    case 'badArguments':
      res.status(400).send('bad request');
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
  const result = await clientService.read({
    codigo: req.query['codigo'],
    apellidos: req.query['apellidos'],
    nombre: req.query['nombre'],
    nif: req.query['nif'],
    telefono: req.query['telefono'],
  });
  if (result === "error") {
    res.status(500).send("error");
    return;
  }
  res.status(200).send(result);
});

route.put('/:codigo', middlewares.checkValidUser, async (req, res) => {
  const result = await clientService.update({
    codigo: req.params['codigo'],
    apellidos: req.body['apellidos'],
    nombre: req.body['nombre'],
    direccion: req.body['direccion'],
    nif: req.body['nif'],
    telefono: req.body['telefono'],
    telefono_movil: req.body['telefono_movil'],
    localidad: req.body['localidad'],
    profesion: req.body['profesion'],
    viene_por: req.body['viene_por'],
    sexo: req.body['sexo'],
    fecha_nacimiento: req.body['fecha_nacimiento'],
    email: req.body['email'],
    web: req.body['web'],
    tienda: req.body['tienda'],
    lopd_consentimiento: req.body['lopd_consentimiento'],
    lopd_correo_normal: req.body['lopd_correo_normal'],
    lopd_correo_publicidad: req.body['lopd_correo_publicidad'],
  });

  switch (result) {
    case 'badArguments':
      res.status(400).send('bad request');
      return;
    case 'duplicate':
      res.status(400).send('duplicate code');
      return;
    case 'ok':
      res.status(200).send('ok');
      return;
    default:
      res.status(500).send('error');
      return;
  }
});

module.exports = route;
const express = require('express');
const item = require('./routes/item');

const app = express.Router();

app.use('/item', item);

module.exports = app;
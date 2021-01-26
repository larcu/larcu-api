const express = require('express');
const item = require('./routes/item');
const purchase = require('./routes/purchase');

const app = express.Router();

app.use('/item', item);
app.use('/purchase', purchase);

module.exports = app;
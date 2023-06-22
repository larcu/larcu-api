const express = require('express');
const family = require('./routes/family');
const item = require('./routes/item');
const purchase = require('./routes/purchase');
const client = require('./routes/client');

const app = express.Router();

app.use('/family', family);
app.use('/item', item);
app.use('/purchase', purchase);
app.use('/client', client);

module.exports = app;
const express = require('express');
const auth = require('./routes/authentication');
const item = require('./routes/item');

const app = express.Router();

app.use('/auth', auth);
app.use('/item', item);

module.exports = app;
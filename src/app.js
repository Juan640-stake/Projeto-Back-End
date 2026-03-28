const express = require('express');
require('dotenv').config();

const app = express();
app.use(express.json({ limit: '10mb' }));

const userRoutes = require('./routes/user.routes');
const categoryRoutes = require('./routes/category.routes');
const productRoutes = require('./routes/product.routes');

app.use('/v1/user', userRoutes);
app.use('/v1/category', categoryRoutes);
app.use('/v1/product', productRoutes);

module.exports = app;
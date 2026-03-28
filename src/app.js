const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));

const userRoutes = require('./routes/user.routes');
const categoryRoutes = require('./routes/category.routes');
const productRoutes = require('./routes/product.routes');

app.use('/v1/user', userRoutes);
app.use('/v1/category', categoryRoutes);
app.use('/v1/product', productRoutes);

module.exports = app;
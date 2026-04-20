const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/api');

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Agar bisa membaca req.body berupa JSON

// Routes
app.use('/api', apiRoutes);

module.exports = app;
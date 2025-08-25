const express = require('express');
const cors = require('cors');
const app = express();

// Enable CORS for your frontend origin
app.use(cors({
  origin: 'http://192.168.1.229',
  credentials: true
}));

// ...existing code...
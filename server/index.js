const path = require('path');
const fs = require('fs');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/tenants', require('./routes/tenants'));

// When a client build sits next to the server (the Docker image), serve it from the
// same origin as the API so the frontend can call /api without a separate host.
const CLIENT_BUILD = path.join(__dirname, '..', 'client', 'build');

if (fs.existsSync(CLIENT_BUILD)) {
  app.use(express.static(CLIENT_BUILD));
  app.get(/^\/(?!api(\/|$)).*/, (req, res) => res.sendFile(path.join(CLIENT_BUILD, 'index.html')));
} else {
  app.get('/', (req, res) => {
    res.json({ message: 'Rent Calculator API is running' });
  });
}

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.error('MongoDB connection error:', err));

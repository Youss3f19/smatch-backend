const express = require('express');
const cors = require('cors');
require('./config/connect'); // Database connection

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Routes
const userRoutes = require('./routes/userRoutes');
const teamRoutes = require('./routes/teamRoutes');

app.use('/api/users', userRoutes);
app.use('/api/teams', teamRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

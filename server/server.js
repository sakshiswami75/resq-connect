const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

dotenv.config();

require('./config/firebase'); 

console.log('Starting Emergency Resource Sharing API');
console.log('Environment:', process.env.NODE_ENV);
console.log('Port:', process.env.PORT || 5000);
console.log('JWT Secret:', process.env.JWT_SECRET ? '✓ Loaded' : '✗ Missing');
console.log('MongoDB URI:', process.env.MONGO_URI ? '✓ Loaded' : '✗ Missing');
console.log('========================================\n');

connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

console.log('Middleware configured');
console.log('CORS enabled');
console.log('JSON parser enabled\n');

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/emergencies', require('./routes/emergencyRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/volunteers', require('./routes/volunteerRoutes'));

console.log('Routes loaded:');
console.log('  - /api/auth');
console.log('  - /api/emergencies');
console.log('  - /api/dashboard');
console.log('  - /api/admin');
console.log('  - /api/notifications');
console.log('  - /api/volunteers ← NEW\n');

const mongoose = require('mongoose');

// Root route
app.get('/', (req, res) => {
  const mongoStatus = mongoose.connection.readyState;
  const mongoStates = {
    0: 'Disconnected',
    1: 'Connected',
    2: 'Connecting',
    3: 'Disconnecting'
  };

  res.json({ 
    message: 'Emergency Resource Sharing API is running',
    version: '1.0.0',
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    mongodb: mongoStates[mongoStatus] || 'Unknown',
    mongoDetails: {
      status: mongoStatus,
      host: mongoose.connection.host || 'Not connected',
      name: mongoose.connection.name || 'Not connected',
      readyState: mongoStates[mongoStatus]
    }
  });
});

// Health check route
app.get('/health', (req, res) => {
  const mongoStatus = mongoose.connection.readyState;
  const mongoStates = {
    0: 'Disconnected',
    1: 'Connected',
    2: 'Connecting',
    3: 'Disconnecting'
  };

  res.json({ 
    status: mongoStatus === 1 ? 'OK' : 'ERROR',
    message: 'Emergency Resource Sharing API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    mongodb: mongoStates[mongoStatus] || 'Unknown',
    mongoDetails: {
      readyState: mongoStatus,
      host: mongoose.connection.host || 'Not connected',
      database: mongoose.connection.name || 'Not connected'
    }
  });
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log('========================================');
  console.log(`SERVER IS RUNNING`);
  console.log('========================================');
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Server: http://localhost:${PORT}`);
  console.log(`Health Check: http://localhost:${PORT}/`);
  console.log(`API Base: http://localhost:${PORT}/api`);
  console.log('========================================');
  console.log('Server started at:', new Date().toLocaleString());
  console.log('========================================\n');
  console.log('Waiting for requests...\n');
});

server.on('error', (error) => {
  console.error('Server Error:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err.message);
  console.log('Shutting down server...');
  server.close(() => process.exit(1));
});
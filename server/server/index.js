const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const seedAll = require('./seed/seedData');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const interviewRoutes = require('./routes/interviewRoutes');
const practiceRoutes = require('./routes/practiceRoutes');
const resumeRoutes = require('./routes/resumeRoutes');
const companyRoutes = require('./routes/companyRoutes');
const adminRoutes = require('./routes/adminRoutes');
const assistantRoutes = require('./routes/assistantRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

// Determine allowed origins for CORS
const clientOrigins = [
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173'
].filter(Boolean).map(url => url.trim().replace(/\/+$/, ''));

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);

    const cleanOrigin = origin.replace(/\/+$/, '');
    // Allow configured origins, all Render subdomains, and dev environments
    if (
      process.env.NODE_ENV !== 'production' ||
      clientOrigins.includes(cleanOrigin) ||
      cleanOrigin.endsWith('.onrender.com') ||
      cleanOrigin.includes('localhost') ||
      cleanOrigin.includes('127.0.0.1')
    ) {
      return callback(null, true);
    }

    // Default permissive return with warning to avoid breaking public access
    console.warn(`[CORS] Request received from origin: ${origin}`);
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Real-Time Action Logger for Terminal Visibility
app.use((req, res, next) => {
  const start = Date.now();
  const timestamp = new Date().toLocaleTimeString();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const icon = status >= 400 ? '⚠️' : '⚡';
    console.log(`[${timestamp}] ${icon} ${req.method} ${req.originalUrl} | Status: ${status} (${duration}ms)`);
  });
  
  next();
});

// Health Check API - Returns server & MongoDB connection status
app.get('/api/health', (req, res) => {
  const readyStates = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  const dbState = readyStates[mongoose.connection.readyState] || 'unknown';
  const isHealthy = mongoose.connection.readyState === 1;

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'OK' : 'DEGRADED',
    message: isHealthy 
      ? 'CareerPilot API & Database are operational.' 
      : 'CareerPilot API is running, but database connection is not active.',
    environment: process.env.NODE_ENV || 'development',
    server: {
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString()
    },
    database: {
      status: dbState,
      connected: isHealthy,
      name: mongoose.connection.name || 'none'
    }
  });
});

// Mounting API Routes
app.use('/api/auth', authRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/practice', practiceRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/assistant', assistantRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('[SERVER] ❌ Unhandled error:', err.stack);
  const isProd = process.env.NODE_ENV === 'production';
  res.status(err.status || 500).json({
    error: isProd ? 'Internal server error' : err.message,
    ...(isProd ? {} : { stack: err.stack })
  });
});

// Initialize DB and Start Server
const startServer = async () => {
  try {
    await connectDB();
    
    // Seed check: ensure demo accounts and default question bank exist
    try {
      await seedAll();
    } catch (seedErr) {
      console.warn('[DATABASE] ⚠️ Seed notice:', seedErr.message);
    }

    const server = app.listen(PORT, HOST, () => {
      console.log(`\n========================================================================`);
      console.log(`🚀 CAREERPILOT BACKEND ONLINE ON ${HOST}:${PORT}`);
      console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`🐶 Noah / Barkley AI Companion Online & Logging Actions`);
      console.log(`⚡ Ready for User Actions: Login, Tests, Mock Interviews, Resumes`);
      console.log(`========================================================================\n`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`[SERVER] ❌ Port ${PORT} is already in use. Stop the existing process or specify another PORT.`);
      } else {
        console.error('[SERVER] ❌ Failed to start HTTP server:', err);
      }
      process.exit(1);
    });
  } catch (err) {
    console.error('[SERVER] ❌ Failed to start server:', err.message);
    process.exit(1);
  }
};

startServer();

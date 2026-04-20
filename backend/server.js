require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { testConnection, closePool } = require('./config/db');
const investmentCron = require('./jobs/investmentCron');

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================================================
// LOGGING MIDDLEWARE
// ============================================================================
app.use((req, res, next) => {
  const start = Date.now();
  const { method, url, ip } = req;
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    
    let statusColor = '\x1b[32m'; // Green
    if (statusCode >= 400) statusColor = '\x1b[33m'; // Yellow
    if (statusCode >= 500) statusColor = '\x1b[31m'; // Red
    
    console.log(
      `\x1b[36m[${new Date().toISOString()}]\x1b[0m`,
      `${method} ${url}`,
      statusColor + statusCode + '\x1b[0m',
      `\x1b[90m${duration}ms\x1b[0m`,
      `- ${ip}`
    );
  });
  
  next();
});

// ============================================================================
// CORS CONFIGURATION
// ============================================================================
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : [
      'http://localhost:3000', 
      'http://localhost:3001', 
      'http://127.0.0.1:3000',
      'https://app-crypto0us.onrender.com',  // Render frontend URL
      'https://cryptolegacy.vercel.app',      // Add any other frontend URLs
    ];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// ============================================================================
// BODY PARSING MIDDLEWARE
// ============================================================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================================================
// STATIC FILE SERVING
// ============================================================================
const uploadsPath = path.join(__dirname, 'uploads');
const kycUploadsPath = path.join(__dirname, 'uploads', 'kyc');

// Create upload directories if they don't exist
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
  console.log('📁 Created uploads directory:', uploadsPath);
}

if (!fs.existsSync(kycUploadsPath)) {
  fs.mkdirSync(kycUploadsPath, { recursive: true });
  console.log('📁 Created KYC uploads directory:', kycUploadsPath);
}

// Serve static files with proper headers
app.use('/uploads', express.static(uploadsPath, {
  setHeaders: (res, filePath) => {
    // Set cache control for images
    if (filePath.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year
    }
    // Security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
  }
}));

// ============================================================================
// SECURITY HEADERS
// ============================================================================
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// ============================================================================
// API ROUTES
// ============================================================================
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/investments', require('./routes/investments'));
app.use('/api/deposits', require('./routes/deposits'));
app.use('/api/withdrawals', require('./routes/withdrawals'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/kyc', require('./routes/kyc'));
app.use('/api/settings', require('./routes/settings'));

// ============================================================================
// HEALTH CHECK ENDPOINTS
// ============================================================================
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/api/health/detailed', async (req, res) => {
  try {
    const { pool } = require('./config/db');
    const dbResult = await pool.query('SELECT NOW()');
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: {
        connected: true,
        time: dbResult.rows[0].now
      },
      memory: process.memoryUsage(),
      nodeVersion: process.version
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: false,
        error: error.message
      }
    });
  }
});

// ============================================================================
// ROOT ENDPOINT
// ============================================================================
app.get('/', (req, res) => {
  res.json({
    name: 'CryptoLegacy API',
    version: '1.0.0',
    status: 'running',
    baseUrl: 'https://app-crypto0us.onrender.com',
    documentation: '/api',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      investments: '/api/investments',
      deposits: '/api/deposits',
      withdrawals: '/api/withdrawals',
      admin: '/api/admin',
      kyc: '/api/kyc',
      settings: '/api/settings',
      health: '/api/health'
    }
  });
});

// ============================================================================
// 404 HANDLER
// ============================================================================
app.use((req, res) => {
  console.log(`⚠️ 404 Not Found: ${req.method} ${req.url}`);
  res.status(404).json({ 
    message: 'Endpoint not found',
    method: req.method,
    path: req.url
  });
});

// ============================================================================
// GLOBAL ERROR HANDLER
// ============================================================================
app.use((err, req, res, next) => {
  console.error('❌ Global Error Handler:', err);
  
  // Handle specific error types
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: err.message });
  }
  
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'File too large' });
  }
  
  // Default error response
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================
let server;

const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  
  if (server) {
    server.close(async () => {
      console.log('✅ HTTP server closed');
      
      // Close database pool using closePool function
      try {
        await closePool();
        console.log('✅ Database pool closed');
      } catch (err) {
        console.error('❌ Error closing database pool:', err);
      }
      
      // Stop cron jobs
      try {
        investmentCron.stop();
        console.log('✅ Cron jobs stopped');
      } catch (err) {
        console.error('❌ Error stopping cron jobs:', err);
      }
      
      console.log('👋 Graceful shutdown complete');
      process.exit(0);
    });
    
    // Force exit after 10 seconds
    setTimeout(() => {
      console.error('❌ Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
};

// Listen for shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

// ============================================================================
// START SERVER
// ============================================================================
console.log('═══════════════════════════════════════════════════════════');
console.log('🚀 CryptoLegacy Backend Server');
console.log('═══════════════════════════════════════════════════════════');
console.log(`📌 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`📌 Port: ${PORT}`);
console.log(`📌 Uploads Directory: ${uploadsPath}`);
console.log(`📌 KYC Uploads Directory: ${kycUploadsPath}`);
console.log(`📌 API Base URL: https://app-crypto0us.onrender.com/api`);
console.log('═══════════════════════════════════════════════════════════');

testConnection().then(() => {
  // Bind to 0.0.0.0 for Render/cloud deployments
  server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
    console.log(`🌐 Public URL: https://app-crypto0us.onrender.com`);
    console.log(`📋 API Documentation: https://app-crypto0us.onrender.com/`);
    console.log(`💚 Health Check: https://app-crypto0us.onrender.com/api/health`);
    console.log(`📊 Detailed Health: https://app-crypto0us.onrender.com/api/health/detailed`);
    console.log('═══════════════════════════════════════════════════════════');
    
    // Start cron jobs
    try {
      investmentCron.start();
      console.log('⏰ Investment payout cron job started (runs every 5 minutes)');
    } catch (err) {
      console.error('❌ Failed to start cron job:', err);
    }
  });
}).catch(err => {
  console.error('❌ Failed to connect to database:', err);
  console.error('💡 Please check:');
  console.error('   1. PostgreSQL is running (Neon)');
  console.error('   2. DATABASE_URL in .env is correct and includes ?sslmode=require');
  console.error('   3. Database "neondb" exists and is accessible');
  process.exit(1);
});

module.exports = app;

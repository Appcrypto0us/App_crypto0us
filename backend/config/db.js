const { Pool } = require('pg');

// Neon requires SSL always (not just in production)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required for Neon
  },
  // Connection pool settings optimized for serverless
  max: 10,                        // Maximum number of clients
  idleTimeoutMillis: 30000,       // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection could not be established
  keepAlive: true,                // Keep connections alive
  keepAliveInitialDelayMillis: 10000, // Delay before keepalive probes
});

// Handle pool errors
pool.on('error', (err, client) => {
  console.error('⚠️ Unexpected database pool error:', err.message);
  console.error('   Details:', {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
  });
});

async function testConnection() {
  const client = await pool.connect();
  try {
    console.log('🔌 Testing database connection...');
    
    // Test query to get database info
    const result = await client.query(`
      SELECT 
        NOW() as current_time,
        current_database() as database_name,
        version() as version,
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as table_count
    `);
    
    const info = result.rows[0];
    
    console.log('✅ Database connected successfully to Neon');
    console.log(`   Database: ${info.database_name}`);
    console.log(`   Time: ${new Date(info.current_time).toLocaleString()}`);
    console.log(`   Version: ${info.version.split(' ').slice(0, 3).join(' ')}`);
    console.log(`   Tables: ${info.table_count} tables found`);
    console.log(`   Pool: ${pool.totalCount} total, ${pool.idleCount} idle, ${pool.waitingCount} waiting`);
    
    return true;
  } catch (err) {
    console.error('❌ Database connection error:', err.message);
    console.error('   Hint: Make sure your DATABASE_URL is correct and includes ?sslmode=require');
    throw err;
  } finally {
    client.release();
  }
}

// Graceful shutdown function
async function closePool() {
  try {
    console.log('🔄 Closing database connection pool...');
    await pool.end();
    console.log('✅ Database pool closed successfully');
  } catch (err) {
    console.error('❌ Error closing database pool:', err.message);
  }
}

// Health check function
async function healthCheck() {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    return { healthy: true, message: 'Database is responsive' };
  } catch (err) {
    return { 
      healthy: false, 
      message: err.message,
      poolStats: {
        total: pool.totalCount,
        idle: pool.idleCount,
        waiting: pool.waitingCount,
      }
    };
  }
}

// Get pool statistics
function getPoolStats() {
  return {
    totalConnections: pool.totalCount,
    idleConnections: pool.idleCount,
    waitingRequests: pool.waitingCount,
  };
}

module.exports = { 
  pool, 
  testConnection, 
  closePool, 
  healthCheck, 
  getPoolStats 
};

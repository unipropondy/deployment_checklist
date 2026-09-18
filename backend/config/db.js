const sql = require('mssql');
require('dotenv').config();

const REQUIRED_DB_NAME = 'DEPLOYCHECK';

// Validate DB_NAME environment variable
if (!process.env.DB_NAME || process.env.DB_NAME.trim() !== REQUIRED_DB_NAME) {
  console.error("FATAL ERROR: Database isolation check failed!");
  throw new Error("Database isolation error: Application is allowed to connect only to DEPLOYCHECK.");
}

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 1433,
  database: REQUIRED_DB_NAME,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

let pool = null;

const connectDB = async () => {
  try {
    if (!pool) {
      pool = await sql.connect(config);
      
      // Perform runtime SQL Context DB verification query
      const result = await pool.request().query('SELECT DB_NAME() AS DatabaseName');
      const activeDb = result.recordset[0]?.DatabaseName;

      if (activeDb !== REQUIRED_DB_NAME) {
        await pool.close();
        pool = null;
        throw new Error(`Database isolation error: Active database connection is '${activeDb}', but application is allowed to connect only to ${REQUIRED_DB_NAME}.`);
      }

      console.log(`[Database] Connected successfully to Microsoft SQL Server [Database: ${REQUIRED_DB_NAME}]`);
    }
    return pool;
  } catch (err) {
    console.error('[Database Connection Failed]:', err.message);
    throw err;
  }
};

const getPool = () => {
  if (!pool) {
    throw new Error('Database pool not initialized. Call connectDB first.');
  }
  return pool;
};

module.exports = {
  connectDB,
  getPool,
  sql,
  REQUIRED_DB_NAME
};

require('dotenv').config({ path: 'backend/.env' });
const { connectDB, getPool } = require('../backend/config/db');

async function check() {
  try {
    await connectDB();
    const pool = getPool();
    const res = await pool.request().query('SELECT UserId, Name, IsActive, PasswordHash FROM Users');
    console.log('USERS IN DB:', JSON.stringify(res.recordset, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('ERROR:', err);
    process.exit(1);
  }
}

check();

const { getPool, sql } = require('../config/db');

const generateCheckId = async () => {
  const pool = getPool();
  const result = await pool.request().query('SELECT TOP 1 CheckId FROM TestRuns ORDER BY TestRunId DESC');
  
  if (result.recordset.length === 0 || !result.recordset[0].CheckId) {
    return 'CHK-001';
  }

  const lastId = result.recordset[0].CheckId;
  const matches = lastId.match(/CHK-(\d+)/i);
  
  if (matches && matches[1]) {
    const num = parseInt(matches[1], 10) + 1;
    return `CHK-${num.toString().padStart(3, '0')}`;
  }

  return `CHK-${Date.now().toString().slice(-4)}`;
};

module.exports = { generateCheckId };

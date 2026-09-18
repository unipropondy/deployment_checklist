const { connectDB, getPool } = require('./config/db');

async function dropEmailColumn() {
  try {
    await connectDB();
    const pool = getPool();
    
    // Find constraint names associated with Email column
    const constraintResult = await pool.request().query(`
      SELECT dc.name 
      FROM sys.default_constraints dc
      JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
      WHERE dc.parent_object_id = OBJECT_ID('Users') AND c.name = 'Email'
      UNION
      SELECT kc.name 
      FROM sys.key_constraints kc
      JOIN sys.index_columns ic ON kc.parent_object_id = ic.object_id AND kc.unique_index_id = ic.index_id
      JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
      WHERE kc.parent_object_id = OBJECT_ID('Users') AND c.name = 'Email'
      UNION
      SELECT i.name 
      FROM sys.indexes i
      JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
      JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
      WHERE i.object_id = OBJECT_ID('Users') AND c.name = 'Email' AND i.is_primary_key = 0
    `);

    for (const row of constraintResult.recordset) {
      console.log(`Dropping constraint/index: ${row.name}`);
      try {
        await pool.request().query(`ALTER TABLE Users DROP CONSTRAINT [${row.name}]`);
      } catch (e1) {
        try {
          await pool.request().query(`DROP INDEX [${row.name}] ON Users`);
        } catch (e2) {
          console.warn(`Could not drop ${row.name}: ${e2.message}`);
        }
      }
    }

    console.log('Dropping Email column...');
    await pool.request().query(`
      IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'Email')
      BEGIN
        ALTER TABLE Users DROP COLUMN Email;
      END
    `);

    console.log('Successfully dropped Email column from Users table!');
    process.exit(0);
  } catch (err) {
    console.error('Error dropping Email column:', err);
    process.exit(1);
  }
}

dropEmailColumn();

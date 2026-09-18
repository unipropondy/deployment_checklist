const { getPool, sql } = require('../config/db');

const getBuilds = async (req, res, next) => {
  try {
    const pool = getPool();
    const result = await pool.request().query('SELECT * FROM Builds ORDER BY BuildId DESC');
    res.status(200).json({
      success: true,
      data: result.recordset
    });
  } catch (error) {
    next(error);
  }
};

const createBuild = async (req, res, next) => {
  try {
    const { Version, Environment, Remarks } = req.body;
    if (!Version || !Environment) {
      return res.status(400).json({
        success: false,
        message: 'Version and Environment are required'
      });
    }

    const pool = getPool();
    const result = await pool.request()
      .input('Version', sql.VarChar, Version)
      .input('Environment', sql.VarChar, Environment)
      .input('Remarks', sql.VarChar, Remarks || '')
      .query('INSERT INTO Builds (Version, Environment, Remarks) VALUES (@Version, @Environment, @Remarks); SELECT SCOPE_IDENTITY() AS BuildId;');

    res.status(201).json({
      success: true,
      message: 'Build created successfully',
      data: {
        BuildId: result.recordset[0].BuildId,
        Version,
        Environment,
        Remarks
      }
    });
  } catch (error) {
    next(error);
  }
};

const updateBuild = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { Version, Environment, Remarks } = req.body;
    const pool = getPool();

    await pool.request()
      .input('id', sql.Int, id)
      .input('Version', sql.VarChar, Version)
      .input('Environment', sql.VarChar, Environment)
      .input('Remarks', sql.VarChar, Remarks || '')
      .query('UPDATE Builds SET Version = @Version, Environment = @Environment, Remarks = @Remarks WHERE BuildId = @id');

    res.status(200).json({
      success: true,
      message: 'Build updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getBuilds, createBuild, updateBuild };

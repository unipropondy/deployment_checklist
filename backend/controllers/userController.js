const { getPool, sql } = require('../config/db');
const bcrypt = require('bcrypt');

const getUsers = async (req, res, next) => {
  try {
    const pool = getPool();
    const result = await pool.request().query(
      'SELECT UserId, Name, IsActive, CreatedAt FROM Users ORDER BY UserId DESC'
    );
    res.status(200).json({
      success: true,
      data: result.recordset
    });
  } catch (error) {
    next(error);
  }
};

const createUser = async (req, res, next) => {
  try {
    const { Name, Password } = req.body;
    if (!Name || !Password) {
      return res.status(400).json({
        success: false,
        message: 'Name and Password are required'
      });
    }

    const pool = getPool();
    const existing = await pool.request()
      .input('Name', sql.VarChar, Name)
      .query('SELECT UserId FROM Users WHERE Name = @Name');

    if (existing.recordset.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'A user with this name already exists'
      });
    }

    const passwordHash = await bcrypt.hash(Password, 10);
    const result = await pool.request()
      .input('Name', sql.VarChar, Name)
      .input('PasswordHash', sql.VarChar, passwordHash)
      .input('IsActive', sql.Bit, 1)
      .query('INSERT INTO Users (Name, PasswordHash, IsActive) VALUES (@Name, @PasswordHash, @IsActive); SELECT SCOPE_IDENTITY() AS UserId;');

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        UserId: result.recordset[0].UserId,
        Name,
        IsActive: true
      }
    });
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { Name, Password } = req.body;
    const pool = getPool();

    let query = 'UPDATE Users SET Name = @Name';
    const reqQuery = pool.request()
      .input('id', sql.Int, id)
      .input('Name', sql.VarChar, Name);

    if (Password && Password.trim()) {
      const passwordHash = await bcrypt.hash(Password, 10);
      query += ', PasswordHash = @PasswordHash';
      reqQuery.input('PasswordHash', sql.VarChar, passwordHash);
    }

    query += ' WHERE UserId = @id;';
    await reqQuery.query(query);

    res.status(200).json({
      success: true,
      message: 'User updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { IsActive } = req.body;
    const pool = getPool();

    await pool.request()
      .input('id', sql.Int, id)
      .input('IsActive', sql.Bit, IsActive ? 1 : 0)
      .query('UPDATE Users SET IsActive = @IsActive WHERE UserId = @id');

    res.status(200).json({
      success: true,
      message: `User status updated to ${IsActive ? 'Active' : 'Inactive'}`
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getUsers, createUser, updateUser, updateStatus };

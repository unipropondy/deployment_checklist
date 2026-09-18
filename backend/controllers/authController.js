const { getPool, sql } = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const login = async (req, res, next) => {
  try {
    const { Username, name, Password, password } = req.body;
    const rawUser = Username || name || '';
    const rawPass = Password || password || '';
    const loginUser = rawUser.trim();
    const loginPass = rawPass.trim();

    if (!loginUser || !loginPass) {
      return res.status(400).json({
        success: false,
        message: 'Please provide Username and Password'
      });
    }

    const pool = getPool();
    const result = await pool.request()
      .input('identifier', sql.VarChar, loginUser)
      .query('SELECT * FROM Users WHERE Name = @identifier');

    if (result.recordset.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const user = result.recordset[0];

    if (user.IsActive === false || user.IsActive === 0) {
      return res.status(403).json({
        success: false,
        message: 'User account is inactive'
      });
    }

    // Password comparison (supports bcrypt hash or plaintext stored in database)
    let isMatch = false;
    if (user.PasswordHash.startsWith('$2a$') || user.PasswordHash.startsWith('$2b$')) {
      isMatch = await bcrypt.compare(loginPass, user.PasswordHash);
    } else {
      isMatch = user.PasswordHash === loginPass;
    }

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = jwt.sign(
      { UserId: user.UserId, Name: user.Name },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '30d' }
    );

    // Return safe user information WITHOUT PasswordHash
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          UserId: user.UserId,
          Name: user.Name,
          IsActive: user.IsActive
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const pool = getPool();
    const result = await pool.request()
      .input('UserId', sql.Int, req.user.UserId)
      .query('SELECT UserId, Name, IsActive, CreatedAt FROM Users WHERE UserId = @UserId');

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: result.recordset[0]
    });
  } catch (error) {
    next(error);
  }
};

const register = async (req, res, next) => {
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
        message: 'User with this name already exists'
      });
    }

    const passwordHash = await bcrypt.hash(Password, 10);
    const insertResult = await pool.request()
      .input('Name', sql.VarChar, Name)
      .input('PasswordHash', sql.VarChar, passwordHash)
      .input('IsActive', sql.Bit, 1)
      .query('INSERT INTO Users (Name, PasswordHash, IsActive) VALUES (@Name, @PasswordHash, @IsActive); SELECT SCOPE_IDENTITY() AS UserId;');

    const newUserId = insertResult.recordset[0].UserId;

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        UserId: newUserId,
        Name,
        IsActive: true
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { login, getMe, register };

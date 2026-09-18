const { getPool, sql } = require('../config/db');

const getShops = async (req, res, next) => {
  try {
    const pool = getPool();
    const result = await pool.request().query('SELECT * FROM Shops ORDER BY ShopId DESC');
    res.status(200).json({
      success: true,
      data: result.recordset
    });
  } catch (error) {
    next(error);
  }
};

const createShop = async (req, res, next) => {
  try {
    const { ShopCode, ShopName, Location } = req.body;
    if (!ShopCode || !ShopName) {
      return res.status(400).json({
        success: false,
        message: 'ShopCode and ShopName are required'
      });
    }

    const pool = getPool();
    const result = await pool.request()
      .input('ShopCode', sql.VarChar, ShopCode)
      .input('ShopName', sql.VarChar, ShopName)
      .input('Location', sql.VarChar, Location || '')
      .input('IsActive', sql.Bit, 1)
      .query('INSERT INTO Shops (ShopCode, ShopName, Location, IsActive) VALUES (@ShopCode, @ShopName, @Location, @IsActive); SELECT SCOPE_IDENTITY() AS ShopId;');

    res.status(201).json({
      success: true,
      message: 'Shop created successfully',
      data: {
        ShopId: result.recordset[0].ShopId,
        ShopCode,
        ShopName,
        Location,
        IsActive: true
      }
    });
  } catch (error) {
    next(error);
  }
};

const updateShop = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { ShopCode, ShopName, Location } = req.body;
    const pool = getPool();

    await pool.request()
      .input('id', sql.Int, id)
      .input('ShopCode', sql.VarChar, ShopCode)
      .input('ShopName', sql.VarChar, ShopName)
      .input('Location', sql.VarChar, Location || '')
      .query('UPDATE Shops SET ShopCode = @ShopCode, ShopName = @ShopName, Location = @Location WHERE ShopId = @id');

    res.status(200).json({
      success: true,
      message: 'Shop updated successfully'
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
      .query('UPDATE Shops SET IsActive = @IsActive WHERE ShopId = @id');

    res.status(200).json({
      success: true,
      message: `Shop status updated to ${IsActive ? 'Active' : 'Inactive'}`
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getShops, createShop, updateShop, updateStatus };

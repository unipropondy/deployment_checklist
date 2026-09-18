const { getPool, sql } = require('../config/db');

const getCategories = async (req, res, next) => {
  try {
    const pool = getPool();
    const result = await pool.request().query('SELECT * FROM ChecklistCategories WHERE IsActive = 1 ORDER BY DisplayOrder ASC');
    res.status(200).json({
      success: true,
      data: result.recordset
    });
  } catch (error) {
    next(error);
  }
};

const getItems = async (req, res, next) => {
  try {
    const pool = getPool();
    const result = await pool.request().query(`
      SELECT 
        cm.ChecklistId,
        cm.CategoryId,
        cc.CategoryName,
        cm.SNo,
        cm.ChecklistCode,
        cm.ChecklistItem,
        cm.IsActive,
        cm.DisplayOrder
      FROM ChecklistMaster cm
      LEFT JOIN ChecklistCategories cc ON cm.CategoryId = cc.CategoryId
      WHERE cm.IsActive = 1
      ORDER BY cc.DisplayOrder ASC, cm.DisplayOrder ASC, cm.SNo ASC
    `);
    res.status(200).json({
      success: true,
      data: result.recordset
    });
  } catch (error) {
    next(error);
  }
};

const getItemById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pool = getPool();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT 
          cm.*,
          cc.CategoryName
        FROM ChecklistMaster cm
        LEFT JOIN ChecklistCategories cc ON cm.CategoryId = cc.CategoryId
        WHERE cm.ChecklistId = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Checklist item not found'
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

const createChecklistItem = async (req, res, next) => {
  try {
    const { CategoryId, SNo, ChecklistCode, ChecklistItem, DisplayOrder } = req.body;
    if (!CategoryId || !ChecklistItem) {
      return res.status(400).json({ success: false, message: 'CategoryId and ChecklistItem are required' });
    }
    const pool = getPool();
    const code = ChecklistCode || `CHK-${Math.floor(100 + Math.random() * 900)}`;
    const result = await pool.request()
      .input('CategoryId', sql.Int, CategoryId)
      .input('SNo', sql.Int, SNo || 1)
      .input('ChecklistCode', sql.NVarChar, code)
      .input('ChecklistItem', sql.NVarChar, ChecklistItem)
      .input('DisplayOrder', sql.Int, DisplayOrder || 1)
      .query(`
        INSERT INTO ChecklistMaster (CategoryId, SNo, ChecklistCode, ChecklistItem, DisplayOrder, IsActive)
        OUTPUT INSERTED.ChecklistId
        VALUES (@CategoryId, @SNo, @ChecklistCode, @ChecklistItem, @DisplayOrder, 1)
      `);
    res.status(201).json({ success: true, message: 'Checklist item created successfully', ChecklistId: result.recordset[0].ChecklistId });
  } catch (error) {
    next(error);
  }
};

const updateChecklistItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { ChecklistItem, CategoryId, SNo } = req.body;
    const pool = getPool();
    await pool.request()
      .input('id', sql.Int, id)
      .input('ChecklistItem', sql.NVarChar, ChecklistItem)
      .input('CategoryId', sql.Int, CategoryId || 1)
      .input('SNo', sql.Int, SNo || 1)
      .query(`
        UPDATE ChecklistMaster
        SET ChecklistItem = COALESCE(@ChecklistItem, ChecklistItem),
            CategoryId = COALESCE(@CategoryId, CategoryId),
            SNo = COALESCE(@SNo, SNo)
        WHERE ChecklistId = @id
      `);
    res.status(200).json({ success: true, message: 'Checklist item updated successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getCategories, getItems, getItemById, createChecklistItem, updateChecklistItem };

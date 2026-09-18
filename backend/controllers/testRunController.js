const { getPool, sql } = require('../config/db');
const { generateCheckId } = require('../utils/generateCheckId');

const getTestRuns = async (req, res, next) => {
  try {
    const pool = getPool();
    const [result, usersRes] = await Promise.all([
      pool.request().query(`
        SELECT 
          tr.TestRunId,
          tr.CheckId,
          tr.ShopId,
          s.ShopName,
          s.ShopCode,
          tr.BuildId,
          b.Version AS BuildVersion,
          b.Environment AS BuildEnvironment,
          tr.CheckedBy,
          tr.CheckDate,
          tr.Status,
          tr.CreatedAt,
          tr.CompletedAt,
          COUNT(tri.TestRunItemId) AS TotalItems,
          SUM(CASE WHEN tri.Status <> 'Pending' THEN 1 ELSE 0 END) AS CompletedItems,
          SUM(CASE WHEN tri.Status = 'Pass' THEN 1 ELSE 0 END) AS PassedItems,
          SUM(CASE WHEN tri.Status = 'Fail' THEN 1 ELSE 0 END) AS FailedItems,
          SUM(CASE WHEN tri.Status = 'Pending' THEN 1 ELSE 0 END) AS PendingItems,
          SUM(CASE WHEN tri.Status = 'N/A' THEN 1 ELSE 0 END) AS NaItems
        FROM TestRuns tr
        LEFT JOIN Shops s ON tr.ShopId = s.ShopId
        LEFT JOIN Builds b ON tr.BuildId = b.BuildId
        LEFT JOIN TestRunItems tri ON tr.TestRunId = tri.TestRunId
        GROUP BY 
          tr.TestRunId, tr.CheckId, tr.ShopId, s.ShopName, s.ShopCode, 
          tr.BuildId, b.Version, b.Environment, tr.CheckedBy, tr.CheckDate, 
          tr.Status, tr.CreatedAt, tr.CompletedAt
        ORDER BY tr.TestRunId DESC
      `),
      pool.request().query('SELECT UserId, Name FROM Users')
    ]);

    const userMap = {};
    (usersRes.recordset || []).forEach(u => {
      if (u.UserId !== undefined && u.UserId !== null) userMap[String(u.UserId)] = u.Name;
      if (u.Name) userMap[String(u.Name).toLowerCase()] = u.Name;
    });

    const formatted = result.recordset.map(run => {
      const total = run.TotalItems || 0;
      const completed = run.CompletedItems || 0;
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
      const checkedVal = String(run.CheckedBy || '').trim();
      const resolvedName = userMap[checkedVal.toLowerCase()] || (checkedVal === '1' ? 'Admin User' : checkedVal) || 'Admin User';
      return {
        ...run,
        CheckedBy: resolvedName,
        Progress: progress
      };
    });

    res.status(200).json({
      success: true,
      data: formatted
    });
  } catch (error) {
    next(error);
  }
};

const getTestRunById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pool = getPool();

    const [runResult, usersRes] = await Promise.all([
      pool.request()
        .input('id', sql.Int, id)
        .query(`
          SELECT 
            tr.TestRunId,
            tr.CheckId,
            tr.ShopId,
            s.ShopName,
            s.ShopCode,
            tr.BuildId,
            b.Version AS BuildVersion,
            b.Environment AS BuildEnvironment,
            tr.CheckedBy,
            tr.CheckDate,
            tr.Status,
            tr.CreatedAt,
            tr.CompletedAt
          FROM TestRuns tr
          LEFT JOIN Shops s ON tr.ShopId = s.ShopId
          LEFT JOIN Builds b ON tr.BuildId = b.BuildId
          WHERE tr.TestRunId = @id
        `),
      pool.request().query('SELECT UserId, Name FROM Users')
    ]);

    if (runResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Test Run not found'
      });
    }

    const testRun = runResult.recordset[0];
    const userMap = {};
    (usersRes.recordset || []).forEach(u => {
      if (u.UserId !== undefined && u.UserId !== null) userMap[String(u.UserId)] = u.Name;
      if (u.Name) userMap[String(u.Name).toLowerCase()] = u.Name;
    });

    const checkedVal = String(testRun.CheckedBy || '').trim();
    const resolvedCheckedBy = userMap[checkedVal.toLowerCase()] || (checkedVal === '1' ? 'Admin User' : checkedVal) || 'Admin User';
    testRun.CheckedBy = resolvedCheckedBy;

    const itemsResult = await pool.request()
      .input('TestRunId', sql.Int, id)
      .query(`
        SELECT 
          tri.TestRunItemId,
          tri.TestRunId,
          tri.ChecklistId,
          tri.Status,
          tri.Remarks,
          tri.CheckedAt,
          cm.SNo,
          cm.ChecklistCode,
          cm.ChecklistItem,
          cm.CategoryId,
          cc.CategoryName,
          cc.DisplayOrder AS CategoryDisplayOrder
        FROM TestRunItems tri
        JOIN ChecklistMaster cm ON tri.ChecklistId = cm.ChecklistId
        LEFT JOIN ChecklistCategories cc ON cm.CategoryId = cc.CategoryId
        WHERE tri.TestRunId = @TestRunId
        ORDER BY cc.DisplayOrder ASC, cm.DisplayOrder ASC, cm.SNo ASC
      `);

    const items = itemsResult.recordset;
    const totalItems = items.length;
    const completedItems = items.filter(i => i.Status !== 'Pending').length;
    const passedItems = items.filter(i => i.Status === 'Pass').length;
    const failedItems = items.filter(i => i.Status === 'Fail').length;
    const pendingItems = items.filter(i => i.Status === 'Pending').length;
    const naItems = items.filter(i => i.Status === 'N/A').length;
    const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    res.status(200).json({
      success: true,
      data: {
        ...testRun,
        TotalItems: totalItems,
        CompletedItems: completedItems,
        PassedItems: passedItems,
        FailedItems: failedItems,
        PendingItems: pendingItems,
        NaItems: naItems,
        Progress: progress,
        Items: items
      }
    });
  } catch (error) {
    next(error);
  }
};

const createTestRun = async (req, res, next) => {
  const pool = getPool();
  const transaction = new sql.Transaction(pool);

  try {
    const { ShopId, BuildId, CheckDate } = req.body;
    if (!ShopId || !BuildId) {
      return res.status(400).json({
        success: false,
        message: 'ShopId and BuildId are required'
      });
    }

    // CheckedBy column in TestRuns table is INT (storing UserId)
    const checkedById = (req.user && req.user.UserId) ? parseInt(req.user.UserId, 10) : 1;
    const checkedByName = req.user ? req.user.Name : 'Admin User';

    const checkId = await generateCheckId();
    const checkDateVal = CheckDate ? new Date(CheckDate) : new Date();

    await transaction.begin();

    const runResult = await transaction.request()
      .input('CheckId', sql.VarChar, checkId)
      .input('ShopId', sql.Int, ShopId)
      .input('BuildId', sql.Int, BuildId)
      .input('CheckedBy', sql.Int, checkedById)
      .input('CheckDate', sql.DateTime, checkDateVal)
      .input('Status', sql.VarChar, 'In Progress')
      .query(`
        INSERT INTO TestRuns (CheckId, ShopId, BuildId, CheckedBy, CheckDate, Status)
        VALUES (@CheckId, @ShopId, @BuildId, @CheckedBy, @CheckDate, @Status);
        SELECT SCOPE_IDENTITY() AS TestRunId;
      `);

    const testRunId = runResult.recordset[0].TestRunId;

    const masterResult = await transaction.request().query(
      'SELECT ChecklistId FROM ChecklistMaster WHERE IsActive = 1 ORDER BY ChecklistId ASC'
    );

    const masterItems = masterResult.recordset;

    for (const item of masterItems) {
      await transaction.request()
        .input('TestRunId', sql.Int, testRunId)
        .input('ChecklistId', sql.Int, item.ChecklistId)
        .input('Status', sql.VarChar, 'Pending')
        .input('Remarks', sql.VarChar, '')
        .query(`
          INSERT INTO TestRunItems (TestRunId, ChecklistId, Status, Remarks)
          VALUES (@TestRunId, @ChecklistId, @Status, @Remarks)
        `);
    }

    await transaction.commit();

    res.status(201).json({
      success: true,
      message: 'Test run created successfully',
      data: {
        TestRunId: testRunId,
        CheckId: checkId,
        ShopId,
        BuildId,
        CheckedBy: checkedByName,
        CheckDate: checkDateVal,
        Status: 'In Progress',
        TotalItems: masterItems.length
      }
    });
  } catch (error) {
    if (transaction._aborted === false) {
      await transaction.rollback();
    }
    next(error);
  }
};

const updateTestRunItem = async (req, res, next) => {
  try {
    const { testRunId, itemId } = req.params;
    const { Status, Remarks } = req.body;

    const pool = getPool();
    const reqQuery = pool.request()
      .input('testRunId', sql.Int, testRunId)
      .input('itemId', sql.Int, itemId);

    let queryParts = [];
    if (Status !== undefined) {
      const validStatuses = ['Pending', 'Pass', 'Fail', 'N/A'];
      if (!validStatuses.includes(Status)) {
        return res.status(400).json({
          success: false,
          message: 'Status must be one of: Pending, Pass, Fail, N/A'
        });
      }
      queryParts.push('Status = @Status');
      reqQuery.input('Status', sql.VarChar, Status);
    }

    if (Remarks !== undefined) {
      queryParts.push('Remarks = @Remarks');
      reqQuery.input('Remarks', sql.VarChar, Remarks);
    }

    queryParts.push('CheckedAt = GETDATE()');

    if (queryParts.length === 1) {
      return res.status(400).json({
        success: false,
        message: 'No fields provided to update'
      });
    }

    const query = `UPDATE TestRunItems SET ${queryParts.join(', ')} WHERE TestRunId = @testRunId AND TestRunItemId = @itemId`;
    await reqQuery.query(query);

    res.status(200).json({
      success: true,
      message: 'Test run item updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

const completeTestRun = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pool = getPool();

    const pendingResult = await pool.request()
      .input('TestRunId', sql.Int, id)
      .query("SELECT COUNT(*) AS PendingCount FROM TestRunItems WHERE TestRunId = @TestRunId AND Status = 'Pending'");

    const pendingCount = pendingResult.recordset[0].PendingCount;

    if (pendingCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Please complete all checklist items before closing this test.'
      });
    }

    await pool.request()
      .input('id', sql.Int, id)
      .query("UPDATE TestRuns SET Status = 'Completed', CompletedAt = GETDATE() WHERE TestRunId = @id");

    res.status(200).json({
      success: true,
      message: 'Test run completed successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTestRuns,
  getTestRunById,
  createTestRun,
  updateTestRunItem,
  completeTestRun
};

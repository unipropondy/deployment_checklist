const express = require('express');
const router = express.Router();
const {
  getTestRuns,
  getTestRunById,
  createTestRun,
  updateTestRunItem,
  completeTestRun
} = require('../controllers/testRunController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/', getTestRuns);
router.get('/:id', getTestRunById);
router.post('/', createTestRun);
router.put('/:testRunId/items/:itemId', updateTestRunItem);
router.post('/:id/complete', completeTestRun);

module.exports = router;

const express = require('express');
const router = express.Router();
const { getBuilds, createBuild, updateBuild } = require('../controllers/buildController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/', getBuilds);
router.post('/', createBuild);
router.put('/:id', updateBuild);

module.exports = router;

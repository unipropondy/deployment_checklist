const express = require('express');
const router = express.Router();
const { getCategories, getItems, getItemById, createChecklistItem, updateChecklistItem } = require('../controllers/checklistController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/categories', getCategories);
router.get('/items', getItems);
router.get('/items/:id', getItemById);
router.post('/items', createChecklistItem);
router.put('/items/:id', updateChecklistItem);

module.exports = router;

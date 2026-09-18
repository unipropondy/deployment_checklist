const express = require('express');
const router = express.Router();
const { getShops, createShop, updateShop, updateStatus } = require('../controllers/shopController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/', getShops);
router.post('/', createShop);
router.put('/:id', updateShop);
router.patch('/:id/status', updateStatus);

module.exports = router;

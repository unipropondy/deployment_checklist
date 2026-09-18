const express = require('express');
const router = express.Router();
const { getUsers, createUser, updateUser, updateStatus } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/', getUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.patch('/:id/status', updateStatus);

module.exports = router;

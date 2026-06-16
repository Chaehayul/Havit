const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, changePassword, getAddresses, createAddress, updateAddress, deleteAddress, getUsers } = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/admin.middleware');

router.get('/me', authenticate, getProfile);
router.put('/me', authenticate, updateProfile);
router.put('/me/password', authenticate, changePassword);
router.get('/me/addresses', authenticate, getAddresses);
router.post('/me/addresses', authenticate, createAddress);
router.put('/me/addresses/:id', authenticate, updateAddress);
router.delete('/me/addresses/:id', authenticate, deleteAddress);

// 어드민
router.get('/', authenticate, requireAdmin, getUsers);

module.exports = router;

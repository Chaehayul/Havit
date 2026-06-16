const express = require('express');
const router = express.Router();
const {
  createOrder,
  verifyPayment,
  getOrders,
  getOrder,
  cancelOrder,
  getAllOrders,
  getAdminStats,
  updateOrderStatus,
} = require('../controllers/order.controller');
const { authenticate, optionalAuth } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/admin.middleware');

router.post('/', optionalAuth, createOrder);
router.post('/verify-payment', optionalAuth, verifyPayment);

router.get('/admin/stats', authenticate, requireAdmin, getAdminStats);
router.get('/', authenticate, requireAdmin, getAllOrders);
router.get('/my', authenticate, getOrders);
router.get('/:id', optionalAuth, getOrder);
router.post('/:id/cancel', authenticate, cancelOrder);
router.patch('/:id/status', authenticate, requireAdmin, updateOrderStatus);

module.exports = router;

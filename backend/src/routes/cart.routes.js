const express = require('express');
const router = express.Router();
const { getCart, addItem, updateItem, removeItem, clearCart, mergeCart } = require('../controllers/cart.controller');
const { optionalAuth, authenticate } = require('../middleware/auth.middleware');

router.get('/', optionalAuth, getCart);
router.post('/items', optionalAuth, addItem);
router.put('/items/:itemId', optionalAuth, updateItem);
router.delete('/items/:itemId', optionalAuth, removeItem);
router.delete('/', optionalAuth, clearCart);
router.post('/merge', authenticate, mergeCart);

module.exports = router;

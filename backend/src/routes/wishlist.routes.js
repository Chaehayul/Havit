const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { getWishlist, addToWishlist, removeFromWishlist, checkWishlist } = require('../controllers/wishlist.controller');

router.use(authenticate);

router.get('/', getWishlist);
router.post('/', addToWishlist);
router.get('/check/:productId', checkWishlist);
router.delete('/:productId', removeFromWishlist);

module.exports = router;

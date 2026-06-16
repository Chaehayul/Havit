const express = require('express');
const router = express.Router();
const { getProducts, getProduct, createProduct, updateProduct, deleteProduct, updateVariantStock } = require('../controllers/product.controller');
const { getReviews, createReview, updateReview, deleteReview } = require('../controllers/review.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/admin.middleware');

router.get('/', getProducts);
router.get('/:id', getProduct);
router.post('/', authenticate, requireAdmin, createProduct);
router.put('/:id', authenticate, requireAdmin, updateProduct);
router.delete('/:id', authenticate, requireAdmin, deleteProduct);
router.patch('/:id/variants/:variantId/stock', authenticate, requireAdmin, updateVariantStock);

// 리뷰
router.get('/:productId/reviews', getReviews);
router.post('/:productId/reviews', authenticate, createReview);
router.put('/:productId/reviews/:id', authenticate, updateReview);
router.delete('/:productId/reviews/:id', authenticate, deleteReview);

module.exports = router;

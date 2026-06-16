const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/auth.middleware');
const { subscribeRestock, unsubscribeRestock } = require('../controllers/restock.controller');

router.post('/', optionalAuth, subscribeRestock);
router.delete('/:productId', optionalAuth, unsubscribeRestock);

module.exports = router;

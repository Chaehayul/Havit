const express = require('express');
const router = express.Router();
const { upload, uploadImages, uploadSingle } = require('../controllers/upload.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/admin.middleware');

router.post('/images', authenticate, requireAdmin, upload.array('images', 10), uploadImages);
router.post('/image', authenticate, requireAdmin, upload.single('image'), uploadSingle);

module.exports = router;

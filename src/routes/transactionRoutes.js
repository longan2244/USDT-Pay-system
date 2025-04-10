// 交易路由
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyAdminToken } = require('../middlewares/auth');

// 手动触发转账检查
router.get('/check-transfers', verifyAdminToken, adminController.checkTransfers);

module.exports = router;
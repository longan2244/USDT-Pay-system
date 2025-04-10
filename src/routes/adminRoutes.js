// 管理员路由
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyAdminToken } = require('../middlewares/auth');

// 管理员登录
router.post('/login', adminController.login);

// 需要验证管理员权限的路由
// 获取指定地址的所有订单
router.get('/address-orders/:address', verifyAdminToken, adminController.getAddressOrders);

// 获取所有订单
router.get('/orders', verifyAdminToken, adminController.getAllOrders);

// 手动确认支付
router.post('/confirm-payment', verifyAdminToken, adminController.confirmPayment);

// 添加卡密
router.post('/add-card-key', verifyAdminToken, adminController.addCardKey);

// 获取所有卡密
router.get('/card-keys', verifyAdminToken, adminController.getAllCardKeys);

// 删除卡密
router.delete('/card-keys/:id', verifyAdminToken, adminController.deleteCardKey);



// 获取所有商品
router.get('/products', verifyAdminToken, adminController.getAllProducts);

// 添加新商品
router.post('/products', verifyAdminToken, adminController.createProduct);

// 修改商品信息
router.put('/products/:id', verifyAdminToken, adminController.updateProduct);

// 删除商品（软删除）
router.delete('/products/:id', verifyAdminToken, adminController.deleteProduct);

// 获取仪表盘数据
router.get('/dashboard', verifyAdminToken, adminController.getDashboardData);

// 获取系统设置
router.get('/settings', verifyAdminToken, adminController.getSettings);

// 更新系统设置
router.put('/settings', verifyAdminToken, adminController.updateSettings);

// 恢复上一次的系统设置
router.post('/settings/restore-previous', verifyAdminToken, adminController.restorePreviousSettings);

module.exports = router;

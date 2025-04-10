// API路由
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const productController = require('../controllers/productController');
const settingsController = require('../controllers/settingsController');

// 创建支付订单
router.post('/create-payment', orderController.createPayment);

// 查询订单状态
router.get('/check-payment/:deviceUuid/:orderId', orderController.checkPayment);

// 通过设备UUID查询所有订单
router.get('/orders/:deviceUuid', orderController.getOrdersByDevice);

// 通过联系方式查询所有订单
router.get('/orders-by-contact/:contactInfo', orderController.getOrdersByContact);

// 通过设备UUID查询所有卡密
router.get('/card-keys/:deviceUuid', orderController.getCardKeysByDevice);

// 通过联系方式查询所有卡密
router.get('/card-keys-by-contact/:contactInfo', orderController.getCardKeysByContact);

// 获取商品列表
router.get('/products', productController.getProducts);

// 获取商品详情
router.get('/products/:id', productController.getProductById);

// 获取公共设置
router.get('/settings', settingsController.getPublicSettings);

module.exports = router;

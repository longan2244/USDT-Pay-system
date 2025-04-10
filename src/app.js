// 主应用程序文件
const express = require('express');
const path = require('path');
const config = require('./config');
const apiRoutes = require('./routes/apiRoutes');
const adminRoutes = require('./routes/adminRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const { initDb } = require('./utils/db');
const orderModel = require('./models/order');
const productModel = require('./models/product');
const cardKeyModel = require('./models/cardKey');
const settingsController = require('./controllers/settingsController');


// 初始化数据库
initDb();

// 初始化数据模型
orderModel.initOrders();
productModel.initProducts();
cardKeyModel.initCardKeys();
// 加载设置模型
require('./models/settings');

// 检查关键设置
const hasCriticalSettings = settingsController.checkCriticalSettings();
if (!hasCriticalSettings) {
  console.warn('警告: 未配置钱包地址或API密钥，系统功能将受限');
  console.warn('请在管理员界面配置钱包地址和API密钥');
}

// 创建Express应用
const app = express();

// 中间件
app.use(express.json());

// 静态文件服务
// app.use("/v2", express.static(path.join(process.cwd(), 'web/userv2')));
app.use(express.static(path.join(process.cwd(), 'web/user/')));
app.use('/admin', express.static(path.join(process.cwd(), 'web/admin/')));

// 路由
app.use('/api', apiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/transactions', transactionRoutes);

// 定期保存数据（每5分钟）
setInterval(() => {
  orderModel.saveOrders();
  cardKeyModel.saveCardKeys();
  productModel.saveProducts();
  console.log('数据已自动保存到本地文件');
}, config.dataSave.interval);

module.exports = app;

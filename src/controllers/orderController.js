// 订单控制器
const productModel = require('../models/product');
const orderModel = require('../models/order');
const cardKeyModel = require('../models/cardKey');
const config = require('../config');
const settingsController = require('./settingsController');

/**
 * 检查用户是否有过多的待处理订单
 * @param {string} deviceUuid - 设备UUID
 * @return {boolean} - 是否有过多的待处理订单
 */
const hasTooManyPendingOrders = (deviceUuid) => {
  // 获取该设备的所有待处理订单
  const pendingOrders = orderModel.getOrdersByDevice(deviceUuid)
    .filter(order => order.status === 'pending' || order.status === 'processing');

  // 检查是否超过最大允许的待处理订单数
  return pendingOrders.length >= config.order.maxPendingOrdersPerDevice;
};

/**
 * 检查用户是否在短时间内创建了多个订单
 * @param {string} deviceUuid - 设备UUID
 * @return {boolean} - 是否在短时间内创建了多个订单
 */
const isCreatingOrdersTooFrequently = (deviceUuid) => {
  // 获取该设备的所有订单
  const recentOrders = orderModel.getOrdersByDevice(deviceUuid)
    .filter(order => {
      // 检查是否在限制时间内创建的订单
      const orderAge = Date.now() - order.createdAt;
      return orderAge < config.order.orderCreationCooldown;
    });

  // 检查是否超过短时间内允许创建的订单数
  return recentOrders.length >= config.order.maxOrdersInCooldownPeriod;
};

/**
 * 创建支付订单
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const createPayment = async (req, res) => {
  try {
    // 检查关键设置是否已配置
    if (!settingsController.checkCriticalSettings()) {
      return res.status(400).json({
        success: false,
        message: 'Missing critical settings',
        details: '系统未配置钱包地址或API密钥，请联系管理员'
      });
    }

    const { deviceUuid, productId, items, contactInfo } = req.body;

    if (!deviceUuid) {
      return res.status(400).json({ success: false, message: '缺少必要参数' });
    }

    if (!contactInfo) {
      return res.status(400).json({ success: false, message: '请提供联系方式以便查询订单' });
    }

    // 检查用户是否有过多的待处理订单
    if (hasTooManyPendingOrders(deviceUuid)) {
      return res.status(400).json({
        success: false,
        message: `您有太多未完成的订单请你${config.order.orderCreationCooldown / 60000}分钟后再试`,
        retryable: false
      });
    }

    // 检查用户是否在短时间内创建了多个订单
    if (isCreatingOrdersTooFrequently(deviceUuid)) {
      return res.status(400).json({
        success: false,
        message: '创建订单过于频繁，请稍后再试',
        retryable: false
      });
    }

    // 支持两种模式：单商品模式和多商品模式
    if (items && Array.isArray(items) && items.length > 0) {
      // 多商品模式
      const orderItems = [];
      let baseAmount = 0;

      // 验证所有商品
      for (const item of items) {
        const product = productModel.getProduct(item.productId);
        if (!product) {
          return res.status(400).json({ success: false, message: `商品ID ${item.productId} 不存在` });
        }

        // 验证库存
        const availableCardKeys = cardKeyModel.getAvailableCardKeysByProduct(item.productId);
        if (availableCardKeys.length < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `商品 ${product.name} 库存不足，当前库存: ${availableCardKeys.length}`
          });
        }

        // 计算基础金额
        baseAmount += product.price * item.quantity;

        // 添加到订单项
        orderItems.push({
          productId: parseInt(item.productId),
          quantity: item.quantity,
          productName: product.name,
          price: product.price
        });
      }

      // 创建多商品订单
      const order = orderModel.createMultiItemOrder(deviceUuid, orderItems, contactInfo, baseAmount);

      res.json({
        success: true,
        data: {
          orderId: order.id,
          paymentAddress: order.walletAddress,
          amount: order.amount,
          status: order.status,
          expiresAt: order.expiresAt,
          contactInfo
        }
      });
    } else if (productId) {
      // 单商品模式（兼容旧版API）
      const product = productModel.getProduct(productId);
      if (!product) {
        return res.status(400).json({ success: false, message: '商品不存在' });
      }

      // 创建单商品订单
      const order = orderModel.createSingleItemOrder(
        deviceUuid,
        productId,
        product.name,
        product.price,
        contactInfo
      );

      res.json({
        success: true,
        data: {
          orderId: order.id,
          contactInfo,
          paymentAddress: order.walletAddress,
          amount: order.amount,
          productName: product.name,
          status: order.status,
          expiresAt: order.expiresAt
        }
      });
    } else {
      return res.status(400).json({ success: false, message: '缺少商品信息' });
    }
  } catch (error) {
    console.error('创建支付订单失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

/**
 * 查询订单状态
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const checkPayment = async (req, res) => {
  try {
    const { deviceUuid, orderId } = req.params;

    const order = orderModel.getOrder(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: '订单不存在' });
    }

    if (order.deviceUuid !== deviceUuid) {
      return res.status(403).json({ success: false, message: '设备UUID不匹配' });
    }

    // 检查订单是否已过期
    if (order.status === 'pending' && order.expiresAt && order.expiresAt < Date.now()) {
      // 更新订单状态为expired
      orderModel.updateOrderStatus(order.id, 'expired', {
        updatedAt: Date.now(),
        expiredAt: Date.now()
      });
      // 保存订单数据
      orderModel.saveOrders();
    }

    // 构建响应数据
    const responseData = {
      orderId,
      status: order.status,
      amount: order.amount,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    };

    // 如果有待确认交易哈希，添加到响应中
    if (order.pendingTxHash) {
      responseData.pendingTxHash = order.pendingTxHash;
    }

    // 如果是多商品订单
    if (order.items) {
      responseData.items = order.items;

      // 如果订单已完成，添加卡密信息
      if (order.status === 'completed' && order.cardKeys) {
        responseData.cardKeys = order.cardKeys;
      }
    } else {
      // 单商品订单
      responseData.productName = order.productName;

      // 如果订单已完成，添加卡密信息
      if (order.status === 'completed' && order.cardKey) {
        responseData.cardKey = order.cardKey;
      }
    }

    res.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('查询订单状态失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

/**
 * 获取设备的所有订单
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const getOrdersByDevice = (req, res) => {
  try {
    const { deviceUuid } = req.params;

    const deviceOrders = orderModel.getOrdersByDevice(deviceUuid);

    res.json({
      success: true,
      data: deviceOrders
    });
  } catch (error) {
    console.error('查询设备订单失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

/**
 * 通过联系方式查询所有订单
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const getOrdersByContact = (req, res) => {
  try {
    const { contactInfo } = req.params;

    const contactOrders = orderModel.getOrdersByContact(contactInfo);

    res.json({
      success: true,
      data: contactOrders
    });
  } catch (error) {
    console.error('查询联系方式订单失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

/**
 * 获取设备的所有卡密
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const getCardKeysByDevice = (req, res) => {
  try {
    const { deviceUuid } = req.params;

    const deviceCardKeys = cardKeyModel.getCardKeysByDevice(deviceUuid);

    res.json({
      success: true,
      data: deviceCardKeys
    });
  } catch (error) {
    console.error('查询设备卡密失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

/**
 * 通过联系方式查询所有卡密
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const getCardKeysByContact = (req, res) => {
  try {
    const { contactInfo } = req.params;

    // 首先找到该联系方式的所有订单
    const contactOrders = orderModel.getOrdersByContact(contactInfo)
      .filter(order => order.status === 'completed');

    // 收集所有订单ID
    const orderIds = contactOrders.map(order => order.id);

    // 查找这些订单关联的卡密
    const contactCardKeys = cardKeyModel.getCardKeysByOrders(orderIds);

    res.json({
      success: true,
      data: contactCardKeys
    });
  } catch (error) {
    console.error('查询联系方式卡密失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

module.exports = {
  createPayment,
  checkPayment,
  getOrdersByDevice,
  getOrdersByContact,
  getCardKeysByDevice,
  getCardKeysByContact
};

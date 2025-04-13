const axios = require('axios');
// 管理员控制器
const jwt = require('jsonwebtoken');
const config = require('../config');
const productModel = require('../models/product');
const cardKeyModel = require('../models/cardKey');
const orderModel = require('../models/order');
const settingsModel = require('../models/settings');
const transactionService = require('../services/TransactionService');

/**
 * 管理员登录
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const login = (req, res) => {
  const { adminKey } = req.body;

  if (adminKey !== config.admin.key) {
    return res.status(403).json({ success: false, message: '管理员密钥错误' });
  }

  // 生成JWT token
  const token = jwt.sign({ role: 'admin' }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });

  res.json({
    success: true,
    data: { token }
  });
};

/**
 * 获取地址的所有订单
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const getAddressOrders = (req, res) => {
  try {
    const { address } = req.params;

    // 查找该地址的所有订单
    const addressOrders = orderModel.getOrdersByAddress(address);

    res.json({
      success: true,
      data: addressOrders
    });
  } catch (error) {
    console.error('获取地址订单失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

/**
 * 获取所有订单
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const getAllOrders = (req, res) => {
  try {
    // 获取所有订单
    let allOrders = orderModel.getAllOrders();

    // 过滤条件
    const { status, productId, startDate, endDate, search } = req.query;

    // 按状态过滤
    if (status && status !== 'all') {
      allOrders = allOrders.filter(order => order.status === status);
    }

    // 按商品ID过滤
    if (productId) {
      allOrders = allOrders.filter(order =>
        order.productId === parseInt(productId) ||
        (order.items && order.items.some(item => item.productId === parseInt(productId)))
      );
    }

    // 按日期范围过滤
    if (startDate) {
      const startTimestamp = new Date(startDate).getTime();
      allOrders = allOrders.filter(order => order.createdAt >= startTimestamp);
    }

    if (endDate) {
      const endTimestamp = new Date(endDate).getTime() + (24 * 60 * 60 * 1000 - 1); // 结束日期的最后一毫秒
      allOrders = allOrders.filter(order => order.createdAt <= endTimestamp);
    }

    // 按搜索关键词过滤（订单ID、商品名称、联系方式、付款地址）
    // if (search) {
    //   const searchLower = search.toLowerCase();
    //   allOrders = allOrders.filter(order =>
    //     (order.id && order.id.toLowerCase().includes(searchLower)) ||
    //     (order.productName && order.productName.toLowerCase().includes(searchLower)) ||
    //     (order.contactInfo && order.contactInfo.toLowerCase().includes(searchLower)) ||
    //     (order.paymentInfo && order.paymentInfo.from && order.paymentInfo.from.toLowerCase().includes(searchLower))
    //   );
    // }
    if (search) {  // 检查是否有搜索条件

      // 将搜索词转换为小写以便不区分大小写比较
      const searchLower = search.toLowerCase();

      // 过滤订单数组
      allOrders = allOrders.filter(function (order) {
        // 检查订单ID是否匹配
        const idMatch = order.id && order.id.toLowerCase().includes(searchLower);

        // 检查产品名称是否匹配
        const productNameMatch = order.productName && order.productName.toLowerCase().includes(searchLower);

        // 检查联系信息是否匹配
        const contactInfoMatch = order.contactInfo && order.contactInfo.toLowerCase().includes(searchLower);
        // console.log("from",order.paymentInfo.from.toLowerCase());
        // console.log("searchLower", searchLower);

        // 检查支付信息中的from字段是否匹配
        const paymentFromMatch = order.paymentInfo &&
          order.paymentInfo.from &&
          order.paymentInfo.from.toLowerCase().includes(searchLower);


        // 如果任一条件匹配，则保留该订单
        return idMatch || productNameMatch || contactInfoMatch || paymentFromMatch;
      });
    }

    // 分页
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const totalItems = allOrders.length;
    const totalPages = Math.ceil(totalItems / pageSize);

    // 排序（默认按创建时间降序）
    allOrders.sort((a, b) => b.createdAt - a.createdAt);

    // 分页数据
    const paginatedOrders = allOrders.slice((page - 1) * pageSize, page * pageSize);

    res.json({
      success: true,
      data: paginatedOrders,
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages
      }
    });
  } catch (error) {
    console.error('获取所有订单失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

/**
 * 手动确认支付
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const confirmPayment = async (req, res) => {
  try {
    const { orderId, txHash } = req.body;

    if (!orderId || !txHash) {
      return res.status(400).json({ success: false, message: '缺少必要参数' });
    }

    const order = orderModel.getOrder(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: '订单不存在' });
    }

    // 检查订单是否已经完成
    if (order.status === 'completed') {
      return res.status(400).json({ success: false, message: '订单已经完成' });
    }

    console.warn(`管理员手动确认支付，订单ID: ${orderId}, 交易哈希: ${txHash}`);

    // 创建转账对象
    const transfer = {
      txHash,
      from: 'admin_confirmed',
      to: config.tron.walletAddress,
      amount: parseFloat(order.amount),
      timestamp: Date.now()
    };

    // 处理转账
    transactionService.processTransfer(transfer);

    // 获取更新后的订单
    const updatedOrder = orderModel.getOrder(orderId);

    // 构建响应数据
    const responseData = {
      orderId,
      status: updatedOrder.status,
      txHash
    };

    // 如果是多商品订单
    if (updatedOrder.cardKeys) {
      responseData.cardKeys = updatedOrder.cardKeys;
    } else if (updatedOrder.cardKey) {
      // 单商品订单
      responseData.cardKey = updatedOrder.cardKey;
      responseData.productName = updatedOrder.productName;
    }

    res.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('确认支付失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

/**
 * 检查转账
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const checkTransfers = async (req, res) => {
  try {
    const { hours } = req.query;
    // 手动触发转账检查
    const result = await transactionService.manualCheckTransfers(parseInt(hours) || 1);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('手动检查转账失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

/**
 * 添加卡密
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const addCardKey = (req, res) => {
  try {
    const { keys, productId, delimiter, removeDuplicates } = req.body;

    if (!productId || !keys) {
      return res.status(400).json({ success: false, message: '缺少必要参数' });
    }

    // 验证商品是否存在
    const product = productModel.getProduct(productId, true);
    if (!product) {
      return res.status(400).json({ success: false, message: '商品不存在' });
    }

    // 根据分隔符或换行符分割卡密
    let keyArray = [];
    if (delimiter && delimiter.trim()) {
      // 使用自定义分隔符
      keyArray = keys.split(delimiter);
    } else {
      // 使用换行符
      keyArray = keys.split('\n');
    }

    // 过滤空字符串并去除前后空格
    keyArray = keyArray.map(key => key.trim()).filter(key => key);

    // 如果需要去重
    if (removeDuplicates) {
      keyArray = [...new Set(keyArray)];
    }

    // 批量创建卡密
    const createdCardKeys = [];
    for (const key of keyArray) {
      const cardKey = cardKeyModel.createCardKey(productId, product.name, key);
      createdCardKeys.push({
        cardId: cardKey.id,
        key: cardKey.key,
        productName: product.name
      });
    }

    res.json({
      success: true,
      data: {
        cardKeys: createdCardKeys,
        count: createdCardKeys.length
      }
    });
  } catch (error) {
    console.error('添加卡密失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

/**
 * 获取所有卡密
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const getAllCardKeys = (req, res) => {
  try {
    let allCardKeys = cardKeyModel.getAllCardKeys();

    // 过滤条件
    const { status, productId, search } = req.query;

    // 按状态过滤
    if (status) {
      if (status === 'available') {
        allCardKeys = allCardKeys.filter(card => !card.orderId);
      } else if (status === 'used') {
        allCardKeys = allCardKeys.filter(card => card.orderId);
      }
    }

    // 按商品ID过滤
    if (productId) {
      allCardKeys = allCardKeys.filter(card => card.productId === parseInt(productId));
    }

    // 按搜索关键词过滤（卡密、商品名称）
    if (search) {
      const searchLower = search.toLowerCase();
      allCardKeys = allCardKeys.filter(card =>
        (card.key && card.key.toLowerCase().includes(searchLower)) ||
        (card.productName && card.productName.toLowerCase().includes(searchLower))
      );
    }

    // 分页
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const totalItems = allCardKeys.length;
    const totalPages = Math.ceil(totalItems / pageSize);

    // 排序（默认按创建时间降序）
    allCardKeys.sort((a, b) => b.createdAt - a.createdAt);

    // 分页数据
    const paginatedCardKeys = allCardKeys.slice((page - 1) * pageSize, page * pageSize);

    res.json({
      success: true,
      data: paginatedCardKeys,
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages
      }
    });
  } catch (error) {
    console.error('获取卡密列表失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

/**
 * 删除单个卡密
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const deleteCardKey = (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ success: false, message: '缺少卡密ID' });
    }

    // 删除卡密
    const deletedCard = cardKeyModel.deleteCardKey(id);

    if (!deletedCard) {
      return res.status(404).json({ success: false, message: '卡密不存在' });
    }

    res.json({
      success: true,
      data: deletedCard,
      message: '卡密删除成功'
    });
  } catch (error) {
    console.error('删除卡密失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

/**
 * 批量删除卡密
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const deleteMultipleCardKeys = (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: '缺少有效的卡密ID数组' });
    }

    // 批量删除卡密
    const result = cardKeyModel.deleteMultipleCardKeys(ids);

    res.json({
      success: true,
      data: {
        success: result.success,
        failed: result.failed,
        total: ids.length,
        deletedCards: result.deletedCards
      },
      message: `成功删除 ${result.success} 个卡密，失败 ${result.failed} 个`
    });
  } catch (error) {
    console.error('批量删除卡密失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

/**
 * 获取所有商品
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const getAllProducts = (req, res) => {
  try {
    // 获取商品列表
    let products = productModel.getAllProducts(req.query.status);

    // 更新商品的可用卡密数量
    const cardKeys = cardKeyModel.getAllCardKeys();
    productModel.updateProductsAvailableCount(cardKeys);

    // 过滤条件
    const { minPrice, maxPrice, search } = req.query;

    // 按价格范围过滤
    if (minPrice) {
      products = products.filter(product => product.price >= parseFloat(minPrice));
    }

    if (maxPrice) {
      products = products.filter(product => product.price <= parseFloat(maxPrice));
    }

    // 按搜索关键词过滤（商品名称、描述）
    if (search) {
      const searchLower = search.toLowerCase();
      products = products.filter(product =>
        (product.name && product.name.toLowerCase().includes(searchLower)) ||
        (product.description && product.description.toLowerCase().includes(searchLower))
      );
    }

    // 分页
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const totalItems = products.length;
    const totalPages = Math.ceil(totalItems / pageSize);

    // 排序（默认按ID升序）
    products.sort((a, b) => b.id - a.id);

    // 分页数据
    const paginatedProducts = products.slice((page - 1) * pageSize, page * pageSize);
    // 反转当前页的数据顺序
    // paginatedProducts.reverse();
    res.json({
      success: true,
      data: paginatedProducts,
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

/**
 * 创建商品
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const createProduct = (req, res) => {
  try {
    const { name, price, description } = req.body;

    // 验证必要参数
    if (!name || !price) {
      return res.status(400).json({ success: false, message: '缺少必要参数' });
    }

    // 创建商品
    const newProduct = productModel.createProduct({
      name,
      price,
      description
    });

    res.json({
      success: true,
      data: newProduct
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

/**
 * 更新商品
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const updateProduct = (req, res) => {
  try {
    const { name, price, description, status } = req.body;
    const productId = parseInt(req.params.id);

    // 更新商品
    const result = productModel.updateProduct(productId, {
      name,
      price,
      description,
      status
    });

    if (!result) {
      return res.status(404).json({ success: false, message: '商品不存在' });
    }

    // 如果商品名称发生变化，更新所有相关卡密的商品名称
    if (name && name !== result.oldName) {
      cardKeyModel.updateCardKeysProductName(productId, name);
    }

    res.json({
      success: true,
      data: result.product
    });
  } catch (error) {
    console.error('修改商品信息失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

/**
 * 删除商品
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const deleteProduct = (req, res) => {
  try {
    const productId = parseInt(req.params.id);

    // 删除商品
    const product = productModel.deleteProduct(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: '商品不存在' });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

/**
 * 获取仪表盘数据
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const getDashboardData = (req, res) => {
  try {
    // 获取所有订单
    const allOrders = orderModel.getAllOrders();

    // 获取所有商品
    const allProducts = productModel.getAllProducts();

    // 获取所有卡密
    const allCardKeys = cardKeyModel.getAllCardKeys();

    // 计算统计数据
    const totalOrders = allOrders.length;
    const completedOrders = allOrders.filter(order => order.status === 'completed').length;
    const pendingOrders = allOrders.filter(order => order.status === 'pending').length;
    const processingOrders = allOrders.filter(order => order.status === 'processing').length;

    // 计算总收入
    const totalRevenue = allOrders
      .filter(order => order.status === 'completed')
      .reduce((sum, order) => sum + parseFloat(order.amount), 0);

    // 计算商品销售情况
    const productSales = allProducts.map(product => {
      const soldCount = product.soldCount || 0;
      const availableCount = allCardKeys.filter(
        card => card.productId === product.id && !card.deviceUuid && !card.orderId
      ).length;

      return {
        id: product.id,
        name: product.name,
        soldCount,
        availableCount,
        status: product.status
      };
    });

    // 计算最近7天的销售趋势
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const salesTrend = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now - i * oneDay);
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

      const dayStart = new Date(date.setHours(0, 0, 0, 0)).getTime();
      const dayEnd = new Date(date.setHours(23, 59, 59, 999)).getTime();

      const dayOrders = allOrders.filter(
        order => order.status === 'completed' &&
          order.updatedAt >= dayStart &&
          order.updatedAt <= dayEnd
      );

      const dayRevenue = dayOrders.reduce((sum, order) => sum + parseFloat(order.amount), 0);
      const dayCount = dayOrders.length;

      salesTrend.push({
        date: dateStr,
        revenue: parseFloat(dayRevenue.toFixed(2)),
        count: dayCount
      });
    }

    // 最近10笔订单
    const recentOrders = allOrders
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 10)
      .map(order => ({
        id: order.id,
        amount: order.amount,
        status: order.status,
        createdAt: order.createdAt,
        productName: order.productName || (order.items ? order.items.map(item => item.productName).join(', ') : '多商品')
      }));

    res.json({
      success: true,
      data: {
        summary: {
          totalOrders,
          completedOrders,
          pendingOrders,
          processingOrders,
          totalRevenue: parseFloat(totalRevenue.toFixed(2))
        },
        productSales,
        salesTrend,
        recentOrders
      }
    });
  } catch (error) {
    console.error('获取仪表盘数据失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

/**
 * 获取系统设置
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const getSettings = (req, res) => {
  try {
    const settings = settingsModel.getSettings();

    // 移除敏感信息
    const safeSettings = { ...settings };

    res.json({
      success: true,
      data: safeSettings
    });
  } catch (error) {
    console.error('获取系统设置失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

/**
 * 更新系统设置
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const updateSettings = async (req, res) => {
  try {
    const {
      // 服务器配置
      port,
      jwtSecret,

      // 管理员配置
      adminKey,

      // Tron配置
      walletAddress,
      fullHost,
      privateKey,
      contractAddress,
      apiKey,

      // 订单配置
      pollingTime,
      expirationTime,
      requiredConfirmations,
      checkTimeWindow,
      randomDecimalMin,
      randomDecimalMax,
      maxPendingOrdersPerDevice,
      orderCreationCooldown,
      maxOrdersInCooldownPeriod,

      // 数据保存配置
      dataSaveInterval
    } = req.body;

    // 验证是否有任何设置项
    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({ success: false, message: '没有提供任何设置项' });
    }

    // 如果提供了API密钥和主机地址，检查API密钥是否正确
    if (apiKey && fullHost) {
      try {
        await axios.get(
          `${fullHost}/wallet/gettransactionbyid`,
          {
            headers: { 'TRON-PRO-API-KEY': apiKey }
          }
        );
      } catch (error) {
        if (error.response && error.response.status === 401) {
          return res.status(400).json({ success: false, message: 'API 密钥无效' });
        }
      }
    }

    // 更新设置
    const updatedSettings = settingsModel.updateSettings({
      // 服务器配置
      port,
      jwtSecret,

      // 管理员配置
      adminKey,

      // Tron配置
      walletAddress,
      fullHost,
      privateKey,
      contractAddress,
      apiKey,

      // 订单配置
      pollingTime,
      expirationTime,
      requiredConfirmations,
      checkTimeWindow,
      randomDecimalMin,
      randomDecimalMax,
      maxPendingOrdersPerDevice,
      orderCreationCooldown,
      maxOrdersInCooldownPeriod,

      // 数据保存配置
      dataSaveInterval
    });

    // 移除敏感信息
    const safeSettings = { ...updatedSettings };

    res.json({
      success: true,
      data: safeSettings
    });
  } catch (error) {
    console.error('更新系统设置失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

/**
 * 恢复上一次的系统设置
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const restorePreviousSettings = (req, res) => {
  try {
    // 恢复上一次的设置
    const restoredSettings = settingsModel.restorePreviousSettings();

    // 移除敏感信息
    const safeSettings = { ...restoredSettings };

    res.json({
      success: true,
      data: safeSettings
    });
  } catch (error) {
    console.error('恢复上一次设置失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

module.exports = {
  login,
  getAddressOrders,
  getAllOrders,
  confirmPayment,
  checkTransfers,
  addCardKey,
  getAllCardKeys,
  deleteCardKey,
  deleteMultipleCardKeys,
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getDashboardData,
  getSettings,
  updateSettings,
  restorePreviousSettings
};

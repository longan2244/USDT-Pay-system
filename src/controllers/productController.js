// 商品控制器
const productModel = require('../models/product');
const cardKeyModel = require('../models/cardKey');

/**
 * 获取商品列表
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const getProducts = (req, res) => {
  try {
    const { status, adminKey } = req.query;
    let products;

    // 如果不是管理员，只返回正常状态的商品
    if (adminKey !== 'admin123') {
      products = productModel.getAllProducts('active');
    } else if (status) {
      // 管理员可以根据状态筛选
      products = productModel.getAllProducts(status);
    } else {
      products = productModel.getAllProducts();
    }

    // 更新商品的可用卡密数量
    const cardKeys = cardKeyModel.getAllCardKeys();
    productModel.updateProductsAvailableCount(cardKeys);

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

/**
 * 获取商品详情
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const getProductById = (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const product = productModel.getProduct(productId);

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

module.exports = {
  getProducts,
  getProductById
};
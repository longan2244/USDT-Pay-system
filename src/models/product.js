// 商品模型
const config = require('../config');
const { loadData, saveData } = require('../utils/db');

// 加载商品数据
let products = [];

// 初始化商品数据
const initProducts = () => {
  products = loadData(config.db.files.products, []);
};

// 保存商品数据
const saveProducts = () => {
  saveData(config.db.files.products, products);
};

/**
 * 获取所有商品
 * @param {string} status - 可选的状态过滤
 * @return {Array} - 商品数组
 */
const getAllProducts = (status) => {
  if (status) {
    return products.filter(p => p.status === status);
  }
  return [...products];
};

/**
 * 获取商品
 * @param {number} productId - 商品ID
 * @param {boolean} includeDeleted - 是否包含已删除商品
 * @return {Object|null} - 商品对象或null
 */
const getProduct = (productId, includeDeleted = false) => {
  const id = parseInt(productId);
  if (includeDeleted) {
    return products.find(p => p.id === id) || null;
  }
  return products.find(p => p.id === id && p.status === 'active') || null;
};

/**
 * 创建商品
 * @param {Object} productData - 商品数据
 * @return {Object} - 创建的商品
 */
const createProduct = (productData) => {
  // 生成新商品ID
  const maxId = Math.max(...products.map(p => p.id), 0);
  const newProduct = {
    id: maxId + 1,
    name: productData.name,
    price: parseFloat(productData.price),
    description: productData.description || '',
    status: 'active',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    soldCount: 0,
    availableCount: 0
  };

  products.push(newProduct);
  saveProducts();

  return newProduct;
};

/**
 * 更新商品
 * @param {number} productId - 商品ID
 * @param {Object} productData - 商品数据
 * @return {Object|null} - 更新后的商品或null
 */
const updateProduct = (productId, productData) => {
  const id = parseInt(productId);
  const product = products.find(p => p.id === id);
  if (!product) return null;

  // 记录旧名称，用于检查是否需要更新卡密记录
  const oldName = product.name;

  // 更新商品信息
  if (productData.name) product.name = productData.name;
  if (productData.price) product.price = parseFloat(productData.price);
  if (productData.description) product.description = productData.description;
  if (productData.status && ['active', 'deleted'].includes(productData.status)) {
    product.status = productData.status;
  }
  product.updatedAt = Date.now();

  saveProducts();
  return { product, oldName };
};

/**
 * 删除商品（软删除）
 * @param {number} productId - 商品ID
 * @return {Object|null} - 删除的商品或null
 */
const deleteProduct = (productId) => {
  const id = parseInt(productId);
  const product = products.find(p => p.id === id);
  if (!product) return null;

  // 软删除商品
  product.status = 'deleted';
  product.updatedAt = Date.now();

  saveProducts();
  return product;
};

/**
 * 更新商品可用卡密数量
 * @param {Array} cardKeys - 卡密数组
 */
const updateProductsAvailableCount = (cardKeys) => {
  products.forEach(product => {
    product.availableCount = cardKeys.filter(
      card => card.productId === product.id && !card.deviceUuid && !card.orderId
    ).length;
  });
};

module.exports = {
  initProducts,
  saveProducts,
  getAllProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductsAvailableCount
};
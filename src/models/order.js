// 订单模型
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const { loadData, saveData } = require('../utils/db');
const { generateRandomDecimal } = require('../utils/helpers');

// 加载订单数据
let orders = {};

// 初始化订单数据
const initOrders = () => {
  orders = loadData(config.db.files.orders, {});
};

// 保存订单数据
const saveOrders = () => {
  saveData(config.db.files.orders, orders);
};

/**
 * 创建多商品订单
 * @param {string} deviceUuid - 设备UUID
 * @param {Array} items - 订单项
 * @param {string} contactInfo - 联系方式
 * @param {number} baseAmount - 基础金额
 * @return {Object} - 创建的订单
 */
const createMultiItemOrder = (deviceUuid, items, contactInfo, baseAmount) => {
  // 生成唯一的支付金额（添加随机小数）
  const randomDecimal = generateRandomDecimal(
    config.order.randomDecimalMin,
    config.order.randomDecimalMax
  );
  const uniqueAmount = (baseAmount + randomDecimal).toFixed(2);

  // 生成唯一订单ID
  const orderId = uuidv4();
  const timestamp = Date.now();

  // 创建订单对象
  const order = {
    id: orderId,
    amount: uniqueAmount,
    baseAmount,
    deviceUuid,
    items,
    status: 'pending',
    walletAddress: config.tron.walletAddress,
    createdAt: timestamp,
    updatedAt: timestamp,
    contactInfo,
    expiresAt: timestamp + config.order.expirationTime
  };

  // 存储订单信息
  orders[orderId] = order;
  saveOrders();

  return order;
};

/**
 * 创建单商品订单
 * @param {string} deviceUuid - 设备UUID
 * @param {number} productId - 商品ID
 * @param {string} productName - 商品名称
 * @param {number} productPrice - 商品价格
 * @param {string} contactInfo - 联系方式
 * @return {Object} - 创建的订单
 */
const createSingleItemOrder = (deviceUuid, productId, productName, productPrice, contactInfo) => {
  // 生成唯一的支付金额（添加随机小数）
  const randomDecimal = generateRandomDecimal(
    config.order.randomDecimalMin,
    config.order.randomDecimalMax
  );
  const uniqueAmount = (productPrice + randomDecimal).toFixed(2);

  // 生成唯一订单ID
  const orderId = uuidv4();
  const timestamp = Date.now();

  // 创建订单对象
  const order = {
    id: orderId,
    amount: uniqueAmount,
    baseAmount: productPrice,
    deviceUuid,
    productId: parseInt(productId),
    productName,
    status: 'pending',
    walletAddress: config.tron.walletAddress,
    createdAt: timestamp,
    updatedAt: timestamp,
    contactInfo,
    expiresAt: timestamp + config.order.expirationTime
  };

  // 存储订单信息
  orders[orderId] = order;
  saveOrders();

  return order;
};

/**
 * 获取订单
 * @param {string} orderId - 订单ID
 * @return {Object|null} - 订单对象或null
 */
const getOrder = (orderId) => {
  return orders[orderId] || null;
};

/**
 * 更新订单状态
 * @param {string} orderId - 订单ID
 * @param {string} status - 新状态
 * @param {Object} additionalData - 额外数据
 * @return {Object|null} - 更新后的订单或null
 */
const updateOrderStatus = (orderId, status, additionalData = {}) => {
  const order = orders[orderId];
  if (!order) return null;

  order.status = status;
  order.updatedAt = Date.now();

  // 合并额外数据
  Object.assign(order, additionalData);

  saveOrders();
  return order;
};

/**
 * 获取设备的所有订单
 * @param {string} deviceUuid - 设备UUID
 * @return {Array} - 订单数组
 */
const getOrdersByDevice = (deviceUuid) => {
  return Object.values(orders).filter(order => order.deviceUuid === deviceUuid);
};

/**
 * 获取联系方式的所有订单
 * @param {string} contactInfo - 联系方式
 * @return {Array} - 订单数组
 */
const getOrdersByContact = (contactInfo) => {
  return Object.values(orders).filter(order => order.contactInfo === contactInfo);
};

/**
 * 获取地址的所有订单
 * @param {string} address - 钱包地址
 * @return {Array} - 订单数组
 */
const getOrdersByAddress = (address) => {
  return Object.values(orders).filter(order =>
    order.paymentInfo && order.paymentInfo.from.toLowerCase() === address.toLowerCase()
  );
};

/**
 * 获取所有待处理订单
 * @return {Array} - 待处理订单数组
 */
const getPendingOrders = () => {
  return Object.values(orders).filter(order =>
    order.status === 'pending' || order.status === 'processing'
  );
};

/**
 * 获取所有过期订单
 * @return {Array} - 过期订单数组
 */
const getExpiredOrders = () => {
  return Object.values(orders).filter(order =>
    order.status === 'expired'
  );
};

module.exports = {
  initOrders,
  saveOrders,
  createMultiItemOrder,
  createSingleItemOrder,
  getOrder,
  updateOrderStatus,
  getOrdersByDevice,
  getOrdersByContact,
  getOrdersByAddress,
  getPendingOrders,
  getExpiredOrders,
  getAllOrders: () => Object.values(orders)
};

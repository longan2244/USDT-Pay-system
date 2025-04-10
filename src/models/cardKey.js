// 卡密模型
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const { loadData, saveData } = require('../utils/db');
const { generateCardKey } = require('../utils/helpers');

// 加载卡密数据
let cardKeys = {};

// 初始化卡密数据
const initCardKeys = () => {
  cardKeys = loadData(config.db.files.cardKeys, {});
};

// 保存卡密数据
const saveCardKeys = () => {
  saveData(config.db.files.cardKeys, cardKeys);
};

/**
 * 创建卡密
 * @param {number} productId - 商品ID
 * @param {string} productName - 商品名称
 * @param {string} key - 可选的卡密值，如果不提供则自动生成
 * @return {Object} - 创建的卡密
 */
const createCardKey = (productId, productName, key = null) => {
  // 如果没有提供卡密，则生成一个
  const cardKey = key || generateCardKey(productId);

  // 存储卡密
  const cardId = uuidv4();
  const newCardKey = {
    id: cardId,
    key: cardKey,
    productId: parseInt(productId),
    productName,
    deviceUuid: null,
    orderId: null,
    createdAt: Date.now()
  };

  cardKeys[cardId] = newCardKey;
  saveCardKeys();

  return newCardKey;
};

/**
 * 获取所有卡密
 * @return {Array} - 卡密数组
 */
const getAllCardKeys = () => {
  return Object.values(cardKeys);
};

/**
 * 获取商品的可用卡密
 * @param {number} productId - 商品ID
 * @return {Array} - 可用卡密数组
 */
const getAvailableCardKeysByProduct = (productId) => {
  return Object.values(cardKeys).filter(
    card => card.productId === parseInt(productId) && !card.deviceUuid && !card.orderId
  );
};

/**
 * 获取设备的所有卡密
 * @param {string} deviceUuid - 设备UUID
 * @return {Array} - 卡密数组
 */
const getCardKeysByDevice = (deviceUuid) => {
  return Object.values(cardKeys).filter(card => card.deviceUuid === deviceUuid);
};

/**
 * 获取订单的所有卡密
 * @param {Array} orderIds - 订单ID数组
 * @return {Array} - 卡密数组
 */
const getCardKeysByOrders = (orderIds) => {
  return Object.values(cardKeys).filter(card => orderIds.includes(card.orderId));
};

/**
 * 分配卡密给订单
 * @param {number} productId - 商品ID
 * @param {string} deviceUuid - 设备UUID
 * @param {string} orderId - 订单ID
 * @return {Object|null} - 分配的卡密或null
 */
const assignCardKeyToOrder = (productId, deviceUuid, orderId) => {
  // 查找可用的卡密
  const availableCard = Object.values(cardKeys).find(
    card => card.productId === parseInt(productId) && !card.deviceUuid && !card.orderId
  );

  if (!availableCard) return null;

  // 更新卡密信息
  availableCard.deviceUuid = deviceUuid;
  availableCard.orderId = orderId;
  availableCard.usedAt = Date.now();

  saveCardKeys();
  return availableCard;
};

/**
 * 更新卡密商品名称
 * @param {number} productId - 商品ID
 * @param {string} newProductName - 新商品名称
 */
const updateCardKeysProductName = (productId, newProductName) => {
  Object.values(cardKeys).forEach(card => {
    if (card.productId === parseInt(productId)) {
      card.productName = newProductName;
    }
  });
  saveCardKeys();
};

/**
 * 删除单个卡密
 * @param {string} cardId - 卡密ID
 * @return {Object|null} - 被删除的卡密或null
 */
const deleteCardKey = (cardId) => {
  if (!cardKeys[cardId]) {
    return null;
  }
  
  // 保存被删除的卡密信息用于返回
  const deletedCard = { ...cardKeys[cardId] };
  
  // 删除卡密
  delete cardKeys[cardId];
  saveCardKeys();
  
  return deletedCard;
};

/**
 * 批量删除卡密
 * @param {Array} cardIds - 卡密ID数组
 * @return {Object} - 删除结果，包含成功和失败的数量
 */
const deleteMultipleCardKeys = (cardIds) => {
  if (!Array.isArray(cardIds) || cardIds.length === 0) {
    return { success: 0, failed: 0, deletedCards: [] };
  }
  
  const result = {
    success: 0,
    failed: 0,
    deletedCards: []
  };
  
  for (const cardId of cardIds) {
    if (cardKeys[cardId]) {
      // 保存被删除的卡密信息
      result.deletedCards.push({ ...cardKeys[cardId] });
      
      // 删除卡密
      delete cardKeys[cardId];
      result.success++;
    } else {
      result.failed++;
    }
  }
  
  // 只有在成功删除了卡密的情况下才保存
  if (result.success > 0) {
    saveCardKeys();
  }
  
  return result;
};

module.exports = {
  initCardKeys,
  saveCardKeys,
  createCardKey,
  getAllCardKeys,
  getAvailableCardKeysByProduct,
  getCardKeysByDevice,
  getCardKeysByOrders,
  assignCardKeyToOrder,
  updateCardKeysProductName,
  deleteCardKey,
  deleteMultipleCardKeys
};

// 辅助工具函数

/**
 * 生成卡密的函数
 * @param {number} productId - 商品ID
 * @return {string} - 生成的卡密
 */
const generateCardKey = (productId) => {
  const prefix = `CARD${productId}`;
  const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase();
  const timestamp = Date.now().toString().slice(-6);
  return `${prefix}-${randomPart}-${timestamp}`;
};

/**
 * 生成随机小数
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @return {number} - 生成的随机小数
 */
const generateRandomDecimal = (min, max) => {
  return Math.random() * (max - min) + min;
};




module.exports = {
  generateCardKey,
  generateRandomDecimal
};
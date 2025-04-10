// 公共设置控制器
const settingsModel = require('../models/settings');

/**
 * 检查关键设置是否已配置
 * @returns {boolean} 是否已配置关键设置
 */
const checkCriticalSettings = () => {
  const settings = settingsModel.getSettings();
  return settings.walletAddress && settings.apiKey;
};

/**
 * 获取公共设置
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const getPublicSettings = (req, res) => {
  try {
    const allSettings = settingsModel.getSettings();
    
    // 只返回前端需要的公共设置，不包含敏感信息
    const publicSettings = {
      // 服务器配置
      port: allSettings.port,
      
      // Tron配置
      walletAddress: allSettings.walletAddress,
      fullHost: allSettings.fullHost,
      contractAddress: allSettings.contractAddress,
      
      // 订单配置
      pollingTime: allSettings.pollingTime,
      expirationTime: allSettings.expirationTime,
      requiredConfirmations: allSettings.requiredConfirmations,
      checkTimeWindow: allSettings.checkTimeWindow,
      randomDecimalMin: allSettings.randomDecimalMin,
      randomDecimalMax: allSettings.randomDecimalMax,
      maxPendingOrdersPerDevice: allSettings.maxPendingOrdersPerDevice,
      orderCreationCooldown: allSettings.orderCreationCooldown,
      maxOrdersInCooldownPeriod: allSettings.maxOrdersInCooldownPeriod,
      
      // 系统信息
      lastUpdated: allSettings.lastUpdated
    };

    res.json({
      success: true,
      data: publicSettings
    });
  } catch (error) {
    console.error('获取公共设置失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

module.exports = {
  getPublicSettings,
  checkCriticalSettings
};

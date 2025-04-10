// 系统设置模型
const fs = require('fs');
const path = require('path');
const config = require('../config');
const dotenv = require('dotenv');
// 加载环境变量
const { formatLog } = require('./../utils/log')

// 设置文件路径
const SETTINGS_FILE = path.join(config.db.dir, 'settings.json');
const PREVIOUS_SETTINGS_FILE = path.join(config.db.dir, 'settings_previous.json');
const ENV_FILE = path.join(process.cwd(), '.env');

// 默认设置
const DEFAULT_SETTINGS = {
  // 服务器配置
  port: process.env.PORT || 9998,
  jwtSecret: process.env.JWT_SECRET || 'NB666',

  // 管理员配置
  adminKey: config.admin.key,

  // Tron配置
  walletAddress: config.tron.walletAddress || '',
  fullHost: config.tron.fullHost || '',
  privateKey: config.tron.privateKey || '',
  contractAddress: config.tron.usdtContractAddress || '',
  apiKey: config.tron.apiKey || '',

  // 订单配置
  pollingTime: Math.floor(config.order.pollingTime / 1000) || 15,
  expirationTime: Math.floor(config.order.expirationTime / (60 * 1000)) || 20,
  requiredConfirmations: 19,
  checkTimeWindow: 60, // 检查交易的时间窗口（分钟）
  randomDecimalMin: config.order.randomDecimalMin || 0.01,
  randomDecimalMax: config.order.randomDecimalMax || 0.50,
  maxPendingOrdersPerDevice: config.order.maxPendingOrdersPerDevice || 2,
  orderCreationCooldown: Math.floor(config.order.orderCreationCooldown / (60 * 1000)) || 5,
  maxOrdersInCooldownPeriod: config.order.maxOrdersInCooldownPeriod || 2,

  // 数据保存配置
  dataSaveInterval: Math.floor(config.dataSave.interval / (60 * 1000)) || 5,

  // 系统信息
  lastUpdated: Date.now()
};

// 设置数据
let settings = { ...DEFAULT_SETTINGS };

/**
 * 初始化设置
 */
const initSettings = () => {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf8');
      settings = JSON.parse(data);
      formatLog('设置已加载');
    } else {
      saveSettings();
      formatLog('创建默认设置');
    }
  } catch (error) {
    console.error('初始化设置失败:', error);
    saveSettings();
  }
};

/**
 * 保存设置到文件
 */
const saveSettings = () => {
  try {
    // 确保目录存在
    if (!fs.existsSync(config.db.dir)) {
      fs.mkdirSync(config.db.dir, { recursive: true });
    }

    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    formatLog('设置已保存到文件');
    return true;
  } catch (error) {
    console.error('保存设置失败:', error);
    return false;
  }
};

/**
 * 获取所有设置
 * @returns {Object} 设置对象
 */
const getSettings = () => {
  return { ...settings };
};

/**
 * 保存当前设置到上一次设置文件
 */
const saveSettingsToPrevious = () => {
  try {
    // 确保目录存在
    if (!fs.existsSync(config.db.dir)) {
      fs.mkdirSync(config.db.dir, { recursive: true });
    }

    fs.writeFileSync(PREVIOUS_SETTINGS_FILE, JSON.stringify(settings, null, 2));
    formatLog('当前设置已保存到上一次设置文件');
    return true;
  } catch (error) {
    console.error('保存上一次设置失败:', error);
    return false;
  }
};

/**
 * 加载上一次的设置
 * @returns {Object} 上一次的设置对象，如果不存在则返回null
 */
const loadPreviousSettings = () => {
  try {
    if (fs.existsSync(PREVIOUS_SETTINGS_FILE)) {
      const data = fs.readFileSync(PREVIOUS_SETTINGS_FILE, 'utf8');
      const previousSettings = JSON.parse(data);
      formatLog('已加载上一次设置');
      return previousSettings;
    } else {
      formatLog('没有找到上一次设置文件');
      return null;
    }
  } catch (error) {
    console.error('加载上一次设置失败:', error);
    return null;
  }
};

/**
 * 更新设置
 * @param {Object} newSettings - 新的设置对象
 * @returns {Object} 更新后的设置对象
 */
const updateSettings = (newSettings) => {
  // 在更新设置前，保存当前设置到上一次设置文件
  saveSettingsToPrevious();

  // 标记是否需要更新TronWeb配置
  let needUpdateTronWeb = false;
  // 标记是否需要更新环境变量
  let needUpdateEnv = false;

  // 更新服务器配置
  if (newSettings.port) {
    const port = parseInt(newSettings.port);
    if (!isNaN(port) && port > 0) {
      settings.port = port;
      needUpdateEnv = true;
    }
  }

  if (newSettings.jwtSecret) {
    settings.jwtSecret = newSettings.jwtSecret;
    config.jwt.secret = newSettings.jwtSecret;
    needUpdateEnv = true;
  }

  // 更新管理员配置
  if (newSettings.adminKey) {
    settings.adminKey = newSettings.adminKey;
    config.admin.key = newSettings.adminKey;
  }

  // 更新Tron配置
  if (newSettings.walletAddress) {
    settings.walletAddress = newSettings.walletAddress;
    config.tron.walletAddress = newSettings.walletAddress;
    needUpdateTronWeb = true;
  }

  if (newSettings.fullHost) {
    settings.fullHost = newSettings.fullHost;
    config.tron.fullHost = newSettings.fullHost;
    needUpdateTronWeb = true;
  }

  if (newSettings.privateKey) {
    settings.privateKey = newSettings.privateKey;
    config.tron.privateKey = newSettings.privateKey;
    needUpdateTronWeb = true;
  }

  if (newSettings.contractAddress) {
    settings.contractAddress = newSettings.contractAddress;
    config.tron.usdtContractAddress = newSettings.contractAddress;
    needUpdateTronWeb = true;
  }

  if (newSettings.apiKey) {
    settings.apiKey = newSettings.apiKey;
    config.tron.apiKey = newSettings.apiKey;
    needUpdateTronWeb = true;
  }

  // 更新订单配置
  if (newSettings.pollingTime) {
    const pollingTime = parseInt(newSettings.pollingTime);
    if (!isNaN(pollingTime) && pollingTime > 0) {
      settings.pollingTime = pollingTime;
      config.order.pollingTime = pollingTime * 1000;
    }
  }

  if (newSettings.expirationTime) {
    const expirationTime = parseInt(newSettings.expirationTime);
    if (!isNaN(expirationTime) && expirationTime > 0) {
      settings.expirationTime = expirationTime;
      config.order.expirationTime = expirationTime * 60 * 1000;
    }
  }

  if (newSettings.requiredConfirmations) {
    const requiredConfirmations = parseInt(newSettings.requiredConfirmations);
    if (!isNaN(requiredConfirmations) && requiredConfirmations > 0) {
      settings.requiredConfirmations = requiredConfirmations;
      needUpdateTronWeb = true;
    }
  }

  if (newSettings.checkTimeWindow) {
    const checkTimeWindow = parseInt(newSettings.checkTimeWindow);
    if (!isNaN(checkTimeWindow) && checkTimeWindow > 0) {
      settings.checkTimeWindow = checkTimeWindow;
      needUpdateTronWeb = true;
    }
  }

  if (newSettings.randomDecimalMin) {
    const randomDecimalMin = parseFloat(newSettings.randomDecimalMin);
    if (!isNaN(randomDecimalMin) && randomDecimalMin >= 0) {
      settings.randomDecimalMin = randomDecimalMin;
      config.order.randomDecimalMin = randomDecimalMin;
    }
  }

  if (newSettings.randomDecimalMax) {
    const randomDecimalMax = parseFloat(newSettings.randomDecimalMax);
    if (!isNaN(randomDecimalMax) && randomDecimalMax > 0) {
      settings.randomDecimalMax = randomDecimalMax;
      config.order.randomDecimalMax = randomDecimalMax;
    }
  }

  if (newSettings.maxPendingOrdersPerDevice) {
    const maxPendingOrdersPerDevice = parseInt(newSettings.maxPendingOrdersPerDevice);
    if (!isNaN(maxPendingOrdersPerDevice) && maxPendingOrdersPerDevice > 0) {
      settings.maxPendingOrdersPerDevice = maxPendingOrdersPerDevice;
      config.order.maxPendingOrdersPerDevice = maxPendingOrdersPerDevice;
    }
  }

  if (newSettings.orderCreationCooldown) {
    const orderCreationCooldown = parseInt(newSettings.orderCreationCooldown);
    if (!isNaN(orderCreationCooldown) && orderCreationCooldown > 0) {
      settings.orderCreationCooldown = orderCreationCooldown;
      config.order.orderCreationCooldown = orderCreationCooldown * 60 * 1000;
    }
  }

  if (newSettings.maxOrdersInCooldownPeriod) {
    const maxOrdersInCooldownPeriod = parseInt(newSettings.maxOrdersInCooldownPeriod);
    if (!isNaN(maxOrdersInCooldownPeriod) && maxOrdersInCooldownPeriod > 0) {
      settings.maxOrdersInCooldownPeriod = maxOrdersInCooldownPeriod;
      config.order.maxOrdersInCooldownPeriod = maxOrdersInCooldownPeriod;
    }
  }

  // 更新数据保存配置
  if (newSettings.dataSaveInterval) {
    const dataSaveInterval = parseInt(newSettings.dataSaveInterval);
    if (!isNaN(dataSaveInterval) && dataSaveInterval > 0) {
      settings.dataSaveInterval = dataSaveInterval;
      config.dataSave.interval = dataSaveInterval * 60 * 1000;
    }
  }

  // 更新时间戳
  settings.lastUpdated = Date.now();

  // 保存到文件
  saveSettings();

  // 如果需要更新环境变量，保存到.env文件
  if (needUpdateEnv) {
    updateEnvFile();
  }

  // 如果需要更新TronWeb配置，通知TransactionService
  if (needUpdateTronWeb) {
    try {
      const transactionService = require('../services/TransactionService');
      transactionService.updateConfig();
      formatLog('已通知交易服务更新TronWeb配置');
    } catch (error) {
      console.error('通知交易服务更新TronWeb配置失败:', error);
    }
  }

  return { ...settings };
};

/**
 * 更新环境变量文件
 */
const updateEnvFile = () => {
  try {
    // 读取当前的.env文件内容
    let envContent = '';
    if (fs.existsSync(ENV_FILE)) {
      envContent = fs.readFileSync(ENV_FILE, 'utf8');
    }

    // 解析当前的环境变量
    const envVars = dotenv.parse(envContent);

    // 更新环境变量
    envVars.PORT = settings.port.toString();
    envVars.JWT_SECRET = settings.jwtSecret;

    // 将环境变量转换为字符串格式
    const newEnvContent = Object.entries(envVars)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // 写入.env文件
    fs.writeFileSync(ENV_FILE, newEnvContent);
    formatLog('环境变量已更新到.env文件');

    // 重新加载环境变量
    dotenv.config();
  } catch (error) {
    console.error('更新环境变量文件失败:', error);
  }
};

/**
 * 恢复上一次的设置
 * @returns {Object} 恢复后的设置对象，如果没有上一次设置则返回当前设置
 */
const restorePreviousSettings = () => {
  const previousSettings = loadPreviousSettings();

  if (!previousSettings) {
    formatLog('没有上一次设置可恢复');
    return { ...settings };
  }

  // 保存当前设置到临时变量
  const currentSettings = { ...settings };
  
  // 更新所有设置
  settings = { ...previousSettings };
  
  // 更新时间戳
  settings.lastUpdated = Date.now();

  // 同时更新配置
  // 服务器配置
  if (settings.port) {
    process.env.PORT = settings.port.toString();
  }

  if (settings.jwtSecret) {
    process.env.JWT_SECRET = settings.jwtSecret;
    config.jwt.secret = settings.jwtSecret;
  }

  // 管理员配置
  config.admin.key = settings.adminKey;

  // Tron配置
  config.tron.walletAddress = settings.walletAddress;
  config.tron.fullHost = settings.fullHost;
  config.tron.privateKey = settings.privateKey;
  config.tron.usdtContractAddress = settings.contractAddress;
  config.tron.apiKey = settings.apiKey;

  // 订单配置
  config.order.pollingTime = settings.pollingTime * 1000;
  config.order.expirationTime = settings.expirationTime * 60 * 1000;

  if (settings.randomDecimalMin !== undefined) {
    config.order.randomDecimalMin = settings.randomDecimalMin;
  }

  if (settings.randomDecimalMax !== undefined) {
    config.order.randomDecimalMax = settings.randomDecimalMax;
  }

  if (settings.maxPendingOrdersPerDevice !== undefined) {
    config.order.maxPendingOrdersPerDevice = settings.maxPendingOrdersPerDevice;
  }

  if (settings.orderCreationCooldown !== undefined) {
    config.order.orderCreationCooldown = settings.orderCreationCooldown * 60 * 1000;
  }

  if (settings.maxOrdersInCooldownPeriod !== undefined) {
    config.order.maxOrdersInCooldownPeriod = settings.maxOrdersInCooldownPeriod;
  }

  // 数据保存配置
  if (settings.dataSaveInterval !== undefined) {
    config.dataSave.interval = settings.dataSaveInterval * 60 * 1000;
  }

  // 保存到文件
  saveSettings();
  
  // 不再覆盖上一次的设置文件，保持原始的上一次设置
  // 这样用户可以多次恢复到同一个上一次的设置状态
  formatLog('已恢复到上一次的设置状态');

  // 更新环境变量文件
  updateEnvFile();

  // 通知TransactionService更新TronWeb配置
  try {
    const transactionService = require('../services/TransactionService');
    transactionService.updateConfig();
    formatLog('已通知交易服务更新TronWeb配置');
  } catch (error) {
    console.error('通知交易服务更新TronWeb配置失败:', error);
  }

  return { ...settings };
};

// 初始化设置
initSettings();

module.exports = {
  getSettings,
  updateSettings,
  saveSettings,
  restorePreviousSettings
};

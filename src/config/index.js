// 配置文件
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { formatLog } = require('./../utils/log')
// 设置文件路径
const SETTINGS_FILE = path.join(process.cwd(), 'db/settings.json');

// 读取设置文件
let SETTINGS = {};
try {
  if (fs.existsSync(SETTINGS_FILE)) {
    const data = fs.readFileSync(SETTINGS_FILE, 'utf8');
    SETTINGS = JSON.parse(data);
   formatLog('配置已从settings.json加载');
  } else {
   formatLog('settings.json文件不存在，将使用默认配置');
  }
} catch (error) {
  console.error('读取settings.json失败:', error);
}

// 配置对象
const config = {
  // 服务器配置
  defaultPort: SETTINGS.port || process.env.PORT || 9998,

  // JWT配置
  jwt: {
    secret: SETTINGS.jwtSecret || process.env.JWT_SECRET || 'NB666',
    expiresIn: '180d'
  },

  // 管理员配置
  admin: {
    key: SETTINGS.adminKey || '123456'
  },

  // 数据库配置（勿动）
  db: {
    dir: path.join(process.cwd(), 'db'),
    files: {
      orders: 'orders.json',
      cardKeys: 'cardKeys.json',
      products: 'products.json'
    }
  },

  // Tron配置（勿动）
  tron: {
    fullHost: SETTINGS.fullHost || '' ,
    privateKey: SETTINGS.privateKey || '',
    walletAddress: SETTINGS.walletAddress || '' ,
    usdtContractAddress: SETTINGS.contractAddress || '',
    apiKey: SETTINGS.apiKey || '',
  },

  // 订单配置（勿动）
  order: {
    pollingTime: (SETTINGS.pollingTime || 30) * 1000, // 轮询时间，单位秒，转换为毫秒
    lastCheckTimestamp: 10000, // 设置为15分钟前，确保充分覆盖可能延迟的交易
    expirationTime: (SETTINGS.expirationTime || 15) * 60 * 1000, // 订单有效时间，单位分钟，转换为毫秒
    randomDecimalMin: SETTINGS.randomDecimalMin || 0.01, // 最小随机小数
    randomDecimalMax: SETTINGS.randomDecimalMax || 0.50, // 最大随机小数，大幅增加随机范围，确保订单金额唯一
    maxPendingOrdersPerDevice: SETTINGS.maxPendingOrdersPerDevice || 2, // 每个设备最多允许的待处理订单数
    orderCreationCooldown: (SETTINGS.orderCreationCooldown || 5) * 60 * 1000, // 订单创建冷却时间，单位分钟，转换为毫秒
    maxOrdersInCooldownPeriod: SETTINGS.maxOrdersInCooldownPeriod || 2 // 冷却期内允许创建的最大订单数
  },

  // 数据保存配置（勿动）
  dataSave: {
    interval: (SETTINGS.dataSaveInterval || 5) * 60 * 1000 // 数据保存间隔，单位分钟，转换为毫秒
  }
};

module.exports = config;

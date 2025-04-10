// 数据库操作工具
const fs = require('fs');
const path = require('path');
const config = require('../config');

// 确保数据目录存在
const ensureDbDirExists = () => {
  if (!fs.existsSync(config.db.dir)) {
    fs.mkdirSync(config.db.dir, { recursive: true });
  }
};

// 从文件加载数据或初始化
const loadData = (fileName, defaultData = {}) => {
  const filePath = path.join(config.db.dir, fileName);
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error(`加载数据文件失败 ${filePath}:`, error);
  }
  return defaultData;
};

// 保存数据到文件
const saveData = (fileName, data) => {
  const filePath = path.join(config.db.dir, fileName);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error(`保存数据文件失败 ${filePath}:`, error);
  }
};

// 初始化数据库
const initDb = () => {
  ensureDbDirExists();
};

module.exports = {
  loadData,
  saveData,
  initDb
};
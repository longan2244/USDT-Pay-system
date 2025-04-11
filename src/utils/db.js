// 数据库操作工具
const fs = require('fs');
const path = require('path');
const config = require('../config');
const archiver = require('archiver');
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

//备份整个db文件夹
const backupDb = () => {
  const now = new Date();
  const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
  const backupPath = path.join(config.db.dir, `../db自动备份/db-${timestamp}.zip`);


  // 确保备份目录存在
  const backupDir = path.dirname(backupPath);
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const output = fs.createWriteStream(backupPath);
  const archive = archiver('zip', {
    zlib: { level: 9 }
  });

  return new Promise((resolve, reject) => {
    output.on('close', () => {
      console.log(`备份完成: ${backupPath}`);
      console.log(`总大小: ${archive.pointer()} bytes`);
      resolve(backupPath);
    });

    archive.on('error', (err) => {
      console.error('备份失败:', err);
      reject(err);
    });

    archive.on('warning', (err) => {
      if (err.code === 'ENOENT') {
        console.warn('备份警告:', err);
      } else {
        throw err;
      }
    });

    archive.pipe(output);
    archive.directory(config.db.dir, false);
    archive.finalize();
  });
}



module.exports = {
  loadData,
  saveData,
  initDb,
  backupDb
};
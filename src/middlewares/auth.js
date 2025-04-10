// 认证中间件
const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * 验证管理员JWT令牌的中间件
 */
const verifyAdminToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: '未提供认证令牌' });
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, message: '无管理员权限' });
    }
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: '无效的认证令牌' });
  }
};

module.exports = {
  verifyAdminToken
};
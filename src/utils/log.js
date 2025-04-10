// 格式化日志输出
function formatLog(message, type = 'log') {
  const timestamp = new Date().toISOString();
  console[type](`[${timestamp}] ${message}`);
}

//错误日志输出



module.exports = { formatLog };
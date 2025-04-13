// 应用程序入口文件
const app = require('./app');
const config = require('./config');
const transactionService = require('./services/TransactionService');
const os = require('os');
const PORT = config.defaultPort;
const { formatLog } = require('./utils/log')


app.listen(PORT, () => {
  const ifaces = os.networkInterfaces();
  let ipAddress = '';
  for (const dev in ifaces) {
    ifaces[dev].forEach((details) => {
      if (details.family === 'IPv4' && !details.internal) {
        ipAddress = details.address;
      }
    });
  }
  // console.log(`服务器IP地址：${ipAddress}`)
  // console.log(`项目端口：${PORT}`)
  // console.log(`服务器已启动，管理员页面 http://${ipAddress}:${PORT}/admin`);
  // console.log(`服务器已启动，用户页面 http://${ipAddress}:${PORT}/`);
  formatLog(`
    服务器IP地址：${ipAddress}
    项目端口：${PORT}
    管理员页面（初始密码123456）：http://${ipAddress}:${PORT}/admin
    用户页面: ：http://${ipAddress}:${PORT}/
    请在管理员页面配置相关配置
    `)





  transactionService.startMonitor();
});



# USDT TRC20 支付系统

<div align="center">

![USDT支付系统](https://img.shields.io/badge/USDT-TRC20支付系统-green)
![Node.js](https://img.shields.io/badge/Node.js-v16+-blue)
![Express](https://img.shields.io/badge/Express-v5.1.0-lightblue)
![Vue](https://img.shields.io/badge/Vue-v3.5+-brightgreen)
![TronWeb](https://img.shields.io/badge/TronWeb-v5.3.3-orange)
![BigNumber.js](https://img.shields.io/badge/BigNumber.js-v9.2.1-yellow)

</div>

## 📖 项目介绍

这是一个基于Node.js和Vue.js开发的USDT TRC20支付系统，支持自动监控USDT转账交易，实现自动确认支付和订单处理。系统包含用户前端和管理员后台，适用于需要接受USDT支付的各类应用场景。
## 🚀 安装与部署

> ### ⚡ [快速安装指南【查看】](./快速安装指南.md) ⚡
> **想要快速上手？** 我们提供了一个简化的三步安装流程！点击上方链接查看快速安装指南。
## 
## ⚠️ 注意事项

> - 本系统仅供学习和技术研究使用
> - 大陆用户请于下载后24小时内删除
> - 请遵守当地法律法规
> - 禁止用于商业用途
> - 禁止二次分发和销售
> - 禁止上传到任何平台以及服务器
> - 禁止将本系统用于盈利目的
> - 不得用于任何违法，非法，违规用途
> - 作者保留对违规使用者追究法律责任的权利
## 

### 允许的使用范围
- 个人学习和研究使用
- 本地测试和开发环境运行
- 阅读和分析源代码


### 主要功能

- 💰 USDT TRC20支付自动监控与确认
- 🛒 多商品订单管理
- 🔑 卡密系统支持
- 📊 交易数据统计与管理
- 🔐 安全的JWT身份验证
- ⚙️ 灵活的系统配置

## 🔧 技术栈

### 后端

- **Node.js**: 运行环境
- **Express**: Web服务器框架
- **TronWeb**: TRON区块链交互
- **Sequelize**: 数据库ORM
- **JWT**: 身份验证

### 前端

#### 用户界面
- **Vue 3**: 前端框架
- **Vite**: 构建工具
- **Element Plus**: UI组件库
- **Pinia**: 状态管理
- **Vue Router**: 路由管理

#### 管理员界面
- **Vue 3**: 前端框架
- **Vite**: 构建工具
- **Chart.js**: 数据可视化
- **Pinia**: 状态管理


### 系统要求

- Node.js v16 或更高版本
- npm 或 yarn 包管理器

### 详细安装步骤

1. **克隆项目**

```bash
git clone https://github.com/longan2244/USDT-Pay-system.git
cd USDT-Pay-system-master
```

2. **安装依赖**

```bash
npm install
# 或使用 yarn
yarn install
```

3. **配置环境变量**

创建 `.env` 文件在项目根目录，参考以下内容：

```
PORT=9998
JWT_SECRET=your_jwt_secret_key
```

4. **构建前端**

```bash
# 构建用户前端
cd 前端源代码/web/user/USDTPay_User_Vue
npm install
npm run build

# 构建管理员前端
cd ../../admin/USDT_Pay_Admin_Vue
npm install
npm run build
```

5. **启动服务**

```bash
# 回到项目根目录
cd ../../../../

# 开发模式启动
npm run dev

# 生产模式启动
npm start
```

## ⚙️ 系统配置

### 关键配置项

系统首次启动后，需要通过管理员界面配置以下关键信息：

1. **TRON API配置**
   - API密钥 (从 https://www.trongrid.io/ 申请)
   - API主机地址 (如 https://api.trongrid.io)

2. **钱包配置**
   - 收款钱包地址 (TRC20地址)
   - USDT合约地址 (默认为 TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t)

3. **交易确认设置**
   - 确认数量 (推荐19个确认)
   - 检查时间窗口 (分钟)

### 详细配置说明

系统的所有配置项都保存在 `db/settings.json` 文件中，包括：

- **服务器配置**：端口、JWT密钥
- **管理员配置**：管理员密码
- **Tron网络配置**：钱包地址、API设置、合约地址
- **交易监控配置**：轮询时间、订单过期时间、确认数
- **订单金额配置**：随机小数范围设置
- **订单限制配置**：订单数量限制、创建冷却时间
- **数据保存配置**：自动保存间隔

详细的配置项说明请参考 [配置项说明文档](./配置项说明.md)

### 数据存储

系统使用JSON文件存储数据，位于 `db` 目录：

- `orders.json`: 订单数据
- `products.json`: 商品数据
- `cardKeys.json`: 卡密数据
- `settings.json`: 系统设置

## 🖥️ 使用指南

### 管理员界面

访问 `http://your-server-ip:9998/admin` 进入管理员界面，首次使用需要设置管理员密码。

管理员功能包括：

- 系统设置管理
- 商品管理
- 订单查询与管理
- 卡密管理
- 交易数据统计

### 用户界面

访问 `http://your-server-ip:9998/` 进入用户界面，用户可以：

- 浏览商品
- 创建订单
- 使用USDT支付
- 查询订单状态
- 获取卡密

## 📝 注意事项

1. **安全性考虑**
   - 生产环境部署时，请修改默认的JWT密钥
   - 保护好您的TRON API密钥
   - 建议使用HTTPS加密传输

2. **性能优化**
   - 系统默认每5分钟保存一次数据
   - 大量订单时可能需要调整保存频率

3. **区块链特性**
   - TRON网络交易确认需要时间，通常建议等待19个确认
   - 测试时可以使用TRON测试网络 (Nile)

## 🔄 更新日志

### v1.0.0
- 初始版本发布
- 支持基本的USDT TRC20支付功能
- 用户和管理员界面

### v1.0.1
- 修复预览卡密时无法打开弹窗的问题
- 新增数据库定期备份功能
- 优化部分功能排序结构
- 优化对于移动端的适配


## 📄 许可证

本项目采用自定义许可证

### 免责声明
- 使用本系统产生的任何后果由使用者自行承担
- 作者不对使用本系统造成的任何损失负责
- 作者保留对违规使用者追究法律责任的权利

使用本系统即表示您同意上述所有条款。

## 🤝 贡献

欢迎提交问题和功能请求！

---

<div align="center">

**USDT TRC20 支付系统** - 让加密货币支付变得简单

</div>
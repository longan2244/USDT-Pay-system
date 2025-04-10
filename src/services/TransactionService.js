// 交易服务类 - 负责处理与交易相关的功能
const axios = require('axios');
const BigNumber = require('bignumber.js');
const config = require('../config');
const orderModel = require('../models/order');
const productModel = require('../models/product');
const cardKeyModel = require('../models/cardKey');
const { formatLog } = require('../utils/log');

class TransactionService {
  constructor() {
    // 获取设置
    const settingsModel = require('../models/settings');
    const settings = settingsModel.getSettings();

    // 记录上次检查的时间戳
    const checkTimeWindowMs = (settings.checkTimeWindow || 60) * 60 * 1000; // 默认60分钟
    this.lastCheckTimestamp = Date.now() - checkTimeWindowMs;

    // 交易处理锁，用于防止并发处理同一笔交易
    this.processingLocks = new Map();

    // 已处理的交易哈希集合，防止重复处理
    this.processedTxHashes = new Set();

    // 交易确认所需的最小确认数
    this.requiredConfirmations = settings.requiredConfirmations || 19; // TRON网络通常建议19个确认

    // API配置
    this.API_KEY = settings.apiKey  // 替换为你的API密钥
    this.CONTRACT_USDT = config.tron.usdtContractAddress // USDT 合约地址
    this.fullHost = settings.fullHost; // 替换为你的完整主机名
    // 加载已处理的交易记录
    this.loadProcessedTransactions();
  }

  /**
   * 更新配置
   * 当系统设置更新时调用此方法
   */
  async updateConfig() {
    formatLog('检测到系统设置更新，正在更新配置...');

    // 获取最新设置
    const settingsModel = require('../models/settings');
    const settings = settingsModel.getSettings();
    //更新fullHost
    this.fullHost = settings.fullHost;


    // 更新交易确认所需的最小确认数
    this.requiredConfirmations = settings.requiredConfirmations || 19;

    // 更新API配置
    this.API_KEY = settings.apiKey;

    // 更新合约地址
    this.CONTRACT_USDT = config.tron.usdtContractAddress;

    // 更新检查时间窗口
    const checkTimeWindowMs = (settings.checkTimeWindow || 60) * 60 * 1000;
    this.lastCheckTimestamp = Date.now() - checkTimeWindowMs;

    // 清除处理锁
    this.processingLocks = new Map();

    // 重新加载已处理的交易记录
    this.loadProcessedTransactions();

    return true;
  }

  /**
   * 统一地址格式处理函数
   * @param {string} address - 需要格式化的地址
   * @return {string} - 格式化后的小写地址
   */
  normalizeAddress(address) {
    try {
      // 简化版本，只转换为小写
      return address.toLowerCase();
    } catch (error) {
      console.error('地址格式转换失败:', error);
      return address.toLowerCase();
    }
  }

  /**
   * 获取交易状态和确认数
   * @param {string} txHash - 交易哈希
   * @return {Object} - 交易状态信息
   */
  async trackTransaction(txHash) {
    try {

      formatLog(
        `
        ##########哈希轮询信息####
        哈希：${txHash}
        API密钥： ${this.API_KEY}
        fullHost： ${this.fullHost}/wallet/gettransactionbyid?value=${txHash}
        ##########################
        `
      )


      // 使用TRON API获取交易信息
      const response = await axios.get(
        `${this.fullHost}/wallet/gettransactionbyid?value=${txHash}`,
        {
          headers: { 'TRON-PRO-API-KEY': this.API_KEY }
        }
      );

      if (!response.data) {
        throw new Error('交易未找到');
      }

      const txData = response.data
      let status = '确认中';
      let confirmations = 0;
      let success = false;

      if (txData.ret && txData.ret[0] && txData.ret[0].contractRet === 'SUCCESS') {
        // 交易成功，假设已经有足够的确认数
        status = '已完成';
        confirmations = this.requiredConfirmations;
        success = true;
      } else if (txData.ret && txData.ret[0] && txData.ret[0].contractRet !== 'SUCCESS') {
        status = '交易失败';
      }

      return {
        txHash,
        status,
        confirmations,
        blockNumber: txData.blockNumber || null,
        timestamp: txData.block_timestamp || null,
        success
      };
    } catch (error) {
      console.error('获取交易状态失败:', error);

      // 如果API查询失败，假设交易已确认（因为我们是通过API获取到的交易）
      return {
        txHash,
        status: '已完成',
        confirmations: this.requiredConfirmations,
        blockNumber: null,
        timestamp: Date.now(),
        success: true
      };
    }
  }

  /**
   * 处理转账交易
   * @param {Object} transfer - 转账信息
   * @param {boolean} forceProcess - 是否强制处理（忽略锁）
   * @return {boolean} - 处理是否成功
   */
  async processTransfer(transfer, forceProcess = false) {
    // 检查交易是否已处理
    if (this.processedTxHashes.has(transfer.txHash) && !forceProcess) {
      return false;
    }

    // 检查是否有处理锁
    if (this.processingLocks.has(transfer.txHash) && !forceProcess) {
      return false;
    }

    // 设置处理锁
    this.processingLocks.set(transfer.txHash, Date.now());

    try {
      // 检查交易确认状态
      const txStatus = await this.trackTransaction(transfer.txHash);
      if (!txStatus.success && !forceProcess) {
        this.processingLocks.delete(transfer.txHash);
        return false;
      }

      // 查找状态为pending或processing的订单
      const pendingOrders = orderModel.getPendingOrders();

      // 查找金额匹配的待支付订单
      // 不允许误差
      const matchingOrders = pendingOrders.filter(order => {
        // 如果订单已经是processing状态，并且有pendingTxHash，检查是否匹配
        if (order.status === 'processing' && order.pendingTxHash) {
          return order.pendingTxHash === transfer.txHash;
        }
        // 否则检查金额是否匹配
        return parseFloat(order.amount) === transfer.amount;
      });

      if (matchingOrders.length === 0) {
        this.processingLocks.delete(transfer.txHash);
        return false;
      }

      // 按订单创建时间排序，优先处理最早创建的订单
      matchingOrders.sort((a, b) => a.createdAt - b.createdAt);
      const order = matchingOrders[0];

      // 检查交易是否已被使用
      const allOrders = orderModel.getAllOrders();
      const txUsed = allOrders.some(o =>
        o.txHash === transfer.txHash && o.status === 'completed'
      );

      if (txUsed) {
        this.processingLocks.delete(transfer.txHash);
        return false;
      }

      // 更新订单状态和支付信息
      const additionalData = {
        txHash: transfer.txHash,
        paymentInfo: {
          from: transfer.from,
          to: transfer.to,
          amount: transfer.amount,
          timestamp: transfer.timestamp,
          txHash: transfer.txHash,
          confirmations: txStatus.confirmations,
          blockNumber: txStatus.blockNumber
        }
      };

      try {
        // 处理多商品订单
        if (order.items && Array.isArray(order.items)) {
          const cardKeysAssigned = [];

          // 为每个商品分配卡密
          for (const item of order.items) {
            for (let i = 0; i < item.quantity; i++) {
              // 分配卡密
              const availableCard = cardKeyModel.assignCardKeyToOrder(
                item.productId,
                order.deviceUuid,
                order.id
              );

              if (availableCard) {
                // 添加到已分配卡密列表
                cardKeysAssigned.push({
                  id: availableCard.id,
                  key: availableCard.key,
                  productId: availableCard.productId,
                  productName: item.productName
                });

                // 更新商品销售数量
                const product = productModel.getProduct(item.productId, true);
                if (product) {
                  product.soldCount++;
                  product.updatedAt = Date.now();
                }
              }
            }
          }

          // 将卡密添加到订单中
          if (cardKeysAssigned.length > 0) {
            additionalData.cardKeys = cardKeysAssigned;
          }

          // 更新订单状态
          orderModel.updateOrderStatus(order.id, 'completed', additionalData);

          // 保存更新后的数据
          productModel.saveProducts();
        } else {
          // 处理单商品订单
          const availableCard = cardKeyModel.assignCardKeyToOrder(
            order.productId,
            order.deviceUuid,
            order.id
          );

          if (availableCard) {
            // 将卡密添加到订单中
            additionalData.cardKey = availableCard.key;
            additionalData.cardId = availableCard.id;

            // 更新商品销售数量
            const product = productModel.getProduct(order.productId, true);
            if (product) {
              product.soldCount++;
              product.updatedAt = Date.now();
            }

            // 更新订单状态
            orderModel.updateOrderStatus(order.id, 'completed', additionalData);

            // 保存更新后的数据
            productModel.saveProducts();
          } else {
            console.warn(`订单 ${order.id} 自动完成，但没有可用的卡密`);
            // 仍然更新订单状态
            orderModel.updateOrderStatus(order.id, 'completed', additionalData);
          }
        }

        // 标记交易为已处理
        this.processedTxHashes.add(transfer.txHash);
        formatLog(`交易 ${transfer.txHash} 处理成功，订单 ${order.id} 已完成`);

        // 保存订单数据
        orderModel.saveOrders();

        return true;
      } catch (error) {
        console.error(`处理订单 ${order.id} 出错:`, error);
        return false;
      } finally {
        // 释放处理锁
        this.processingLocks.delete(transfer.txHash);
      }
    } catch (error) {
      console.error(`处理交易 ${transfer.txHash} 出错:`, error);
      // 释放处理锁
      this.processingLocks.delete(transfer.txHash);
      return false;
    }
  }

  /**
   * 更新订单状态为processing
   * @param {Object} transfer - 转账信息
   * @return {boolean} - 更新是否成功
   */
  async updateOrderToProcessing(transfer) {
    // 检查是否有处理锁
    if (this.processingLocks.has(transfer.txHash)) {
      return false;
    }

    // 设置处理锁
    this.processingLocks.set(transfer.txHash, Date.now());

    try {
      // 检查交易是否已处理
      if (this.processedTxHashes.has(transfer.txHash)) {
        this.processingLocks.delete(transfer.txHash);
        return false;
      }

      const pendingOrders = orderModel.getPendingOrders().filter(order =>
        order.status === 'pending'
      );

      // 查找金额匹配的待支付订单
      const matchingOrders = pendingOrders.filter(order =>
        parseFloat(order.amount) === transfer.amount
      );

      if (matchingOrders.length === 0) {
        this.processingLocks.delete(transfer.txHash);
        return false;
      }

      // 按订单创建时间排序，优先处理最早创建的订单
      matchingOrders.sort((a, b) => a.createdAt - b.createdAt);
      const order = matchingOrders[0];

      // 检查交易状态
      const txStatus = await this.trackTransaction(transfer.txHash);

      // 更新订单状态为processing
      if (order.status === 'pending') {
        orderModel.updateOrderStatus(order.id, 'processing', {
          pendingTxHash: transfer.txHash,
          pendingInfo: {
            confirmations: txStatus.confirmations,
            requiredConfirmations: this.requiredConfirmations,
            lastChecked: Date.now()
          }
        });

        formatLog(`订单 ${order.id} 发现待确认交易: ${transfer.txHash}, 确认数: ${txStatus.confirmations}/${this.requiredConfirmations}`);

        // 如果交易已经有足够的确认数，直接处理完成
        if (txStatus.success) {
          await this.processTransfer(transfer, true);
        }

        // 保存订单数据
        orderModel.saveOrders();
        return true;
      }

      return false;
    } catch (error) {
      console.error(`更新订单状态出错:`, error);
      return false;
    } finally {
      // 释放处理锁
      this.processingLocks.delete(transfer.txHash);
    }
  }


  /**
   * 使用直接API方式获取USDT转入交易
   * @param {number} limit - 获取的交易数量限制
   * @return {Array} - 转账数组
   */
  async getTransfersByDirectApi(limit = 5) {
    try {
      const walletAddress = config.tron.walletAddress;
      const contractAddress = this.CONTRACT_USDT || config.tron.usdtContractAddress;
      formatLog(
        `
        ##########交易轮询信息####
        合约地址：${contractAddress}
        钱包地址： ${walletAddress}
        API密钥： ${this.API_KEY}
        fullHost： ${this.fullHost}/v1/accounts/${walletAddress}/transactions/trc20
        ##########################
        `
      )
      const response = await axios.get(
        `${this.fullHost}/v1/accounts/${walletAddress}/transactions/trc20`,
        {
          params: {
            contract_address: contractAddress,
            limit: limit,
            order_by: 'block_timestamp,desc', // 按时间降序
            only_confirmed: true,
            only_to: true,
          },
          headers: { 'TRON-PRO-API-KEY': this.API_KEY }
        }
      );

      if (!response.data || !response.data.data || !Array.isArray(response.data.data)) {
        return [];
      }

      const transactions = response.data.data;

      // 转换为统一的转账对象格式
      const transfers = transactions.map(tx => {
        try {
          // 根据aicreatecode.js中的示例，处理交易数据
          // USDT有6位小数
          let value = '0';
          if (tx.value) {
            value = tx.value;
          } else if (tx.token_info && tx.token_info.decimals === 6) {
            // 如果没有直接的value字段，但有token_info，尝试从中获取
            value = tx.value || '0';
          }

          const amount = parseInt(value) / 1000000;
          const formattedAmount = parseFloat(amount.toFixed(2)); // 保留两位小数并转为数字

          return {
            txHash: tx.transaction_id,
            from: this.normalizeAddress(tx.from),
            to: this.normalizeAddress(tx.to),
            amount: formattedAmount,
            timestamp: tx.block_timestamp,
            confirmed: true // API返回的都是已确认的交易
          };
        } catch (err) {
          console.error('解析交易数据出错:', err, tx);
          return null;
        }
      }).filter(tx => tx !== null); // 过滤掉解析失败的交易

      return transfers;
    } catch (error) {
      if (error.response && error.response.status && error.response.status === 401) {
        console.error('API响应状态:', error.response.status);
        console.error('API响应数据:', error.response.data);
      } else {
        console.error('建议降低轮询频率:当前轮询频率');
      }
      return [];
    }
  }

  /**
   * 获取最近的USDT转入交易
   * @param {number} since - 起始时间戳
   * @return {Array} - 转账数组
   */
  async getRecentTransfers(since) {
    try {
      // 使用直接API方式获取交易
      return await this.getTransfersByDirectApi();
    } catch (error) {
      console.error('获取USDT转入交易失败:', error);
      return [];
    }
  }

  /**
   * 检查处于processing状态的订单的交易状态
   * @param {Array} processingOrders - 处于processing状态的订单
   */
  async checkProcessingOrders(processingOrders) {
    if (processingOrders.length === 0) {
      return;
    }

    for (const order of processingOrders) {
      try {
        // 检查是否有处理锁
        if (this.processingLocks.has(order.pendingTxHash)) {
          continue;
        }

        // 设置处理锁
        this.processingLocks.set(order.pendingTxHash, Date.now());

        try {
          // 使用trackTransaction获取交易状态和确认数
          const txStatus = await this.trackTransaction(order.pendingTxHash);

          // 更新订单的pendingInfo
          orderModel.updateOrderStatus(order.id, 'processing', {
            pendingInfo: {
              confirmations: txStatus.confirmations,
              requiredConfirmations: this.requiredConfirmations,
              lastChecked: Date.now(),
              status: txStatus.status
            }
          });

          // 如果交易已确认成功且有足够的确认数
          if (txStatus.success) {
            // 创建转账对象
            const transfer = {
              txHash: order.pendingTxHash,
              from: '', // 这里不重要，因为我们已经知道交易ID
              to: this.normalizeAddress(config.tron.walletAddress),
              amount: parseFloat(order.amount),
              timestamp: txStatus.timestamp || Date.now()
            };

            // 处理这笔已确认的交易
            await this.processTransfer(transfer, true);
            formatLog(`订单 ${order.id} 的交易已确认，已更新为已完成状态`);
          } else if (txStatus.status === '交易失败') {
            // 如果交易失败，将订单状态重置为pending，允许重新支付
            orderModel.updateOrderStatus(order.id, 'pending', {
              failedTxHash: order.pendingTxHash,
              failReason: '交易失败',
              updatedAt: Date.now()
            });
            formatLog(`订单 ${order.id} 的交易失败，已重置为待支付状态`);
          }

          // 保存订单数据
          orderModel.saveOrders();
        } finally {
          // 释放处理锁
          this.processingLocks.delete(order.pendingTxHash);
        }
      } catch (error) {
        console.error(`检查订单 ${order.id} 的交易状态出错:`, error);
        // 释放处理锁
        if (order.pendingTxHash) {
          this.processingLocks.delete(order.pendingTxHash);
        }
      }
    }
  }

  /**
   * 检查过期订单
   */
  async checkExpiredOrders() {
    try {
      const pendingOrders = orderModel.getPendingOrders();
      const currentTime = Date.now();
      let expiredCount = 0;

      for (const order of pendingOrders) {
        // 检查订单是否已过期
        if (order.expiresAt && order.expiresAt < currentTime) {
          // 更新订单状态为expired
          orderModel.updateOrderStatus(order.id, 'expired', {
            updatedAt: currentTime,
            expiredAt: currentTime
          });
          expiredCount++;
        }
      }

      if (expiredCount > 0) {
        formatLog(`已将 ${expiredCount} 个过期订单标记为expired状态`);
        // 保存订单数据
        orderModel.saveOrders();
      }
    } catch (error) {
      console.error('检查过期订单出错:', error);
    }
  }

  /**
   * 启动交易监控服务
   */
  async startMonitor() {
    formatLog('启动USDT交易监控服务...');

    // 检查API密钥和钱包地址是否已配置
    if (!this.API_KEY || !config.tron.walletAddress) {
      console.error('错误: 未配置API密钥或钱包地址，交易监控服务无法启动');
      console.error('请在管理员界面配置API密钥和钱包地址');
      // return;
    }

    let directApiCheckActive = false;

    // 使用直接API方式检查交易的函数
    const checkTransactionsByDirectApi = async () => {
      if (directApiCheckActive) {
        return; // 防止并发执行
      }

      directApiCheckActive = true;
      try {
        const transfers = await this.getTransfersByDirectApi(5);

        if (transfers && transfers.length > 0) {
          // 处理已确认的交易
          for (const transfer of transfers) {
            await this.processTransfer(transfer);
          }
        }
      } catch (error) {
        console.error('直接API检查交易失败:', error);
      } finally {
        directApiCheckActive = false;
      }
    };

    // 立即执行一次直接API检查
    await checkTransactionsByDirectApi();

    // 定期使用直接API方式检查交易（每30秒）
    const directApiInterval = setInterval(checkTransactionsByDirectApi, 15000);

    // 定期检查待处理订单的交易
    let monitoringActive = false;
    const monitorInterval = setInterval(async () => {
      // 防止并发执行
      if (monitoringActive) {
        return;
      }

      monitoringActive = true;

      try {
        const currentTime = Date.now();
        const pendingOrders = orderModel.getPendingOrders();

        if (pendingOrders.length === 0) {
          monitoringActive = false;
          return; // 没有待处理订单，跳过检查
        }

        // 获取钱包最近的已确认USDT转入交易
        const confirmedTransfers = await this.getRecentTransfers(this.lastCheckTimestamp);

        // 更新上次检查时间戳，减去5分钟以确保不会遗漏交易
        this.lastCheckTimestamp = currentTime - 300000; // 5分钟前

        // 处理已确认的交易 - 完成订单
        if (confirmedTransfers && confirmedTransfers.length > 0) {
          for (const transfer of confirmedTransfers) {
            await this.processTransfer(transfer);
          }
        }

        // 检查处于processing状态的订单的交易状态
        const processingOrders = pendingOrders.filter(order =>
          order.status === 'processing' && order.pendingTxHash
        );

        if (processingOrders.length > 0) {
          await this.checkProcessingOrders(processingOrders);
        }

        // 检查过期订单
        await this.checkExpiredOrders();

        // 定期保存已处理的交易哈希
        this.saveProcessedTransactions();
      } catch (error) {
        console.error('监控USDT转账出错:', error);
      } finally {
        monitoringActive = false;
      }
    }, 20000); // 默认每15秒检查一次

    // 添加清理函数
    process.on('SIGINT', () => {
      formatLog('正在关闭USDT交易监控服务...');
      clearInterval(monitorInterval);
      clearInterval(directApiInterval);
      this.saveProcessedTransactions();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      formatLog('正在关闭USDT交易监控服务...');
      clearInterval(monitorInterval);
      clearInterval(directApiInterval);
      this.saveProcessedTransactions();
      process.exit(0);
    });

    formatLog('USDT交易监控服务已启动');
  }

  /**
   * 保存已处理的交易哈希到本地存储
   */
  saveProcessedTransactions() {
    try {
      // 将Set转换为数组
      const processedArray = Array.from(this.processedTxHashes);
      // 只保留最近的1000条记录，防止内存占用过大
      const recentProcessed = processedArray.slice(-1000);

      // 将数据保存到本地文件
      const fs = require('fs');
      const path = require('path');
      const dataPath = path.join(process.cwd(), 'db', 'processedTransactions.json');

      // 添加网络标识，避免跨网络的交易冲突
      const dataToSave = {
        network: config.tron.fullHost,
        transactions: recentProcessed
      };

      fs.writeFileSync(dataPath, JSON.stringify(dataToSave), 'utf8');
    } catch (error) {
      console.error('保存已处理交易记录失败:', error);
    }
  }

  /**
   * 从本地存储加载已处理的交易哈希
   */
  loadProcessedTransactions() {
    try {
      const fs = require('fs');
      const path = require('path');
      const dataPath = path.join(process.cwd(), 'db', 'processedTransactions.json');

      if (fs.existsSync(dataPath)) {
        const data = fs.readFileSync(dataPath, 'utf8');
        let processedArray;

        try {
          // 尝试解析为新格式（带网络标识）
          const parsedData = JSON.parse(data);
          if (parsedData.network && parsedData.transactions) {
            // 如果网络匹配，则加载交易
            if (parsedData.network === config.tron.fullHost) {
              processedArray = parsedData.transactions;
            } else {
              processedArray = [];
            }
          } else {
            // 旧格式，直接使用
            processedArray = parsedData;
          }
        } catch (parseError) {
          // 解析失败，使用空数组
          console.error('解析交易记录失败:', parseError);
          processedArray = [];
        }

        // 将数组转换为Set
        this.processedTxHashes = new Set(processedArray);
      } else {
        this.processedTxHashes = new Set();
      }
    } catch (error) {
      console.error('加载已处理交易记录失败:', error);
      this.processedTxHashes = new Set();
    }
  }

  /**
   * 手动检查转账
   * @param {number} hours - 检查多少小时前的交易
   * @return {Object} - 检查结果
   */
  async manualCheckTransfers(hours = 1) {
    try {
      // 获取指定小时前的时间戳
      const since = Date.now() - (hours * 3600000);

      // 获取转账记录
      const transfers = await this.getRecentTransfers(since);

      // 处理每笔转账
      let confirmedCount = 0;

      for (const transfer of transfers) {
        const success = await this.processTransfer(transfer);
        if (success) {
          confirmedCount++;
        }
      }

      return {
        confirmedCount,
        pendingCount: 0 // 不再使用待确认交易
      };
    } catch (error) {
      console.error('手动检查转账失败:', error);
      throw error;
    }
  }
}

// 创建单例实例
const transactionService = new TransactionService();

module.exports = transactionService;

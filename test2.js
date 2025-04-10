const axios = require('axios');
const BigNumber = require('bignumber.js');

// 配置参数
const RECEIVER_ADDRESS = 'TBA2PDYmncoG4PZypygzCm6KAWYhwqZnFK'; // 要监听的收款地址
const CONTRACT_USDT = 'TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf'; // USDT 合约地址
const API_KEY = ''; // 申请地址: https://www.trongrid.io/
const fullHost = 'https://nile.trongrid.io'
const fingerprint = null
// 轮询检查入账交易
async function monitorIncomingTransfers() {
  try {
    const response = await axios.get(
      `${fullHost}/v1/accounts/${RECEIVER_ADDRESS}/transactions/trc20`,
      {
        params: {
          contract_address: CONTRACT_USDT,
          limit: 5, // 每次查询最近50条
          order_by: 'block_timestamp,desc', // 按时间降序
          only_confirmed: true,
          only_to: true,

        },
        headers: { 'TRON-PRO-API-KEY': API_KEY },
      }
    );



    const transactions = response.data.data || [];
    console.log(transactions);

    for (const tx of transactions) {
      console.log(tx);
      // {
      //   transaction_id: '6f17f1bee243a8278c866a995113973071b58d466c9d0525eecfe439010bde63',
      //     token_info: {
      //     symbol: 'USDT',
      //       address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
      //         decimals: 6,
      //           name: 'Tether USD'
      //   },
      //   block_timestamp: 1744209960000,
      //     from: 'TWj3JpJDmn9ajFBYkqhcNhayowt8CFVtv1',
      //       to: 'THasA2jVVzUjRArRrXBH586e62J4qg1Ao5',
      //         type: 'Transfer',
      //           value: '54450000'
      // }

    }
    console.log('##################');

  } catch (error) {
    console.error('监控出错:', error.message);
  }
}

// 每10秒检查一次
setInterval(monitorIncomingTransfers, 10_000);
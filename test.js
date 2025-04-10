const TronWeb = require('tronweb');

const tronWeb = new TronWeb({
  fullHost: 'https://api.trongrid.io',
});
async function checkTRC20Transactions1(contractAddress, yourAddress) {
  //转化 yourAddress 格式
  yourAddress = tronWeb.address.toHex(yourAddress);


  const contract = await tronWeb.contract().at(contractAddress);

  // 监听Transfer事件
  contract.Transfer({ to: yourAddress }).watch((err, event) => {

    // console.log('收到TRC20转账:', event);
    event.result.to === yourAddress && console.log('收到TRC20转账:', event);
  });
}



// 示例：检查USDT(TRC20)转账
checkTRC20Transactions1('TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', 'THasA2jVVzUjRArRrXBH586e62J4qg1Ao5');


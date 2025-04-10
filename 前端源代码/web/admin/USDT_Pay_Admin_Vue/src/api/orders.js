import request from '../util/request'

/**
 * 获取订单列表
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码
 * @param {number} params.limit - 每页数量
 * @param {string} params.status - 订单状态筛选
 * @param {string} params.startDate - 开始日期
 * @param {string} params.endDate - 结束日期
 * @returns {Promise} - 返回订单列表数据
 */
export function getOrders(params) {
  return request({
    url: '/admin/orders',
    method: 'get',
    params
  })
}

/**
 * 获取订单详情
 * @param {string} id - 订单ID
 * @returns {Promise} - 返回订单详情
 */
export function getOrderDetail(id) {
  return request({
    url: `/admin/orders/${id}`,
    method: 'get'
  })
}

/**
 * 更新订单状态
 * @param {string} id - 订单ID
 * @param {Object} data - 更新数据
 * @param {string} data.status - 订单状态
 * @returns {Promise} - 返回更新结果
 */
export function updateOrderStatus(id, data) {
  return request({
    url: `/admin/orders/${id}/status`,
    method: 'put',
    data
  })
}

/**
 * 获取订单统计数据
 * @param {Object} params - 查询参数
 * @param {string} params.period - 时间周期，例如：'day', 'week', 'month'
 * @returns {Promise} - 返回订单统计数据
 */
export function getOrderStats(params) {
  return request({
    url: '/admin/orders/stats',
    method: 'get',
    params
  })
}

/**
 * 确认订单支付
 * @param {Object} data - 确认支付数据
 * @param {string} data.orderId - 订单ID
 * @param {string} data.txHash - 交易哈希
 * @returns {Promise} - 返回确认结果
 */
export function confirmPayment(data) {
  return request({
    url: '/admin/confirm-payment',
    method: 'post',
    data
  })
}

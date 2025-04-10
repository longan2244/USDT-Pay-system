import request from '../util/request'

/**
 * 获取仪表盘数据
 * @returns {Promise} - 返回仪表盘数据
 */
export function getDashboardData() {
  return request({
    url: '/admin/dashboard',
    method: 'get'
  })
}

/**
 * 获取销售趋势数据
 * @param {Object} params - 查询参数
 * @param {string} params.period - 时间周期，例如：'day', 'week', 'month'
 * @returns {Promise} - 返回销售趋势数据
 */
export function getSalesTrend(params) {
  return request({
    url: '/admin/sales/trend',
    method: 'get',
    params
  })
}

/**
 * 获取商品销售情况
 * @returns {Promise} - 返回商品销售数据
 */
export function getProductSales() {
  return request({
    url: '/admin/products/sales',
    method: 'get'
  })
}

/**
 * 获取最近订单
 * @param {Object} params - 查询参数
 * @param {number} params.limit - 限制返回的订单数量
 * @returns {Promise} - 返回最近订单数据
 */
export function getRecentOrders(params) {
  return request({
    url: '/admin/orders/recent',
    method: 'get',
    params
  })
}

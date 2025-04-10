import request from '../util/request'

/**
 * 获取卡密列表
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码
 * @param {number} params.pageSize - 每页数量
 * @param {string} params.status - 卡密状态筛选
 * @param {string} params.productId - 商品ID筛选
 * @param {string} params.search - 搜索关键词
 * @returns {Promise} - 返回卡密列表数据
 */
export function getCardKeys(params) {
  return request({
    url: '/admin/card-keys',
    method: 'get',
    params
  })
}

/**
 * 添加卡密
 * @param {Object} data - 卡密数据
 * @param {string} data.productId - 商品ID
 * @param {string} data.keys - 卡密内容
 * @param {boolean} data.removeDuplicates - 是否去重
 * @param {string} data.delimiter - 分隔符
 * @returns {Promise} - 返回添加结果
 */
export function addCardKeys(data) {
  return request({
    url: '/admin/add-card-key',
    method: 'post',
    data
  })
}

/**
 * 删除卡密
 * @param {string} id - 卡密ID
 * @returns {Promise} - 返回删除结果
 */
export function deleteCardKey(id) {
  return request({
    url: `/admin/card-keys/${id}`,
    method: 'delete'
  })
}

/**
 * 批量删除卡密
 * @param {Object} data - 批量删除数据
 * @param {Array} data.ids - 卡密ID数组
 * @returns {Promise} - 返回批量删除结果
 */
export function batchDeleteCardKeys(data) {
  return request({
    url: '/admin/card-keys/batch-delete',
    method: 'post',
    data
  })
}

import request from '../util/request'

/**
 * 获取商品列表
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码
 * @param {number} params.limit - 每页数量
 * @returns {Promise} - 返回商品列表数据
 */
export function getProducts(params) {
  return request({
    url: '/admin/products',
    method: 'get',
    params
  })
}

/**
 * 获取商品详情
 * @param {string} id - 商品ID
 * @returns {Promise} - 返回商品详情
 */
export function getProductDetail(id) {
  return request({
    url: `/admin/products/${id}`,
    method: 'get'
  })
}

/**
 * 创建商品
 * @param {Object} data - 商品数据
 * @returns {Promise} - 返回创建结果
 */
export function createProduct(data) {
  return request({
    url: '/admin/products',
    method: 'post',
    data
  })
}

/**
 * 更新商品
 * @param {string} id - 商品ID
 * @param {Object} data - 更新数据
 * @returns {Promise} - 返回更新结果
 */
export function updateProduct(id, data) {
  return request({
    url: `/admin/products/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除商品
 * @param {string} id - 商品ID
 * @returns {Promise} - 返回删除结果
 */
export function deleteProduct(id) {
  return request({
    url: `/admin/products/${id}`,
    method: 'delete'
  })
}

/**
 * 获取商品卡密库存
 * @param {string} id - 商品ID
 * @returns {Promise} - 返回卡密库存数据
 */
export function getProductCardKeys(id) {
  return request({
    url: `/admin/products/${id}/cardkeys`,
    method: 'get'
  })
}

/**
 * 添加商品卡密
 * @param {string} id - 商品ID
 * @param {Object} data - 卡密数据
 * @param {Array} data.cardKeys - 卡密列表
 * @returns {Promise} - 返回添加结果
 */
export function addProductCardKeys(id, data) {
  return request({
    url: `/admin/products/${id}/cardkeys`,
    method: 'post',
    data
  })
}

import request from '../util/request'

/**
 * 获取系统设置
 * @returns {Promise} - 返回系统设置数据
 */
export function getSettings() {
  return request({
    url: '/admin/settings',
    method: 'get'
  })
}

/**
 * 更新系统设置
 * @param {Object} data - 设置数据
 * @returns {Promise} - 返回更新结果
 */
export function updateSettings(data) {
  return request({
    url: '/admin/settings',
    method: 'put',
    data
  })
}

/**
 * 恢复上一次的系统设置
 * @returns {Promise} - 返回恢复结果
 */
export function restorePreviousSettings() {
  return request({
    url: '/admin/settings/restore-previous',
    method: 'post'
  })
}

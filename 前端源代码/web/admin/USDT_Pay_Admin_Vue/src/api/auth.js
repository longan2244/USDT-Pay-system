import request from '../util/request'

/**
 * 管理员登录
 * @param {Object} data - 登录信息
 * @param {string} data.adminKey - 管理员密钥
 * @returns {Promise} - 返回登录结果
 */
export function login(data) {
  console.log(data)
  return request({
    url: '/admin/login',
    method: 'post',
    data
  })
}

/**
 * 退出登录
 * @returns {Promise} - 返回退出结果
 */
export function logout() {
  return request({
    url: '/admin/logout',
    method: 'post'
  })
}

/**
 * 获取当前管理员信息
 * @returns {Promise} - 返回管理员信息
 */
export function getAdminInfo() {
  return request({
    url: '/admin/info',
    method: 'get'
  })
}

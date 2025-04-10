import axios from 'axios';
import MessageBox from '@/components/MessageBox';

// 创建axios实例
const service = axios.create({
  baseURL: '/api', // 设置统一的请求前缀
  timeout: 15000, // 请求超时时间
});

// 请求拦截器
service.interceptors.request.use(
  config => {
    // 在发送请求之前做些什么
    // 例如：添加统一的header
    config.headers = {
      ...config.headers,
      'Content-Type': 'application/json',
    };
    return config;
  },
  error => {
    // 对请求错误做些什么
    console.error('请求发送失败:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
service.interceptors.response.use(
  response => {
    const res = response.data;

    // 这里可以统一处理响应
    if (res.success) {
      return res;
    } else {
      // 处理业务错误
      MessageBox.error(res.message || '操作失败');
      return Promise.reject(new Error(res.message || '操作失败'));
    }
  },
  error => {
    if (error.status === 507) {
      MessageBox.error(error.response.data.message || '服务器异常，请稍后再试');
      return Promise.reject(new Error('服务器异常，请稍后再试'));
    }

    // 处理HTTP错误
    console.error('请求失败:', error);
    MessageBox.error(error.message || '网络请求失败');
    return Promise.reject(error);
  }
);

export default service;
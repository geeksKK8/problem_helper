import PocketBase from 'pocketbase'

// PocketBase服务器URL - 支持本地开发和Render部署
const POCKETBASE_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase-0-29-0.onrender.com'

// 创建PocketBase客户端实例
export const pb = new PocketBase(POCKETBASE_URL)

// 配置PocketBase客户端绕过ngrok警告
pb.beforeSend = function (url, options) {
  options.headers = options.headers || {}
  options.headers['ngrok-skip-browser-warning'] = 'true'
  return { url, options }
}

// 用户类型定义
export interface PBUser {
  id: string
  email: string
  name: string
  avatar?: string
  created: string
  updated: string
}

// 认证状态类型
export interface AuthModel {
  token: string
  model: PBUser
}

// 导出PocketBase实例和类型 
import PocketBase from 'pocketbase'

// PocketBase服务器URL - 支持本地开发和Render部署
const POCKETBASE_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL

// 添加调试信息
console.log('🔍 PocketBase 配置调试信息:')
console.log('  - NEXT_PUBLIC_POCKETBASE_URL:', process.env.NEXT_PUBLIC_POCKETBASE_URL)
console.log('  - NODE_ENV:', process.env.NODE_ENV)
console.log('  - 最终使用的PocketBase URL:', POCKETBASE_URL)
console.log('  - 当前时间:', new Date().toISOString())

// 创建PocketBase客户端实例
export const pb = new PocketBase(POCKETBASE_URL)

// 配置PocketBase客户端绕过ngrok警告
pb.beforeSend = function (url, options) {
  console.log('🔍 PocketBase 请求详情:')
  console.log('  - 请求URL:', url)
  console.log('  - 请求方法:', options.method || 'GET')
  console.log('  - 请求头:', options.headers)
  console.log('  - 请求时间:', new Date().toISOString())
  
  options.headers = options.headers || {}
  options.headers['ngrok-skip-browser-warning'] = 'true'
  return { url, options }
}

// 添加连接状态检查
export async function checkPocketBaseHealth() {
  try {
    console.log('🔍 检查PocketBase健康状态...')
    console.log('  - 目标URL:', POCKETBASE_URL)
    console.log('  - 检查时间:', new Date().toISOString())
    
    const health = await pb.health.check()
    console.log('✅ PocketBase健康检查成功:', health)
    return true
  } catch (error: unknown) {
    console.error('❌ PocketBase健康检查失败:', error)
    console.error('  - 错误类型:', error instanceof Error ? error.constructor?.name : typeof error)
    console.error('  - 错误消息:', error instanceof Error ? error.message : String(error))
    console.error('  - 错误详情:', error)
    return false
  }
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
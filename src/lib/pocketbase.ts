import PocketBase from 'pocketbase'

// PocketBase服务器URL
const POCKETBASE_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090'

// 创建PocketBase客户端实例
export const pb = new PocketBase(POCKETBASE_URL)

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
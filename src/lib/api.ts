import { pb, type PBUser } from './pocketbase'

// API基础URL - 支持自定义端口
const PORT = process.env.PORT || '3000'
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || `http://localhost:${PORT}/api`

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  // 检查PocketBase连接状态
  async checkPocketBaseConnection(): Promise<boolean> {
    try {
      await pb.health.check()
      return true
    } catch (error) {
      console.error('PocketBase连接失败:', error)
      return false
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.statusText}`)
    }

    return response.json()
  }

  // 用户认证相关API
  async login(email: string, password: string): Promise<{ user: PBUser; token: string }> {
    try {
      // 检查连接状态
      const isConnected = await this.checkPocketBaseConnection()
      if (!isConnected) {
        throw new Error('无法连接到数据库服务器')
      }

      const authData = await pb.collection('users').authWithPassword(email, password)
      
      if (!authData.record) {
        throw new Error('登录失败')
      }

      return {
        user: {
          id: authData.record.id,
          email: authData.record.email,
          name: authData.record.name || '',
          avatar: authData.record.avatar || '',
          created: authData.record.created,
          updated: authData.record.updated,
        },
        token: authData.token,
      }
    } catch (error) {
      console.error('登录错误:', error)
      if (error instanceof Error) {
        throw new Error(error.message)
      }
      throw new Error('邮箱或密码错误')
    }
  }

  async register(userData: { email: string; password: string; passwordConfirm: string; name: string }): Promise<{ user: PBUser; token: string }> {
    try {
      // 检查连接状态
      const isConnected = await this.checkPocketBaseConnection()
      if (!isConnected) {
        throw new Error('无法连接到数据库服务器')
      }

      const record = await pb.collection('users').create(userData)
      
      // 注册成功后自动登录
      const authData = await pb.collection('users').authWithPassword(userData.email, userData.password)
      
      return {
        user: {
          id: record.id,
          email: record.email,
          name: record.name || '',
          avatar: record.avatar || '',
          created: record.created,
          updated: record.updated,
        },
        token: authData.token,
      }
    } catch (error: unknown) {
      console.error('注册错误:', error)
      
      // 处理PocketBase错误
      if (error && typeof error === 'object' && 'data' in error) {
        const errors = (error as { data: Record<string, unknown> }).data
        if (errors.email) {
          throw new Error('邮箱已被使用')
        }
        if (errors.password) {
          throw new Error('密码格式不正确')
        }
        if (errors.passwordConfirm) {
          throw new Error('两次输入的密码不一致')
        }
        if (errors.name) {
          throw new Error('用户名不能为空')
        }
      }
      
      throw new Error('注册失败，请稍后重试')
    }
  }

  async logout(): Promise<void> {
    pb.authStore.clear()
  }

  async getCurrentUser(): Promise<PBUser | null> {
    if (!pb.authStore.isValid) {
      return null
    }

    try {
      const record = pb.authStore.model
      if (!record) return null

      return {
        id: record.id,
        email: record.email,
        name: record.name || '',
        avatar: record.avatar || '',
        created: record.created,
        updated: record.updated,
      }
    } catch (error) {
      console.error('获取用户信息错误:', error)
      return null
    }
  }

  async updateUserProfile(profileData: { name?: string; avatar?: string }): Promise<PBUser> {
    if (!pb.authStore.isValid) {
      throw new Error('用户未登录')
    }

    try {
      const record = await pb.collection('users').update(pb.authStore.model!.id, profileData)
      
      return {
        id: record.id,
        email: record.email,
        name: record.name || '',
        avatar: record.avatar || '',
        created: record.created,
        updated: record.updated,
      }
    } catch (error) {
      console.error('更新用户资料错误:', error)
      throw new Error('更新失败')
    }
  }

  // 分析相关API
  async uploadImage(file: File): Promise<{
    success: boolean
    data?: {
      id: string
      url: string
    }
    error?: string
  }> {
    const formData = new FormData()
    formData.append('image', file)
    
    const response = await fetch(`${this.baseUrl}/analysis/upload`, {
      method: 'POST',
      body: formData,
    })
    
    if (!response.ok) {
      throw new Error(`上传失败: ${response.statusText}`)
    }
    
    return response.json()
  }

  async analyzeImage(imageId: string): Promise<{
    success: boolean
    data?: {
      knowledgePoint: string
      solution?: Array<{
        step: number
        title: string
        content: string
        formula?: string
      }>
      problems: Array<{
        id: string
        title: string
        content: string
        difficulty: 'easy' | 'medium' | 'hard'
        tags: string[]
        similarity: number
        estimatedTime: number
        source: string
      }>
      analysisId: string
    }
    error?: string
  }> {
    return this.request('/analysis', {
      method: 'POST',
      body: JSON.stringify({ imageId }),
    })
  }

  async getKnowledgePoints(): Promise<{
    success: boolean
    data?: Array<{
      id: string
      path: string
      title: string
      isLeaf: boolean
    }>
    error?: string
  }> {
    return this.request('/knowledge-points')
  }

  async getAnalysisHistory(page = 1, limit = 10): Promise<{
    success: boolean
    data?: Array<{
      id: string
      date: string
      type: string
      status: string
      knowledgePoint: string
    }>
    error?: string
  }> {
    return this.request(`/history?page=${page}&limit=${limit}`)
  }
}

export const apiClient = new ApiClient(API_BASE_URL) 
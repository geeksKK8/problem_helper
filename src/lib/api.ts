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

  // 自动刷新token的请求方法
  private async requestWithAuth<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // 检查token是否即将过期并尝试刷新
    if (pb.authStore.isValid) {
      try {
        // 如果token在未来5分钟内过期，尝试刷新
        const token = pb.authStore.token
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]))
          const expirationTime = payload.exp * 1000
          const fiveMinutesFromNow = Date.now() + 5 * 60 * 1000
          
          if (expirationTime < fiveMinutesFromNow) {
      
            await pb.collection('users').authRefresh()
          }
        }
      } catch (error) {
        console.warn('Token刷新失败:', error)
        // 刷新失败不影响当前请求，继续执行
      }
    }

    return this.request<T>(endpoint, options)
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
      imageUrl: string
      status: string
      fileName: string
      fileSize: number
      mimeType: string
      extension: string
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

  async analyzeImage(imageId: string, subject?: {
    studyPhaseCode: string
    subjectCode: string
    name: string
    category: string
  }): Promise<{
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
    const requestBody: { imageId: string; subject?: typeof subject } = { imageId }
    if (subject) {
      requestBody.subject = subject
    }
    
    return this.requestWithAuth('/analysis', {
      method: 'POST',
      body: JSON.stringify(requestBody),
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

  // 历史记录相关API
  async saveAnalysisHistory(data: {
    imageUrl: string
    originalImageName: string
    knowledgePoint: string
    solution: Array<{
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
      estimatedTime?: number
      source?: string
    }>
    status: 'processing' | 'completed' | 'failed'
  }): Promise<{
    success: boolean
    data?: { id: string }
    error?: string
  }> {
    try {
      if (!pb.authStore.isValid) {
        throw new Error('用户未登录')
      }

      // 计算平均相似度和题目数量
      const avgSimilarity = data.problems.length > 0 
        ? data.problems.reduce((sum, p) => sum + p.similarity, 0) / data.problems.length 
        : 0
      
      const record = await pb.collection('analysis_history').create({
        user: pb.authStore.model!.id,
        image_url: data.imageUrl,
        original_image_name: data.originalImageName,
        knowledge_point: data.knowledgePoint,
        solution: data.solution,
        problems: data.problems,
        status: data.status,
        avg_similarity: avgSimilarity,
        problem_count: data.problems.length,
      })

      return {
        success: true,
        data: { id: record.id }
      }
    } catch (error) {
      console.error('保存分析历史失败:', error)
      throw new Error('保存分析历史失败')
    }
  }

  async getAnalysisHistory(params: {
    page?: number
    limit?: number
    status?: 'all' | 'completed' | 'processing' | 'failed'
    knowledgePoint?: string
    dateFrom?: string
    dateTo?: string
    search?: string
  } = {}): Promise<{
    success: boolean
    data?: {
      records: Array<{
        id: string
        date: string
        imageUrl: string
        originalImageName: string
        knowledgePoint: string
        problemCount: number
        status: 'completed' | 'processing' | 'failed'
        avgSimilarity: number
      }>
      total: number
      page: number
      limit: number
      hasMore: boolean
    }
    error?: string
  }> {
    try {
      if (!pb.authStore.isValid) {
        throw new Error('用户未登录')
      }

      const page = params.page || 1
      const limit = params.limit || 10

      // 构建过滤条件
      let filter = `user = "${pb.authStore.model!.id}"`
      
      if (params.status && params.status !== 'all') {
        filter += ` && status = "${params.status}"`
      }
      
      if (params.knowledgePoint) {
        filter += ` && knowledge_point ~ "${params.knowledgePoint}"`
      }
      
      if (params.search) {
        filter += ` && (knowledge_point ~ "${params.search}" || original_image_name ~ "${params.search}")`
      }
      
      if (params.dateFrom) {
        filter += ` && created >= "${params.dateFrom}"`
      }
      
      if (params.dateTo) {
        filter += ` && created <= "${params.dateTo}"`
      }

      // 为每个请求生成唯一的取消键，避免PocketBase自动取消机制
      const uniqueCancelKey = `history-list-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      const requestOptions: {
        filter: string
        sort: string
        $cancelKey: string
      } = {
        filter,
        sort: '-created',
        $cancelKey: uniqueCancelKey
      }

      const result = await pb.collection('analysis_history').getList(page, limit, requestOptions)

      const records = result.items.map((item: Record<string, unknown>) => ({
        id: item.id as string,
        date: item.created as string,
        imageUrl: item.image_url as string,
        originalImageName: item.original_image_name as string,
        knowledgePoint: item.knowledge_point as string,
        problemCount: item.problem_count as number,
        status: item.status as 'processing' | 'completed' | 'failed',
        avgSimilarity: item.avg_similarity as number,
      }))

      return {
        success: true,
        data: {
          records,
          total: result.totalItems,
          page: result.page,
          limit: result.perPage,
          hasMore: result.page < result.totalPages,
        }
      }
    } catch (error) {
      console.error('获取分析历史失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取分析历史失败'
      }
    }
  }

  async getAnalysisHistoryDetail(id: string): Promise<{
    success: boolean
    data?: {
      id: string
      userId: string
      imageUrl: string
      originalImageName: string
      knowledgePoint: string
      solution: Array<{
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
        estimatedTime?: number
        source?: string
      }>
      status: 'processing' | 'completed' | 'failed'
      avgSimilarity: number
      problemCount: number
      createdAt: string
      updatedAt: string
    }
    error?: string
  }> {
    try {
      if (!pb.authStore.isValid) {
        throw new Error('用户未登录')
      }

      // 为每个请求生成唯一的取消键，避免PocketBase自动取消机制
      const uniqueCancelKey = `history-detail-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      const record = await pb.collection('analysis_history').getOne(id, {
        filter: `user = "${pb.authStore.model!.id}"`,
        $cancelKey: uniqueCancelKey
      })

      return {
        success: true,
        data: {
          id: record.id,
          userId: record.user,
          imageUrl: record.image_url,
          originalImageName: record.original_image_name,
          knowledgePoint: record.knowledge_point,
          solution: record.solution || [],
          problems: record.problems || [],
          status: record.status,
          avgSimilarity: record.avg_similarity,
          problemCount: record.problem_count,
          createdAt: record.created,
          updatedAt: record.updated,
        }
      }
    } catch (error) {
      console.error('获取分析历史详情失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取分析历史详情失败'
      }
    }
  }

  // 删除分析历史记录
  async deleteAnalysisHistory(historyIds: string[]): Promise<{
    success: boolean
    deletedCount?: number
    error?: string
  }> {
    try {
      if (!pb.authStore.isValid) {
        throw new Error('用户未登录')
      }

      let deletedCount = 0
      const userId = pb.authStore.model!.id

      // 批量删除历史记录
      for (const historyId of historyIds) {
        try {
          // 先验证记录是否属于当前用户
          const uniqueCancelKey = `history-delete-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          
          const record = await pb.collection('analysis_history').getOne(historyId, {
            filter: `user = "${userId}"`,
            $cancelKey: uniqueCancelKey
          })
          
          if (record) {
            await pb.collection('analysis_history').delete(historyId)
            deletedCount++
          }
        } catch (error) {
          console.warn(`删除历史记录 ${historyId} 失败:`, error)
          // 继续处理其他记录，不中断整个删除流程
        }
      }

      return {
        success: true,
        deletedCount
      }
    } catch (error) {
      console.error('删除分析历史失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '删除分析历史失败'
      }
    }
  }
}

export const apiClient = new ApiClient(API_BASE_URL) 
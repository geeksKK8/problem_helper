export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  createdAt: Date
  updatedAt: Date
}

export interface Problem {
  id: string
  title: string
  content: string
  difficulty: 'easy' | 'medium' | 'hard'
  tags: string[]
  similarity: number
  estimatedTime?: number
  source?: string
}

export interface SolutionStep {
  step: number
  title: string
  content: string
  formula?: string
}

export interface AnalysisResult {
  id: string
  userId: string
  imageUrl: string
  knowledgePoint: string
  solution?: SolutionStep[]
  problems: Problem[]
  status: 'processing' | 'completed' | 'failed'
  similarity: number
  createdAt: Date
  updatedAt: Date
}

export interface KnowledgePoint {
  id: string
  path: string
  title: string
  isLeaf: boolean
  children?: KnowledgePoint[]
}

// 历史记录详细接口
export interface HistoryRecord {
  id: string
  userId: string
  imageUrl: string
  originalImageName: string
  knowledgePoint: string
  solution: SolutionStep[]
  problems: Problem[]
  status: 'processing' | 'completed' | 'failed'
  avgSimilarity: number
  problemCount: number
  createdAt: string
  updatedAt: string
}

// 历史记录列表项接口（简化版）
export interface HistoryItem {
  id: string
  date: string
  imageUrl: string
  originalImageName: string
  knowledgePoint: string
  problemCount: number
  status: 'completed' | 'processing' | 'failed'
  avgSimilarity: number
}

// 历史记录查询参数
export interface HistoryQueryParams {
  page?: number
  limit?: number
  status?: 'all' | 'completed' | 'processing' | 'failed'
  knowledgePoint?: string
  dateFrom?: string
  dateTo?: string
  search?: string
}

// 历史记录响应接口
export interface HistoryResponse {
  success: boolean
  data?: {
    records: HistoryItem[]
    total: number
    page: number
    limit: number
    hasMore: boolean
  }
  error?: string
}

// 历史记录详情响应接口
export interface HistoryDetailResponse {
  success: boolean
  data?: HistoryRecord
  error?: string
} 
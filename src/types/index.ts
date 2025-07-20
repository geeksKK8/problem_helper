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

export interface AnalysisResult {
  id: string
  userId: string
  imageUrl: string
  knowledgePoint: string
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

export interface HistoryItem {
  id: string
  date: string
  imageUrl: string
  knowledgePoint: string
  problemCount: number
  status: 'completed' | 'processing' | 'failed'
  similarity: number
} 
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AnalysisResult } from '@/types'
import { pb, type PBUser } from './pocketbase'

interface AuthState {
  user: PBUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (user: PBUser) => void
  logout: () => void
  setLoading: (loading: boolean) => void
  initializeAuth: () => Promise<void>
}

interface AnalysisState {
  currentAnalysis: AnalysisResult | null
  isAnalyzing: boolean
  progress: number
  setAnalysis: (analysis: AnalysisResult | null) => void
  setAnalyzing: (analyzing: boolean) => void
  setProgress: (progress: number) => void
}

// 创建一个不使用persist的基础store
const createAuthStore = () => create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: (user) => {
    set({ user, isAuthenticated: true })
    // 手动保存到localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth-storage', JSON.stringify({
        state: { user, isAuthenticated: true },
        version: 0
      }))
    }
  },
  logout: () => {
    pb.authStore.clear()
    set({ user: null, isAuthenticated: false })
    // 清除localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth-storage')
    }
  },
  setLoading: (loading) => set({ isLoading: loading }),
  initializeAuth: async () => {
    // 防止重复初始化
    const currentState = get()
    if (currentState.isLoading === false && currentState.user && currentState.isAuthenticated) {
      return
    }
    
    try {
      // 先尝试从localStorage恢复状态
      let restoredState: { user: PBUser; isAuthenticated: boolean } | null = null
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('auth-storage')
        if (stored) {
          try {
            const parsed = JSON.parse(stored)
            restoredState = parsed.state

          } catch (e) {
            console.warn('解析localStorage失败:', e)
          }
        }
      }
      
      // 如果有恢复的状态且用户已认证，先设置状态
      if (restoredState?.user?.id && restoredState?.isAuthenticated) {
        const restoredUser = restoredState.user as PBUser
        set({ 
          user: restoredUser, 
          isAuthenticated: true, 
          isLoading: false 
        })
        
        // 在后台验证token（不阻塞UI）
        setTimeout(async () => {
          try {
            if (pb.authStore.isValid && pb.authStore.model?.id === restoredUser.id) {
              // Token still valid
            } else {
              await pb.collection('users').authRefresh()
            }
          } catch (error) {
            console.warn('Token验证失败，保持本地登录状态:', error)
          }
        }, 0)
        return
      }
      
      // 如果没有本地状态，检查PocketBase
      if (pb.authStore.isValid && pb.authStore.model) {
        const user: PBUser = {
          id: pb.authStore.model.id,
          email: pb.authStore.model.email,
          name: pb.authStore.model.name || '',
          avatar: pb.authStore.model.avatar || '',
          created: pb.authStore.model.created,
          updated: pb.authStore.model.updated,
        }
        set({ user, isAuthenticated: true, isLoading: false })
        
        // 保存到localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth-storage', JSON.stringify({
            state: { user, isAuthenticated: true },
            version: 0
          }))
        }
      } else {

        set({ user: null, isAuthenticated: false, isLoading: false })
      }
    } catch (error) {
      console.error('初始化认证状态错误:', error)
      set({ user: null, isAuthenticated: false, isLoading: false })
    }
  },
}))

export const useAuthStore = createAuthStore()

export const useAnalysisStore = create<AnalysisState>((set) => ({
  currentAnalysis: null,
  isAnalyzing: false,
  progress: 0,
  setAnalysis: (analysis) => set({ currentAnalysis: analysis }),
  setAnalyzing: (analyzing) => set({ isAnalyzing: analyzing }),
  setProgress: (progress) => set({ progress }),
})) 
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

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => {
        pb.authStore.clear()
        set({ user: null, isAuthenticated: false })
      },
      setLoading: (loading) => set({ isLoading: loading }),
      initializeAuth: async () => {
        set({ isLoading: true })
        try {
          // 检查PocketBase认证状态
          if (pb.authStore.isValid && pb.authStore.model) {
            const user: PBUser = {
              id: pb.authStore.model.id,
              email: pb.authStore.model.email,
              name: pb.authStore.model.name || '',
              avatar: pb.authStore.model.avatar || '',
              created: pb.authStore.model.created,
              updated: pb.authStore.model.updated,
            }
            set({ user, isAuthenticated: true })
          } else {
            set({ user: null, isAuthenticated: false })
          }
        } catch (error) {
          console.error('初始化认证状态错误:', error)
          set({ user: null, isAuthenticated: false })
        } finally {
          set({ isLoading: false })
        }
      },
    }),
    {
      name: 'auth-storage',
      // 只持久化用户信息，不持久化认证状态
      partialize: (state) => ({ user: state.user }),
    }
  )
)

export const useAnalysisStore = create<AnalysisState>((set) => ({
  currentAnalysis: null,
  isAnalyzing: false,
  progress: 0,
  setAnalysis: (analysis) => set({ currentAnalysis: analysis }),
  setAnalyzing: (analyzing) => set({ isAnalyzing: analyzing }),
  setProgress: (progress) => set({ progress }),
})) 
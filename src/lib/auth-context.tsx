"use client"

import { createContext, useContext, useEffect, ReactNode } from 'react'
import { useAuthStore } from './store'

interface AuthContextType {
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isLoading, initializeAuth } = useAuthStore()

  useEffect(() => {

    
    // 延迟初始化，给persist中间件更多时间恢复状态
    const timer = setTimeout(() => {
      initializeAuth()
    }, 100)

    return () => clearTimeout(timer)
  }, []) // ✅ 移除所有依赖项，只在组件挂载时执行一次

  return (
    <AuthContext.Provider value={{ isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 
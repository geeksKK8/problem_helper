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
    // 在应用启动时初始化认证状态
    initializeAuth()
  }, [initializeAuth])

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
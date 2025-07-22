"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/store"
import { Loader2 } from "lucide-react"

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isLoading, isAuthenticated, router])

  // 显示加载状态
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">正在验证登录状态...</p>
        </div>
      </div>
    )
  }

  // 如果未认证，显示fallback或重定向
  if (!isAuthenticated) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">正在跳转到登录页面...</p>
        </div>
      </div>
    )
  }

  // 如果已认证，显示子组件
  return <>{children}</>
} 
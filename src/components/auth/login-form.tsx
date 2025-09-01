"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Mail, Lock, Eye, EyeOff } from "lucide-react"
import { useAuthStore } from "@/lib/store"
import { apiClient } from "@/lib/api"
import { toast } from "sonner"
import Link from "next/link"
import { useRouter } from "next/navigation"

const loginSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  password: z.string().min(6, "密码至少6位"),
  remember: z.boolean().optional(),
})

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const login = useAuthStore((state) => state.login)
  const router = useRouter()

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      remember: false,
    },
  })

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    console.log('🔍 登录表单提交开始...')
    console.log('  - 提交时间:', new Date().toISOString())
    console.log('  - 表单数据:', {
      email: values.email,
      passwordLength: values.password.length,
      remember: values.remember
    })
    console.log('  - 环境变量检查:')
    console.log('    - NEXT_PUBLIC_POCKETBASE_URL:', process.env.NEXT_PUBLIC_POCKETBASE_URL)
    console.log('    - NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL)
    console.log('    - NODE_ENV:', process.env.NODE_ENV)
    
    setIsLoading(true)
    try {
      console.log('🔍 调用API客户端登录方法...')
      const response = await apiClient.login(values.email, values.password)
      
      console.log('✅ API登录成功:')
      console.log('  - 成功时间:', new Date().toISOString())
      console.log('  - 用户ID:', response.user.id)
      console.log('  - 用户邮箱:', response.user.email)
      console.log('  - Token存在:', !!response.user.id)
      
      console.log('🔍 调用store登录方法...')
      login(response.user)
      
      console.log('✅ Store登录成功，显示成功提示...')
      toast.success("登录成功！")
      
      console.log('🔍 跳转到仪表板...')
      // 跳转到仪表板
      router.push("/dashboard")
    } catch (error: unknown) {
      console.error('❌ 登录表单处理失败:')
      console.error('  - 失败时间:', new Date().toISOString())
      console.error('  - 错误类型:', error instanceof Error ? error.constructor?.name : typeof error)
      console.error('  - 错误消息:', error instanceof Error ? error.message : String(error))
      console.error('  - 错误详情:', error)
      console.error('  - 当前环境变量:')
      console.error('    - NEXT_PUBLIC_POCKETBASE_URL:', process.env.NEXT_PUBLIC_POCKETBASE_URL)
      console.error('    - NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL)
      console.error('    - NODE_ENV:', process.env.NODE_ENV)
      
      const errorMessage = error instanceof Error ? error.message : "登录失败，请检查邮箱和密码"
      console.error('  - 显示给用户的错误消息:', errorMessage)
      toast.error(errorMessage)
    } finally {
      console.log('🔍 登录流程结束，重置加载状态')
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">登录到AI助手</CardTitle>
        <CardDescription>
          输入您的凭据访问您的账户
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>邮箱</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        {...field}
                        type="email"
                        placeholder="请输入邮箱"
                        className="pl-10"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>密码</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        {...field}
                        type={showPassword ? "text" : "password"}
                        placeholder="请输入密码"
                        className="pl-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="remember"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm font-normal">
                      记住我
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "登录中..." : "登录"}
            </Button>
          </form>
        </Form>
        <Separator className="my-4" />
        <div className="text-center text-sm">
          <a href="/forgot-password" className="text-primary hover:underline">
            忘记密码?
          </a>
        </div>
        <div className="text-center text-sm mt-2">
          还没有账户?{" "}
          <Link href="/register" className="text-primary hover:underline">
            立即注册
          </Link>
        </div>
      </CardContent>
    </Card>
  )
} 
"use client"

import { useState, useEffect } from "react"
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { User, Mail, Calendar, Edit, Save, X } from "lucide-react"
import { useAuthStore } from "@/lib/store"
import { apiClient } from "@/lib/api"
import { toast } from "sonner"

const profileSchema = z.object({
  name: z.string().min(2, "用户名至少2个字符").max(50, "用户名不能超过50个字符"),
  email: z.string().email("请输入有效的邮箱地址"),
})

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { user, logout } = useAuthStore()

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
    },
  })

  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name,
        email: user.email,
      })
    }
  }, [user, form])

  async function onSubmit(values: z.infer<typeof profileSchema>) {
    setIsLoading(true)
    try {
      await apiClient.updateUserProfile({
        name: values.name,
      })
      
      toast.success("资料更新成功！")
      setIsEditing(false)
      // 重新获取用户信息
      window.location.reload()
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "更新失败，请稍后重试")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await apiClient.logout()
      logout()
      toast.success("已退出登录")
      // 跳转到首页
      window.location.href = "/"
    } catch (error) {
      console.error(error)
      toast.error("退出登录失败")
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">请先登录</h2>
          <Button asChild>
            <a href="/login">去登录</a>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold">个人资料</CardTitle>
                <CardDescription>
                  管理您的账户信息和偏好设置
                </CardDescription>
              </div>
              <Button
                variant={isEditing ? "outline" : "default"}
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? <X className="h-4 w-4 mr-2" /> : <Edit className="h-4 w-4 mr-2" />}
                {isEditing ? "取消" : "编辑"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 头像部分 */}
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="text-lg">
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-semibold">{user.name}</h3>
                <p className="text-muted-foreground">{user.email}</p>
              </div>
            </div>

            <Separator />

            {/* 资料表单 */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        用户名
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={!isEditing}
                          placeholder="请输入用户名"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        <Mail className="h-4 w-4 mr-2" />
                        邮箱地址
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={true} // 邮箱不允许修改
                          placeholder="请输入邮箱"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 账户信息 */}
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-2" />
                    注册时间：{new Date(user.created).toLocaleDateString('zh-CN')}
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-2" />
                    最后更新：{new Date(user.updated).toLocaleDateString('zh-CN')}
                  </div>
                </div>

                {isEditing && (
                  <div className="flex space-x-2">
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          保存中...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          保存更改
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                    >
                      取消
                    </Button>
                  </div>
                )}
              </form>
            </Form>

            <Separator />

            {/* 危险操作区域 */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-red-600">危险操作</h4>
              <div className="space-y-2">
                <Button
                  variant="destructive"
                  onClick={handleLogout}
                  className="w-full"
                >
                  退出登录
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 
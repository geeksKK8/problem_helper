# AI助手网站组件实现示例

## 1. 登录表单组件

```tsx
// components/auth/login-form.tsx
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

const loginSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  password: z.string().min(8, "密码至少8位"),
  remember: z.boolean().optional(),
})

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      remember: false,
    },
  })

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setIsLoading(true)
    try {
      // 调用登录API
      console.log(values)
    } catch (error) {
      console.error(error)
    } finally {
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
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
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
      </CardContent>
    </Card>
  )
}
```

## 2. 文件上传组件

```tsx
// components/upload/upload-zone.tsx
import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, X, FileImage } from "lucide-react"

interface UploadZoneProps {
  onFileSelect: (file: File) => void
  onUpload: (file: File) => Promise<void>
  accept?: string
  maxSize?: number
  preview?: boolean
}

export function UploadZone({
  onFileSelect,
  onUpload,
  accept = "image/*",
  maxSize = 10 * 1024 * 1024, // 10MB
  preview = true,
}: UploadZoneProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const onDrop = useCallback(
    async (acceptedFiles: File[], rejectedFiles: any[]) => {
      setError(null)
      
      if (rejectedFiles.length > 0) {
        setError("文件格式不支持或文件过大")
        return
      }

      const file = acceptedFiles[0]
      if (!file) return

      // 创建预览
      if (preview && file.type.startsWith("image/")) {
        const url = URL.createObjectURL(file)
        setPreviewUrl(url)
      }

      onFileSelect(file)
      setUploading(true)
      setProgress(0)

      try {
        // 模拟上传进度
        const interval = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 90) {
              clearInterval(interval)
              return prev
            }
            return prev + 10
          })
        }, 100)

        await onUpload(file)
        setProgress(100)
      } catch (err) {
        setError("上传失败，请重试")
      } finally {
        setUploading(false)
        setTimeout(() => setProgress(0), 1000)
      }
    },
    [onFileSelect, onUpload, preview]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept ? { [accept]: [] } : undefined,
    maxSize,
    multiple: false,
  })

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>上传题目图片</CardTitle>
          <CardDescription>
            支持PNG、JPG格式，最大10MB
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
              transition-colors duration-200
              ${isDragActive 
                ? "border-primary bg-primary/5" 
                : "border-muted-foreground/25 hover:border-primary/50"
              }
            `}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            {isDragActive ? (
              <p className="text-primary font-medium">将文件拖放到这里...</p>
            ) : (
              <div>
                <p className="text-muted-foreground mb-2">
                  拖拽文件到这里，或点击选择文件
                </p>
                <Button variant="outline" size="sm">
                  选择文件
                </Button>
              </div>
            )}
          </div>

          {uploading && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>上传中...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {error && (
            <Alert variant="destructive" className="mt-4">
              <X className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {previewUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">图片预览</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <img
                src={previewUrl}
                alt="预览"
                className="w-full h-48 object-contain rounded-lg border"
              />
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => {
                  URL.revokeObjectURL(previewUrl)
                  setPreviewUrl(null)
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
```

## 3. 分析进度组件

```tsx
// components/analysis/analysis-progress.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Upload, 
  Brain, 
  Target, 
  CheckCircle, 
  X,
  AlertCircle 
} from "lucide-react"

interface AnalysisProgressProps {
  currentStep: 'upload' | 'analyzing' | 'selecting' | 'complete' | 'error'
  progress: number
  message: string
  onCancel?: () => void
  onRetry?: () => void
}

const steps = [
  { key: 'upload', label: '上传图片', icon: Upload },
  { key: 'analyzing', label: 'AI分析', icon: Brain },
  { key: 'selecting', label: '选择知识点', icon: Target },
  { key: 'complete', label: '完成', icon: CheckCircle },
]

export function AnalysisProgress({
  currentStep,
  progress,
  message,
  onCancel,
  onRetry,
}: AnalysisProgressProps) {
  const currentStepIndex = steps.findIndex(step => step.key === currentStep)
  const isError = currentStep === 'error'

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isError ? (
            <AlertCircle className="h-5 w-5 text-destructive" />
          ) : (
            <Brain className="h-5 w-5 text-primary" />
          )}
          {isError ? '分析失败' : 'AI分析中'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 步骤指示器 */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isActive = index === currentStepIndex
            const isCompleted = index < currentStepIndex
            const isError = currentStep === 'error' && index === currentStepIndex

            return (
              <div key={step.key} className="flex items-center">
                <div className={`
                  flex items-center justify-center w-8 h-8 rounded-full
                  ${isCompleted 
                    ? 'bg-primary text-primary-foreground' 
                    : isActive 
                    ? 'bg-primary/20 text-primary border-2 border-primary'
                    : 'bg-muted text-muted-foreground'
                  }
                `}>
                  {isCompleted ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : isError ? (
                    <X className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>
                <span className={`
                  ml-2 text-sm font-medium
                  ${isActive ? 'text-primary' : 'text-muted-foreground'}
                `}>
                  {step.label}
                </span>
                {index < steps.length - 1 && (
                  <div className={`
                    w-8 h-0.5 mx-2
                    ${isCompleted ? 'bg-primary' : 'bg-muted'}
                  `} />
                )}
              </div>
            )
          })}
        </div>

        {/* 进度条 */}
        {!isError && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>{message}</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}

        {/* 错误提示 */}
        {isError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        {/* 操作按钮 */}
        <div className="flex gap-2">
          {onCancel && !isError && (
            <Button variant="outline" onClick={onCancel}>
              取消
            </Button>
          )}
          {onRetry && isError && (
            <Button onClick={onRetry}>
              重试
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
```

## 4. 题目卡片组件

```tsx
// components/problems/problem-card.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Bookmark, 
  ExternalLink, 
  Star,
  Clock,
  Tag
} from "lucide-react"

interface Problem {
  id: string
  title: string
  content: string
  difficulty: 'easy' | 'medium' | 'hard'
  tags: string[]
  similarity: number
  estimatedTime?: number
}

interface ProblemCardProps {
  problem: Problem
  onView: (id: string) => void
  onSave: (id: string) => void
  saved?: boolean
}

const difficultyColors = {
  easy: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  hard: 'bg-red-100 text-red-800',
}

const difficultyLabels = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
}

export function ProblemCard({
  problem,
  onView,
  onSave,
  saved = false,
}: ProblemCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-2">
              {problem.title}
            </CardTitle>
            <CardDescription className="mt-2 line-clamp-3">
              {problem.content}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSave(problem.id)}
            className="ml-2"
          >
            <Bookmark className={`h-4 w-4 ${saved ? 'fill-current' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* 相似度评分 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">相似度</span>
            <span className="font-medium">{problem.similarity}%</span>
          </div>
          <Progress value={problem.similarity} className="h-2" />
        </div>

        {/* 标签和难度 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className={difficultyColors[problem.difficulty]}>
              {difficultyLabels[problem.difficulty]}
            </Badge>
            {problem.estimatedTime && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{problem.estimatedTime}分钟</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 text-yellow-500" />
            <span className="text-sm text-muted-foreground">
              {problem.similarity >= 90 ? '极高' : 
               problem.similarity >= 70 ? '高' : 
               problem.similarity >= 50 ? '中等' : '低'}
            </span>
          </div>
        </div>

        {/* 标签 */}
        {problem.tags.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            <Tag className="h-3 w-3 text-muted-foreground" />
            {problem.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {problem.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{problem.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex gap-2 pt-2">
          <Button 
            variant="default" 
            size="sm" 
            className="flex-1"
            onClick={() => onView(problem.id)}
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            查看详情
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onSave(problem.id)}
          >
            <Bookmark className={`h-4 w-4 ${saved ? 'fill-current' : ''}`} />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
```

## 5. 侧边栏导航组件

```tsx
// components/layout/sidebar.tsx
import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Home,
  Upload,
  History,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

interface SidebarProps {
  user: User
  collapsed?: boolean
  onToggle?: () => void
}

const navigation = [
  { name: '仪表板', href: '/dashboard', icon: Home },
  { name: '题目分析', href: '/dashboard/analyze', icon: Upload },
  { name: '历史记录', href: '/dashboard/history', icon: History },
  { name: '个人资料', href: '/dashboard/profile', icon: User },
]

export function Sidebar({ user, collapsed = false, onToggle }: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center px-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary" />
          {!collapsed && (
            <span className="text-lg font-bold">AI助手</span>
          )}
        </div>
        {!collapsed && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="ml-auto"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      <Separator />

      {/* 导航菜单 */}
      <ScrollArea className="flex-1 px-3">
        <nav className="space-y-2 py-4">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Button
                key={item.name}
                variant={isActive ? "secondary" : "ghost"}
                className={`w-full justify-start ${collapsed ? 'px-2' : 'px-3'}`}
                onClick={() => {
                  router.push(item.href)
                  setIsMobileOpen(false)
                }}
              >
                <Icon className={`h-4 w-4 ${collapsed ? '' : 'mr-2'}`} />
                {!collapsed && item.name}
              </Button>
            )
          })}
        </nav>
      </ScrollArea>

      <Separator />

      {/* 用户信息 */}
      <div className="p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar} />
                <AvatarFallback>
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="ml-2 flex-1 text-left">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>我的账户</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/dashboard/profile')}>
              <User className="mr-2 h-4 w-4" />
              个人资料
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              设置
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogOut className="mr-2 h-4 w-4" />
              退出登录
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )

  return (
    <>
      {/* 桌面端侧边栏 */}
      <div className={`
        hidden lg:flex h-screen flex-col border-r bg-background
        ${collapsed ? 'w-16' : 'w-64'}
        transition-all duration-300
      `}>
        <SidebarContent />
      </div>

      {/* 移动端抽屉 */}
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm" className="lg:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent />
        </SheetContent>
      </Sheet>
    </>
  )
}
```

## 6. 历史记录表格组件

```tsx
// components/history/history-table.tsx
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { 
  Search, 
  Filter, 
  Eye, 
  Download, 
  Trash2,
  Calendar,
  Image as ImageIcon
} from "lucide-react"

interface HistoryItem {
  id: string
  date: string
  imageUrl: string
  knowledgePoint: string
  problemCount: number
  status: 'completed' | 'processing' | 'failed'
  similarity: number
}

const statusConfig = {
  completed: { label: '已完成', variant: 'default' as const },
  processing: { label: '处理中', variant: 'secondary' as const },
  failed: { label: '失败', variant: 'destructive' as const },
}

export function HistoryTable() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // 模拟数据
  const historyData: HistoryItem[] = [
    {
      id: "1",
      date: "2024-01-15 14:30",
      imageUrl: "/api/images/thumb1.jpg",
      knowledgePoint: "高中数学 -> 函数 -> 二次函数",
      problemCount: 3,
      status: "completed",
      similarity: 85,
    },
    // ... 更多数据
  ]

  const filteredData = historyData.filter(item => {
    const matchesSearch = item.knowledgePoint.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || item.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>分析历史</CardTitle>
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜索知识点..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="completed">已完成</SelectItem>
              <SelectItem value="processing">处理中</SelectItem>
              <SelectItem value="failed">失败</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableHead>日期</TableHead>
            <TableHead>题目图片</TableHead>
            <TableHead>知识点</TableHead>
            <TableHead>推荐题目</TableHead>
            <TableHead>相似度</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>操作</TableHead>
          </TableHeader>
          <TableBody>
            {paginatedData.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{item.date}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={item.imageUrl} />
                    <AvatarFallback>
                      <ImageIcon className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                </TableCell>
                <TableCell>
                  <div className="max-w-xs">
                    <p className="text-sm font-medium truncate">
                      {item.knowledgePoint}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {item.problemCount} 题
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${item.similarity}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {item.similarity}%
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={statusConfig[item.status].variant}>
                    {statusConfig[item.status].label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              显示第 {(currentPage - 1) * itemsPerPage + 1} 到{" "}
              {Math.min(currentPage * itemsPerPage, filteredData.length)} 条，
              共 {filteredData.length} 条记录
            </p>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => setCurrentPage(page)}
                      isActive={currentPage === page}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

这些组件示例展示了如何使用shadcn/ui构建现代化的AI助手网站界面，包含了完整的交互逻辑和响应式设计。 
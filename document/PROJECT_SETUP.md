# AI助手网站项目初始化指南

## 项目概述

本指南将帮助您从零开始搭建基于Next.js 14和shadcn/ui的AI助手网站。

## 前置要求

- Node.js 18+ 
- npm 或 yarn 或 pnpm
- Git

## 1. 创建Next.js项目

```bash
# 使用create-next-app创建项目
npx create-next-app@latest ai-helper-website --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# 进入项目目录
cd ai-helper-website
```

## 2. 安装shadcn/ui

```bash
# 初始化shadcn/ui
npx shadcn@latest init

# 选择以下配置：
# - Style: Default
# - Base color: Slate
# - CSS variables: Yes
# - React Server Components: Yes
# - Components directory: @/components/ui
# - Utilities directory: @/lib/utils
# - Include example components: No
```

## 3. 安装必要的shadcn/ui组件

```bash
# 安装核心组件
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add form
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add checkbox
npx shadcn@latest add separator
npx shadcn@latest add progress
npx shadcn@latest add alert
npx shadcn@latest add badge
npx shadcn@latest add avatar
npx shadcn@latest add dropdown-menu
npx shadcn@latest add table
npx shadcn@latest add pagination
npx shadcn@latest add select
npx shadcn@latest add switch
npx shadcn@latest add sidebar
npx shadcn@latest add sheet
npx shadcn@latest add skeleton
npx shadcn@latest add toast
```

## 4. 安装额外依赖

```bash
# 表单处理
npm install react-hook-form @hookform/resolvers zod

# 状态管理
npm install zustand

# 文件上传
npm install react-dropzone

# 图标
npm install lucide-react

# 日期处理
npm install date-fns

# 路由
npm install next-navigation

# 类型定义
npm install @types/node @types/react @types/react-dom
```

## 5. 项目结构设置

创建以下目录结构：

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── register/
│   │       └── page.tsx
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── analyze/
│   │   │   └── page.tsx
│   │   ├── history/
│   │   │   └── page.tsx
│   │   └── profile/
│   │       └── page.tsx
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/          # shadcn/ui组件
│   ├── auth/        # 认证组件
│   ├── dashboard/   # 仪表板组件
│   ├── upload/      # 上传组件
│   ├── analysis/    # 分析组件
│   ├── problems/    # 题目组件
│   ├── history/     # 历史组件
│   ├── layout/      # 布局组件
│   └── common/      # 通用组件
├── lib/
│   ├── utils.ts
│   ├── auth.ts
│   ├── api.ts
│   └── store.ts
├── types/
│   └── index.ts
└── styles/
    └── globals.css
```

## 6. 配置环境变量

创建 `.env.local` 文件：

```env
# Google AI API
GOOGLE_API_KEY=your_google_api_key_here

# 数据库 (可选)
DATABASE_URL=your_database_url

# 认证 (可选)
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# 文件上传 (可选)
UPLOADTHING_SECRET=your_uploadthing_secret
UPLOADTHING_APP_ID=your_uploadthing_app_id
```

## 7. 配置Tailwind CSS

更新 `tailwind.config.ts`：

```typescript
import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
```

## 8. 创建基础类型定义

创建 `src/types/index.ts`：

```typescript
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
```

## 9. 创建状态管理

创建 `src/lib/store.ts`：

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  login: (user: User) => void
  logout: () => void
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
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
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
```

## 10. 创建API工具

创建 `src/lib/api.ts`：

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    const response = await fetch(url, config)
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`)
    }

    return response.json()
  }

  // 认证相关
  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  async register(userData: any) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  }

  // 分析相关
  async uploadImage(file: File) {
    const formData = new FormData()
    formData.append('image', file)
    
    return this.request('/analysis/upload', {
      method: 'POST',
      body: formData,
      headers: {}, // 让浏览器自动设置Content-Type
    })
  }

  async analyzeImage(imageId: string) {
    return this.request(`/analysis/${imageId}`)
  }

  async getAnalysisHistory(page = 1, limit = 10) {
    return this.request(`/analysis/history?page=${page}&limit=${limit}`)
  }

  // 用户相关
  async getUserProfile() {
    return this.request('/user/profile')
  }

  async updateUserProfile(profileData: any) {
    return this.request('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    })
  }
}

export const apiClient = new ApiClient(API_BASE_URL)
```

## 11. 创建根布局

更新 `src/app/layout.tsx`：

```typescript
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "AI助手 - 智能题目分析",
  description: "基于AI的数学题目分析助手，帮助您找到相关题目",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
```

## 12. 创建主页面

更新 `src/app/page.tsx`：

```typescript
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-8">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-6xl">
            AI助手
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            基于人工智能的智能题目分析助手，帮助您快速找到相关的数学题目
          </p>
          <div className="flex justify-center gap-4">
            <Button asChild size="lg">
              <Link href="/login">开始使用</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/register">注册账户</Link>
            </Button>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>智能分析</CardTitle>
              <CardDescription>
                上传数学题目图片，AI自动识别知识点
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                使用先进的计算机视觉技术，准确识别题目类型和知识点
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>精准推荐</CardTitle>
              <CardDescription>
                基于相似度算法推荐最相关的题目
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                从海量题库中筛选出最相似的题目，提高学习效率
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>历史记录</CardTitle>
              <CardDescription>
                保存分析历史，随时查看过往记录
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                完整记录您的分析历史，方便回顾和对比
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
```

## 13. 运行项目

```bash
# 开发模式
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

## 14. 下一步

1. **实现认证系统**: 参考 `COMPONENT_EXAMPLES.md` 中的登录表单组件
2. **创建仪表板**: 实现侧边栏导航和主页面
3. **集成AI功能**: 连接 `ai_helper.js` 的后端API
4. **添加文件上传**: 实现图片上传和分析功能
5. **完善用户界面**: 添加历史记录和个人资料页面

## 常见问题

### Q: shadcn/ui组件不显示样式？
A: 确保在 `globals.css` 中正确导入了shadcn/ui的样式文件。

### Q: TypeScript报错？
A: 检查 `tsconfig.json` 中的路径别名配置是否正确。

### Q: 组件导入失败？
A: 确保组件路径正确，并且已经通过 `npx shadcn@latest add` 安装了相应组件。

### Q: 开发服务器启动失败？
A: 检查端口是否被占用，可以尝试使用 `npm run dev -- -p 3001` 指定其他端口。

这个初始化指南提供了完整的项目搭建流程，您可以按照步骤逐步构建AI助手网站。 
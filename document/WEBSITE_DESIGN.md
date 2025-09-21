# AI助手网站前端页面设计

## 项目概述

基于shadcn/ui构建的AI助手网站，提供用户注册/登录、题目图片分析、用户信息管理等功能。

## 技术栈

- **前端框架**: Next.js 14 (App Router)
- **UI组件库**: shadcn/ui
- **样式**: Tailwind CSS
- **状态管理**: Zustand
- **表单处理**: React Hook Form + Zod
- **图标**: Lucide React
- **后端API**: 基于ai_helper.js功能

## 页面结构

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   ├── profile/
│   │   └── history/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/          # shadcn/ui组件
│   ├── auth/        # 认证相关组件
│   ├── dashboard/   # 仪表板组件
│   ├── upload/      # 文件上传组件
│   └── common/      # 通用组件
├── lib/
│   ├── utils.ts
│   ├── auth.ts
│   └── api.ts
└── types/
    └── index.ts
```

## 页面设计详情

### 1. 认证页面 (Auth Pages)

#### 1.1 登录页面 (`/login`)

**组件结构:**
```
LoginPage
├── Card (容器)
│   ├── CardHeader
│   │   ├── CardTitle ("登录到AI助手")
│   │   └── CardDescription ("输入您的凭据访问您的账户")
│   ├── CardContent
│   │   └── LoginForm
│   │       ├── FormField (邮箱)
│   │       ├── FormField (密码)
│   │       ├── Checkbox ("记住我")
│   │       ├── Button ("登录")
│   │       └── Link ("忘记密码?")
│   └── CardFooter
│       └── Link ("还没有账户? 注册")
```

**使用的shadcn/ui组件:**
- `Card`, `CardHeader`, `CardContent`, `CardFooter`
- `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`
- `Input` (邮箱、密码)
- `Button`
- `Checkbox`
- `Label`
- `Separator`

#### 1.2 注册页面 (`/register`)

**组件结构:**
```
RegisterPage
├── Card (容器)
│   ├── CardHeader
│   │   ├── CardTitle ("创建新账户")
│   │   └── CardDescription ("填写以下信息创建您的账户")
│   ├── CardContent
│   │   └── RegisterForm
│   │       ├── FormField (用户名)
│   │       ├── FormField (邮箱)
│   │       ├── FormField (密码)
│   │       ├── FormField (确认密码)
│   │       ├── Checkbox ("同意服务条款")
│   │       └── Button ("注册")
│   └── CardFooter
│       └── Link ("已有账户? 登录")
```

### 2. 主功能页面 (Dashboard)

#### 2.1 仪表板主页 (`/dashboard`)

**布局结构:**
```
DashboardLayout
├── Sidebar
│   ├── Logo
│   ├── Navigation
│   │   ├── NavItem ("仪表板", icon: Home)
│   │   ├── NavItem ("题目分析", icon: Upload)
│   │   ├── NavItem ("历史记录", icon: History)
│   │   └── NavItem ("个人资料", icon: User)
│   └── UserMenu
├── MainContent
│   ├── Header
│   │   ├── Breadcrumb
│   │   ├── Search
│   │   └── UserDropdown
│   └── DashboardContent
│       ├── StatsCards
│       │   ├── Card ("总分析次数")
│       │   ├── Card ("本月分析")
│       │   └── Card ("成功率")
│       ├── RecentActivity
│       │   └── Table (最近活动)
│       └── QuickActions
│           ├── Button ("上传新题目")
│           └── Button ("查看历史")
```

**使用的shadcn/ui组件:**
- `Sidebar`, `SidebarHeader`, `SidebarContent`, `SidebarFooter`
- `NavigationMenu`
- `Card`, `CardHeader`, `CardContent`
- `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`
- `Badge`
- `Button`
- `Avatar`
- `DropdownMenu`

#### 2.2 题目分析页面 (`/dashboard/analyze`)

**组件结构:**
```
AnalyzePage
├── PageHeader
│   ├── Title ("题目分析")
│   └── Description ("上传数学题目图片，获取相关题目推荐")
├── UploadSection
│   ├── Card
│   │   ├── CardHeader
│   │   │   ├── CardTitle ("上传题目图片")
│   │   │   └── CardDescription ("支持PNG、JPG格式，最大10MB")
│   │   └── CardContent
│   │       └── UploadZone
│   │           ├── UploadArea (拖拽上传区域)
│   │           ├── FileInput (隐藏的文件输入)
│   │           ├── Preview (图片预览)
│   │           └── UploadButton ("选择文件")
├── AnalysisSection
│   ├── Progress (分析进度)
│   ├── KnowledgePointSelection
│   │   ├── Card
│   │   │   ├── CardHeader ("AI识别的知识点")
│   │   │   └── CardContent
│   │   │       └── Badge (选中的知识点)
│   └── ResultsSection
│       ├── Card
│       │   ├── CardHeader ("推荐题目")
│       │   └── CardContent
│       │       └── ProblemList
│       │           ├── ProblemCard (题目1)
│       │           ├── ProblemCard (题目2)
│       │           └── ProblemCard (题目3)
```

**使用的shadcn/ui组件:**
- `Card`, `CardHeader`, `CardContent`
- `Button`
- `Progress`
- `Badge`
- `Separator`
- `Skeleton` (加载状态)
- `Alert` (错误提示)
- `Toast` (成功提示)

#### 2.3 历史记录页面 (`/dashboard/history`)

**组件结构:**
```
HistoryPage
├── PageHeader
│   ├── Title ("分析历史")
│   └── Actions
│       ├── SearchInput
│       ├── DateRangePicker
│       └── FilterDropdown
├── HistoryTable
│   ├── Table
│   │   ├── TableHeader
│   │   │   ├── TableHead ("日期")
│   │   │   ├── TableHead ("题目图片")
│   │   │   ├── TableHead ("知识点")
│   │   │   ├── TableHead ("推荐题目数")
│   │   │   ├── TableHead ("状态")
│   │   │   └── TableHead ("操作")
│   │   └── TableBody
│   │       └── TableRow[]
│   │           ├── TableCell (日期)
│   │           ├── TableCell (缩略图)
│   │           ├── TableCell (知识点)
│   │           ├── TableCell (数量)
│   │           ├── TableCell (状态徽章)
│   │           └── TableCell (操作按钮)
└── Pagination
    ├── PaginationContent
    ├── PaginationItem
    └── PaginationNext/Previous
```

**使用的shadcn/ui组件:**
- `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`
- `Input` (搜索)
- `Select` (筛选)
- `DatePicker` (日期范围)
- `Badge` (状态)
- `Button` (操作)
- `Pagination`
- `Avatar` (缩略图)

#### 2.4 个人资料页面 (`/dashboard/profile`)

**组件结构:**
```
ProfilePage
├── PageHeader
│   ├── Title ("个人资料")
│   └── Description ("管理您的账户信息和偏好设置")
├── ProfileForm
│   ├── Card
│   │   ├── CardHeader
│   │   │   ├── CardTitle ("基本信息")
│   │   │   └── CardDescription ("更新您的个人信息")
│   │   └── CardContent
│   │       └── Form
│   │           ├── FormField (头像上传)
│   │           ├── FormField (用户名)
│   │           ├── FormField (邮箱)
│   │           ├── FormField (手机号)
│   │           └── Button ("保存更改")
├── SecuritySection
│   ├── Card
│   │   ├── CardHeader
│   │   │   ├── CardTitle ("安全设置")
│   │   │   └── CardDescription ("管理您的账户安全")
│   │   └── CardContent
│   │       ├── ChangePasswordForm
│   │       │   ├── FormField (当前密码)
│   │       │   ├── FormField (新密码)
│   │       │   ├── FormField (确认新密码)
│   │       │   └── Button ("更改密码")
│   │       └── TwoFactorAuth
│   │           ├── Switch ("启用双因素认证")
│   │           └── QRCode (二维码)
└── PreferencesSection
    ├── Card
    │   ├── CardHeader
    │   │   ├── CardTitle ("偏好设置")
    │   │   └── CardDescription ("自定义您的使用体验")
    │   └── CardContent
    │       ├── Switch ("邮件通知")
    │       ├── Switch ("分析结果保存")
    │       ├── Select ("默认语言")
    │       └── Select ("主题模式")
```

**使用的shadcn/ui组件:**
- `Card`, `CardHeader`, `CardContent`
- `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`
- `Input`
- `Button`
- `Switch`
- `Select`
- `Avatar`
- `Separator`
- `Alert`

## 核心组件设计

### 1. 文件上传组件 (`UploadZone`)

```typescript
interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  onUpload: (file: File) => Promise<void>;
  accept?: string;
  maxSize?: number;
  preview?: boolean;
}
```

**功能特性:**
- 拖拽上传
- 文件类型验证
- 文件大小限制
- 图片预览
- 上传进度显示
- 错误处理

### 2. 分析进度组件 (`AnalysisProgress`)

```typescript
interface AnalysisProgressProps {
  currentStep: 'upload' | 'analyzing' | 'selecting' | 'complete';
  progress: number;
  message: string;
}
```

**功能特性:**
- 步骤指示器
- 进度条
- 状态消息
- 取消操作

### 3. 题目卡片组件 (`ProblemCard`)

```typescript
interface ProblemCardProps {
  problem: {
    id: string;
    title: string;
    content: string;
    difficulty: 'easy' | 'medium' | 'hard';
    tags: string[];
    similarity: number;
  };
  onView: (id: string) => void;
  onSave: (id: string) => void;
}
```

**功能特性:**
- 题目内容展示
- 难度标识
- 相似度评分
- 标签显示
- 操作按钮

### 4. 侧边栏导航组件 (`Sidebar`)

```typescript
interface SidebarProps {
  user: User;
  currentPath: string;
  onNavigate: (path: string) => void;
}
```

**功能特性:**
- 响应式设计
- 用户信息显示
- 导航菜单
- 折叠/展开
- 移动端适配

## 响应式设计

### 断点设置
- **移动端**: < 768px
- **平板**: 768px - 1024px
- **桌面**: > 1024px

### 适配策略
- 侧边栏在移动端变为抽屉式
- 表格在小屏幕上改为卡片布局
- 上传区域在移动端优化触摸体验
- 按钮和输入框适配移动端尺寸

## 主题设计

### 颜色方案
- **主色调**: 蓝色系 (#3B82F6)
- **辅助色**: 绿色系 (#10B981)
- **警告色**: 橙色系 (#F59E0B)
- **错误色**: 红色系 (#EF4444)
- **中性色**: 灰色系 (#6B7280)

### 暗色模式
- 支持系统主题切换
- 自动检测用户偏好
- 平滑过渡动画

## 性能优化

### 图片处理
- 客户端图片压缩
- 懒加载
- WebP格式支持
- 缩略图生成

### 状态管理
- 使用Zustand进行全局状态管理
- 本地存储用户偏好
- 缓存分析结果

### 加载优化
- 骨架屏加载
- 分页加载
- 虚拟滚动（长列表）
- 预加载关键资源

## 无障碍设计

### 键盘导航
- 完整的键盘导航支持
- 焦点管理
- 快捷键支持

### 屏幕阅读器
- 语义化HTML结构
- ARIA标签
- 替代文本

### 视觉辅助
- 高对比度模式
- 字体大小调整
- 颜色盲友好设计

## 安全考虑

### 文件上传
- 文件类型验证
- 文件大小限制
- 恶意文件检测
- 安全的文件存储

### 用户认证
- JWT令牌管理
- 会话超时
- 密码强度验证
- 双因素认证

### 数据保护
- HTTPS传输
- 数据加密
- 隐私政策
- GDPR合规

## 部署建议

### 构建优化
- Next.js App Router
- 代码分割
- 静态资源优化
- CDN部署

### 监控分析
- 错误追踪
- 性能监控
- 用户行为分析
- A/B测试支持

这个设计文档提供了完整的网站架构和组件设计，可以作为开发团队的参考指南。 
# AI助手网站

基于Next.js 15和shadcn/ui构建的AI助手网站，提供智能题目分析功能，集成PocketBase用户认证系统。

## 功能特点

- 🔍 **智能图片分析**: 使用AI分析数学题目图片
- 🌳 **知识点树映射**: 自动从知识点树中选择最相关的知识点
- 📚 **题目查询**: 根据知识点查询相关题目
- 🎯 **AI精选**: 从候选题目中精选出最相关的3个题目
- 🔧 **Function Calling**: 使用Google AI的Function Calling功能确保准确选择
- 👤 **用户认证**: 基于PocketBase的用户注册、登录和认证系统
- 📊 **分析历史**: 保存和查看历史分析记录
- 🎨 **现代UI**: 使用shadcn/ui组件库构建美观的用户界面
- 🚀 **API集成**: 完整的Next.js API Route后端服务

## 技术栈

- **前端框架**: Next.js 15 (App Router)
- **后端API**: Next.js API Routes
- **UI组件库**: shadcn/ui v4
- **样式**: Tailwind CSS v4
- **状态管理**: Zustand
- **表单处理**: React Hook Form + Zod
- **图标**: Lucide React
- **后端数据库**: PocketBase
- **文件上传**: React Dropzone
- **通知**: Sonner
- **主题**: next-themes
- **AI服务**: Google AI API
- **文件存储**: 本地存储 + 云存储支持

## 快速开始

### 前置要求

- Node.js 18+ 
- npm 或 yarn
- PocketBase (用于用户认证)
- Google AI API密钥 (用于AI分析功能)

### 安装依赖

```bash
npm install
```

### 配置PocketBase

1. 下载并启动PocketBase服务器：
```bash
# 启动PocketBase (项目已包含pocketbase二进制文件)
./pocketbase_0.28.4_darwin_arm64/pocketbase serve --http="127.0.0.1:8090" --dir="./pb_data"
```

2. 访问PocketBase管理界面：http://127.0.0.1:8090/_/
3. 创建管理员账户
4. 创建用户集合并配置认证设置

详细设置指南请参考：[POCKETBASE_SETUP.md](./POCKETBASE_SETUP.md)

### 配置环境变量

创建 `.env.local` 文件：

```env
# PocketBase配置
NEXT_PUBLIC_POCKETBASE_URL=http://127.0.0.1:8090

# Google AI API (用于AI分析功能)
GOOGLE_API_KEY=your_google_api_key_here

# 应用配置
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# 文件存储配置
UPLOAD_DIR=./public/uploads
MAX_FILE_SIZE=10485760
```

### 运行开发服务器

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看结果。

## 项目结构

```
src/
├── app/
│   ├── api/                  # Next.js API Routes
│   │   ├── analysis/         # 分析相关API
│   │   │   ├── route.ts      # 分析主API
│   │   │   ├── upload/       # 图片上传API
│   │   │   │   └── route.ts
│   │   │   └── [id]/         # 分析结果API
│   │   │       └── route.ts
│   │   ├── problems/         # 题目相关API
│   │   │   ├── route.ts      # 题目查询API
│   │   │   └── search/       # 题目搜索API
│   │   │       └── route.ts
│   │   ├── knowledge-points/ # 知识点API
│   │   │   └── route.ts
│   │   └── history/          # 历史记录API
│   │       └── route.ts
│   ├── (auth)/              # 认证相关页面
│   │   ├── login/           # 登录页面
│   │   └── register/        # 注册页面
│   ├── dashboard/           # 仪表板相关页面
│   │   ├── analyze/         # 题目分析页面
│   │   ├── history/         # 历史记录页面
│   │   ├── profile/         # 用户资料页面
│   │   ├── layout.tsx       # 仪表板布局
│   │   └── page.tsx         # 主仪表板页面
│   ├── demo/                # 演示页面
│   ├── test-upload/         # 测试上传页面
│   ├── layout.tsx           # 根布局
│   ├── page.tsx             # 首页
│   └── globals.css          # 全局样式
├── components/
│   ├── ui/                  # shadcn/ui组件
│   ├── auth/                # 认证组件
│   │   ├── auth-guard.tsx   # 认证守卫
│   │   ├── login-form.tsx   # 登录表单
│   │   └── register-form.tsx # 注册表单
│   ├── layout/              # 布局组件
│   │   ├── header.tsx       # 页面头部
│   │   └── sidebar.tsx      # 侧边栏
│   ├── upload/              # 上传组件
│   │   └── upload-zone.tsx  # 文件上传区域
│   ├── analysis/            # 分析组件
│   │   └── analysis-progress.tsx # 分析进度
│   ├── problems/            # 题目组件
│   │   └── problem-card.tsx # 题目卡片
│   ├── history/             # 历史组件
│   └── common/              # 通用组件
├── lib/
│   ├── api.ts               # API客户端
│   ├── auth-context.tsx     # 认证上下文
│   ├── pocketbase.ts        # PocketBase配置
│   ├── store.ts             # Zustand状态管理
│   ├── utils.ts             # 工具函数
│   └── ai.ts                # AI服务集成
└── types/
    └── index.ts             # TypeScript类型定义
```

## API文档

### 分析相关API

#### 1. 图片上传
```http
POST /api/analysis/upload
Content-Type: multipart/form-data

Response:
{
  "success": true,
  "data": {
    "id": "analysis_123",
    "imageUrl": "/uploads/image_123.jpg",
    "status": "uploaded"
  }
}
```

#### 2. 开始分析
```http
POST /api/analysis
Content-Type: application/json

{
  "imageId": "analysis_123"
}

Response:
{
  "success": true,
  "data": {
    "id": "analysis_123",
    "status": "processing",
    "progress": 0
  }
}
```

#### 3. 获取分析结果
```http
GET /api/analysis/[id]

Response:
{
  "success": true,
  "data": {
    "id": "analysis_123",
    "status": "completed",
    "knowledgePoint": "高中数学 -> 函数 -> 二次函数",
    "problems": [...],
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### 题目相关API

#### 1. 题目搜索
```http
GET /api/problems/search?knowledgePoint=二次函数&page=1&limit=10

Response:
{
  "success": true,
  "data": {
    "problems": [...],
    "total": 100,
    "page": 1,
    "limit": 10
  }
}
```

#### 2. 知识点查询
```http
GET /api/knowledge-points

Response:
{
  "success": true,
  "data": [
    {
      "id": "kp_1",
      "path": "高中数学 -> 函数",
      "title": "函数",
      "isLeaf": false,
      "children": [...]
    }
  ]
}
```

### 历史记录API

#### 1. 获取历史记录
```http
GET /api/history?page=1&limit=10

Response:
{
  "success": true,
  "data": {
    "records": [...],
    "total": 50,
    "page": 1,
    "limit": 10
  }
}
```

## 主要页面

### 1. 首页 (`/`)
- 产品介绍和功能特点展示
- 快速开始按钮
- 响应式设计

### 2. 登录页面 (`/login`)
- 用户登录表单
- 邮箱密码验证
- 记住我功能
- 表单验证和错误处理

### 3. 注册页面 (`/register`)
- 用户注册表单
- 密码确认验证
- 实时表单验证
- 注册成功后自动登录

### 4. 仪表板 (`/dashboard`)
- 统计概览
- 快速操作
- 最近活动
- 用户信息显示

### 5. 题目分析 (`/dashboard/analyze`)
- 图片上传功能
- AI分析进度显示
- 结果展示
- 知识点映射

### 6. 历史记录 (`/dashboard/history`)
- 分析历史列表
- 搜索和筛选功能
- 分页显示
- 状态标识

### 7. 个人资料 (`/dashboard/profile`)
- 用户信息管理
- 头像上传
- 安全设置
- 偏好配置

## 核心组件

### 认证组件
- `AuthGuard`: 路由保护组件
- `LoginForm`: 登录表单组件
- `RegisterForm`: 注册表单组件

### 上传组件
- `UploadZone`: 文件上传区域
- 拖拽上传支持
- 图片预览功能
- 文件类型验证

### 分析组件
- `AnalysisProgress`: 分析进度显示
- 步骤指示器
- 进度条和状态
- 实时更新

### 题目组件
- `ProblemCard`: 题目卡片
- 相似度评分显示
- 难度标识
- 详细信息展示

## 状态管理

使用Zustand进行全局状态管理：

- `useAuthStore`: 用户认证状态
  - 用户信息管理
  - 登录/登出功能
  - 认证状态持久化
- `useAnalysisStore`: 分析进度状态
  - 当前分析结果
  - 分析进度
  - 分析状态管理

## API集成

项目集成了以下API和服务：

- **PocketBase**: 用户认证和数据库
- **Google AI API**: 用于AI分析功能
- **知识点树API**: 获取知识点数据
- **题目查询API**: 获取相关题目
- **Next.js API Routes**: 自定义后端API

## 数据库设计

### 用户表 (users)
- `id`: 用户唯一标识
- `email`: 邮箱地址
- `name`: 用户名
- `avatar`: 头像文件
- `created`: 创建时间
- `updated`: 更新时间

### 分析记录表 (analysis_records)
- `id`: 记录唯一标识
- `userId`: 用户ID
- `imageUrl`: 图片URL
- `knowledgePoint`: 知识点
- `problems`: 相关题目
- `status`: 分析状态
- `createdAt`: 创建时间

## 部署

### 构建生产版本

```bash
npm run build
```

### 启动生产服务器

```bash
npm start
```

### 部署注意事项

1. **PocketBase服务器**: 需要单独部署PocketBase服务器
2. **环境变量**: 确保生产环境变量正确配置
3. **域名配置**: 配置自定义域名和SSL证书
4. **数据库备份**: 定期备份PocketBase数据
5. **文件存储**: 配置生产环境的文件存储
6. **API密钥**: 确保Google AI API密钥安全配置

## 开发指南

### 添加新API Route

1. 在 `src/app/api/` 下创建新的路由文件
2. 实现GET、POST、PUT、DELETE等方法
3. 添加错误处理和状态码
4. 编写API文档

### 添加新组件

1. 在 `src/components/` 下创建新组件
2. 使用shadcn/ui组件作为基础
3. 添加TypeScript类型定义
4. 编写单元测试

### 添加新页面

1. 在 `src/app/` 下创建页面文件
2. 使用App Router语法
3. 添加页面元数据
4. 实现响应式设计

### 样式指南

- 使用Tailwind CSS v4类名
- 遵循shadcn/ui设计规范
- 支持暗色模式
- 确保无障碍访问

### 认证开发

- 使用PocketBase进行用户认证
- 实现JWT令牌管理
- 添加路由保护
- 处理认证错误

### API开发规范

- 使用TypeScript确保类型安全
- 统一的错误处理格式
- 标准化的响应格式
- 完善的API文档

## 故障排除

### 常见问题

1. **PocketBase连接失败**
   - 检查PocketBase服务器是否运行
   - 验证环境变量配置
   - 检查网络连接

2. **认证问题**
   - 确认用户已注册
   - 检查密码是否正确
   - 查看浏览器控制台错误

3. **AI分析失败**
   - 验证Google AI API密钥
   - 检查网络连接
   - 查看API响应

4. **文件上传失败**
   - 检查文件大小限制
   - 验证文件类型
   - 确认存储目录权限

5. **API Route错误**
   - 检查路由配置
   - 验证请求方法
   - 查看服务器日志

## 贡献指南

1. Fork项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建Pull Request

## 许可证

MIT License

## 联系方式

如有问题或建议，请提交Issue或联系开发团队。

## 相关文档

- [PocketBase设置指南](./POCKETBASE_SETUP.md)
- [项目结构说明](./PROJECT_STRUCTURE.md)
- [实现总结](./IMPLEMENTATION_SUMMARY.md)
- [最终总结](./FINAL_SUMMARY.md) 
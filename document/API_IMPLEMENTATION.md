# API实现说明

## 概述

本项目已经实现了完整的Next.js API Route后端服务，集成了Google AI API进行智能题目分析，并支持数学公式的HTML渲染。

## 环境变量配置

在项目根目录创建 `.env.local` 文件：

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

## API实现

### 1. 图片上传API (`/api/analysis/upload`)

- **方法**: POST
- **功能**: 处理图片文件上传
- **文件限制**: 最大10MB，仅支持图片格式
- **存储**: 保存到 `public/uploads/` 目录
- **文件命名**: 使用完整文件名（包含扩展名）作为ID

### 2. 分析API (`/api/analysis`)

- **方法**: POST
- **功能**: 调用Google AI API分析图片
- **参数**: 
  - `imageId`: 完整文件名（包含扩展名）
- **流程**:
  1. 直接使用imageId构建文件路径
  2. 获取知识点树
  3. 使用AI识别知识点
  4. 查询相关题目
  5. AI精选最相关题目

### 3. 知识点API (`/api/knowledge-points`)

- **方法**: GET
- **功能**: 获取知识点树数据
- **数据源**: 外部API (qms.stzy.com)

## 核心功能

### AI分析流程

1. **图片上传**: 用户上传数学题目图片
2. **文件处理**: 生成包含扩展名的完整文件名
3. **知识点识别**: 使用Google AI API分析图片内容，从知识点树中选择最相关的知识点
4. **题目查询**: 根据识别的知识点查询相关题目
5. **AI精选**: 从候选题目中精选出最相关的3个题目
6. **结果返回**: 返回分析结果和推荐题目

### 数学公式渲染

项目集成了KaTeX数学公式渲染功能：

- **KaTeX组件**: `src/components/ui/katex-html-renderer.tsx`
- **支持格式**: LaTeX数学公式语法
- **渲染模式**: 行内公式 (`$...$`) 和块级公式 (`$$...$$`)
- **HTML兼容**: 支持在HTML内容中渲染数学公式

### 技术特点

- **Function Calling**: 使用Google AI的Function Calling功能确保准确选择
- **错误处理**: 完善的错误处理和状态码
- **类型安全**: 使用TypeScript确保类型安全
- **文件管理**: 安全的文件上传和管理
- **扩展名兼容**: 支持PNG、JPG等多种图片格式
- **数学公式**: 完整的LaTeX数学公式渲染支持

## 文件扩展名处理

### 问题解决

之前的实现中，分析API使用固定的`.jpg`扩展名构建文件路径，导致PNG格式的图片无法正确找到。现在已完全修复：

1. **上传API**: 返回完整文件名（包含扩展名）作为ID
2. **分析API**: 直接使用完整文件名构建路径，无需额外处理扩展名
3. **前端调用**: 简化API调用，直接传递文件ID

### 文件命名示例

- PNG文件: `analysis_1752990675065_kbfyioq7nok.png`
- JPG文件: `analysis_1752990675065_kbfyioq7nok.jpg`
- 其他格式: `analysis_1752990675065_kbfyioq7nok.{扩展名}`

### 支持的格式

- PNG (.png)
- JPEG (.jpg, .jpeg)
- GIF (.gif)
- WebP (.webp)
- 其他浏览器支持的图片格式

## 前端渲染

### 数学公式渲染

项目使用KaTeX来渲染数学公式：

```tsx
import KatexHtmlRenderer from "@/components/ui/katex-html-renderer"

// 在组件中使用
<KatexHtmlRenderer 
  html={problem.content} 
  className="text-base leading-relaxed"
/>
```

### 支持的数学公式语法

- **行内公式**: `$x^2 + y^2 = z^2$`
- **块级公式**: `$$\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}$$`
- **希腊字母**: `$\alpha, \beta, \gamma, \pi$`
- **上下标**: `$x^2, x_i, x_{i+1}$`
- **分数**: `$\frac{a}{b}, \dfrac{a}{b}$`
- **根号**: `$\sqrt{x}, \sqrt[n]{x}$`
- **积分**: `$\int, \iint, \iiint$`
- **求和**: `$\sum_{i=1}^{n} x_i$`

### 页面结构

1. **分析页面** (`/dashboard/analyze`): 上传图片并获取推荐题目
2. **问题详情页面** (`/dashboard/problem/[id]`): 显示完整的题目内容和数学公式
3. **问题卡片组件**: 在列表中显示题目预览

## 测试

访问 `/test-api` 页面可以测试API功能：

1. **测试上传和分析API**: 创建测试图片并调用分析流程
2. **测试知识点API**: 获取知识点树数据

## 部署注意事项

1. **Google AI API密钥**: 确保生产环境正确配置API密钥
2. **文件存储**: 配置生产环境的文件存储路径
3. **CORS配置**: 如果需要跨域访问，配置相应的CORS设置
4. **错误监控**: 建议添加错误监控和日志记录
5. **文件权限**: 确保上传目录有正确的读写权限
6. **KaTeX依赖**: 确保KaTeX依赖正确安装

## 故障排除

### 常见问题

1. **Google AI API错误**
   - 检查API密钥是否正确
   - 确认API配额是否充足
   - 查看网络连接

2. **文件上传失败**
   - 检查文件大小限制
   - 确认存储目录权限
   - 验证文件格式

3. **分析失败**
   - 检查图片质量
   - 确认知识点树API可用性
   - 查看服务器日志
   - 检查文件路径是否正确

4. **文件扩展名问题**
   - 确保上传API返回完整的文件名
   - 检查分析API是否正确使用文件ID
   - 验证文件路径构建是否正确

5. **数学公式渲染问题**
   - 检查KaTeX依赖是否正确安装
   - 确认HTML内容包含正确的LaTeX语法
   - 查看浏览器控制台是否有渲染错误

## 扩展功能

### 可扩展的API

1. **历史记录API**: 保存和查询分析历史
2. **用户偏好API**: 管理用户分析偏好
3. **批量分析API**: 支持批量图片分析
4. **导出功能API**: 支持结果导出

### 性能优化

1. **缓存机制**: 缓存知识点树和常用题目
2. **异步处理**: 长时间分析任务异步处理
3. **CDN集成**: 图片文件CDN加速
4. **数据库优化**: 优化查询性能

## 开发指南

### 添加新API

1. 在 `src/app/api/` 下创建新的路由文件
2. 实现相应的HTTP方法
3. 添加错误处理和类型定义
4. 更新API文档

### 调试技巧

1. 使用 `/test-api` 页面测试API
2. 查看浏览器开发者工具的网络面板
3. 检查服务器控制台日志
4. 使用Postman等工具测试API

### 数学公式开发

1. **添加新的数学公式**: 使用标准的LaTeX语法
2. **自定义样式**: 通过CSS自定义KaTeX样式
3. **错误处理**: 处理数学公式渲染错误
4. **性能优化**: 考虑数学公式的渲染性能

## 相关文件

- `src/lib/ai.ts`: AI服务集成
- `src/lib/api.ts`: API客户端
- `src/app/api/`: API路由实现
- `src/app/dashboard/analyze/page.tsx`: 分析页面
- `src/app/dashboard/problem/[id]/page.tsx`: 问题详情页面
- `src/app/test-api/page.tsx`: API测试页面
- `src/components/ui/katex-html-renderer.tsx`: KaTeX渲染组件
- `src/components/problems/problem-card.tsx`: 问题卡片组件 
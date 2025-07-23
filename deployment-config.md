# 部署配置说明

## 环境变量配置

### 1. 基础环境变量

在 Render 平台部署时，需要设置以下环境变量：

```bash
# 应用端口号
PORT=10000

# PocketBase 服务器地址
NEXT_PUBLIC_POCKETBASE_URL=https://pocketbase-0-29-0.onrender.com

# Google AI API 密钥
GOOGLE_API_KEY=your_google_api_key_here

# 应用基础URL
NEXT_PUBLIC_APP_URL=https://your-app-name.onrender.com

# API基础URL (可选，会自动根据PORT生成)
NEXT_PUBLIC_API_URL=https://your-app-name.onrender.com/api
```

### 2. 本地开发配置

创建 `.env.local` 文件：

```bash
# 应用端口号
PORT=10000

# PocketBase 配置
NEXT_PUBLIC_POCKETBASE_URL=https://pocketbase-0-29-0.onrender.com

# Google AI API 配置
GOOGLE_API_KEY=your_google_api_key_here

# 其他配置
NEXT_PUBLIC_APP_URL=http://localhost:10000
```

### 3. 端口配置说明

- **本地开发**：默认使用端口 3000，可通过 `PORT` 环境变量修改
- **远程部署**：使用端口 10000，通过 `PORT=10000` 环境变量设置
- **API URL**：会自动根据端口号生成，格式为 `http://localhost:${PORT}/api`

## PocketBase 配置

### 1. PocketBase 数据库设置

确保 PocketBase 数据库中有以下集合：

#### users 集合
```json
{
  "id": "string",
  "email": "string",
  "name": "string", 
  "avatar": "string (optional)",
  "created": "datetime",
  "updated": "datetime"
}
```

#### 权限设置
- 用户注册：允许未认证用户创建
- 用户登录：允许认证用户读取自己的记录
- 用户更新：允许认证用户更新自己的记录

### 2. 连接测试

可以通过以下方式测试连接：

```javascript
// 在浏览器控制台测试
import { pb } from '@/lib/pocketbase'

// 测试连接
pb.health.check().then(() => {
  console.log('PocketBase 连接成功')
}).catch(error => {
  console.error('PocketBase 连接失败:', error)
})
```

### 3. 错误处理

系统现在包含以下错误处理：

- 连接失败检测
- 网络错误处理
- 用户友好的错误消息
- 自动重试机制

### 4. 安全注意事项

- 确保 HTTPS 连接
- 验证 CORS 设置
- 检查 PocketBase 安全配置
- 定期备份数据库

## 部署步骤

### 1. Render 平台配置

1. 在 Render 控制台设置环境变量：
   ```
   PORT=10000
   NEXT_PUBLIC_POCKETBASE_URL=https://pocketbase-0-29-0.onrender.com
   GOOGLE_API_KEY=your_google_api_key_here
   ```

2. 确保构建命令正确：
   ```bash
   npm install && npm run build
   ```

3. 设置启动命令：
   ```bash
   npm start
   ```

### 2. 验证部署

1. 检查应用是否在端口 10000 上运行
2. 测试用户注册和登录功能
3. 验证 API 端点是否正常工作
4. 检查 PocketBase 连接状态

### 3. 监控和日志

- 监控应用性能
- 检查错误日志
- 验证数据库连接
- 测试所有功能模块 
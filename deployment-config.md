# 部署配置说明

## PocketBase 配置

### 1. 环境变量设置

在 Render 平台部署时，需要设置以下环境变量：

```bash
# PocketBase 服务器地址
NEXT_PUBLIC_POCKETBASE_URL=https://pocketbase-0-29-0.onrender.com

# Google AI API 密钥
GOOGLE_API_KEY=your_google_api_key_here

# 应用基础URL
NEXT_PUBLIC_APP_URL=https://your-app-name.onrender.com
```

### 2. 本地开发配置

创建 `.env.local` 文件：

```bash
# PocketBase 配置
NEXT_PUBLIC_POCKETBASE_URL=https://pocketbase-0-29-0.onrender.com

# Google AI API 配置
GOOGLE_API_KEY=your_google_api_key_here

# 其他配置
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. PocketBase 数据库设置

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

### 4. 连接测试

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

### 5. 错误处理

系统现在包含以下错误处理：

- 连接失败检测
- 网络错误处理
- 用户友好的错误消息
- 自动重试机制

### 6. 安全注意事项

- 确保 HTTPS 连接
- 验证 CORS 设置
- 检查 PocketBase 安全配置
- 定期备份数据库 
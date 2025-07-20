# PocketBase 设置指南

## 概述

本指南将帮助您设置PocketBase作为AI助手网站的用户认证和数据库后端。

## 1. 下载PocketBase

### 方法一：直接下载
访问 [PocketBase官网](https://pocketbase.io/docs/) 下载适合您操作系统的版本。

### 方法二：使用包管理器
```bash
# macOS (使用Homebrew)
brew install pocketbase

# 或者手动下载
curl -L https://github.com/pocketbase/pocketbase/releases/download/v0.22.0/pocketbase_0.22.0_darwin_amd64.zip -o pocketbase.zip
unzip pocketbase.zip
```

## 2. 启动PocketBase服务器

```bash
# 进入项目目录
cd /Users/yaoke/problem_helper

# 创建PocketBase数据目录
mkdir -p pb_data

# 启动PocketBase服务器
./pocketbase serve --http="127.0.0.1:8090" --dir="./pb_data"
```

## 3. 配置PocketBase

### 3.1 访问管理界面
打开浏览器访问：http://127.0.0.1:8090/_/

### 3.2 创建管理员账户
1. 点击 "Create your first admin account"
2. 填写管理员信息：
   - Email: admin@example.com
   - Password: your_secure_password
   - Password Confirm: your_secure_password

### 3.3 创建用户集合
1. 在管理界面中，点击 "Collections"
2. 点击 "New collection"
3. 创建名为 "users" 的集合
4. 配置字段：

#### 必需字段：
- `email` (type: email, required: true, unique: true)
- `password` (type: password, required: true)
- `passwordConfirm` (type: password, required: true)
- `name` (type: text, required: true)

#### 可选字段：
- `avatar` (type: file, single file)

### 3.4 配置认证设置
1. 在 "users" 集合设置中
2. 启用 "Auth" 选项
3. 配置认证规则：
   - 允许注册：是
   - 允许登录：是
   - 需要邮箱验证：否（开发环境）
   - 密码最小长度：6

## 4. 环境变量配置

创建或更新 `.env.local` 文件：

```env
# PocketBase配置
NEXT_PUBLIC_POCKETBASE_URL=http://127.0.0.1:8090

# Google AI API (用于AI分析功能)
GOOGLE_API_KEY=your_google_api_key_here
```

## 5. 安装PocketBase客户端

```bash
npm install pocketbase
```

## 6. 测试认证功能

### 6.1 启动开发服务器
```bash
npm run dev
```

### 6.2 测试注册功能
1. 访问 http://localhost:3000/register
2. 填写注册信息
3. 提交注册表单

### 6.3 测试登录功能
1. 访问 http://localhost:3000/login
2. 使用注册的邮箱和密码登录
3. 验证登录成功

## 7. 数据存储说明

### 7.1 用户数据存储
- **位置**: PocketBase数据库 (`pb_data/data.db`)
- **表**: `users`
- **字段**:
  - `id`: 用户唯一标识
  - `email`: 邮箱地址
  - `name`: 用户名
  - `avatar`: 头像文件
  - `created`: 创建时间
  - `updated`: 更新时间

### 7.2 认证状态管理
- **前端**: Zustand状态管理 + localStorage
- **后端**: PocketBase JWT令牌
- **持久化**: 浏览器localStorage存储用户信息

## 8. 安全配置

### 8.1 生产环境配置
```env
# 生产环境PocketBase URL
NEXT_PUBLIC_POCKETBASE_URL=https://your-pocketbase-domain.com

# 启用HTTPS
# 配置域名和SSL证书
```

### 8.2 安全最佳实践
1. **密码策略**: 设置强密码要求
2. **邮箱验证**: 生产环境启用邮箱验证
3. **速率限制**: 配置登录尝试限制
4. **HTTPS**: 生产环境使用HTTPS
5. **备份**: 定期备份PocketBase数据

## 9. 故障排除

### 9.1 常见问题

#### 问题1: PocketBase连接失败
**解决方案**:
```bash
# 检查PocketBase是否运行
curl http://127.0.0.1:8090/api/health

# 检查端口是否被占用
lsof -i :8090
```

#### 问题2: 注册失败
**解决方案**:
1. 检查PocketBase用户集合配置
2. 验证字段名称和类型
3. 检查认证设置

#### 问题3: 登录失败
**解决方案**:
1. 确认用户已注册
2. 检查密码是否正确
3. 查看浏览器控制台错误信息

### 9.2 调试技巧
```bash
# 查看PocketBase日志
tail -f pb_data/logs/pocketbase.log

# 重置PocketBase数据（开发环境）
rm -rf pb_data
./pocketbase serve --http="127.0.0.1:8090" --dir="./pb_data"
```

## 10. 部署指南

### 10.1 本地部署
```bash
# 启动PocketBase
./pocketbase serve --http="127.0.0.1:8090" --dir="./pb_data"

# 启动Next.js应用
npm run dev
```

### 10.2 生产部署
1. **PocketBase服务器**: 部署到VPS或云服务器
2. **Next.js应用**: 部署到Vercel、Netlify等平台
3. **域名配置**: 配置自定义域名和SSL证书
4. **环境变量**: 设置生产环境变量

## 11. 扩展功能

### 11.1 添加用户角色
1. 在PocketBase中创建角色集合
2. 配置用户-角色关联
3. 实现基于角色的权限控制

### 11.2 添加用户资料
1. 扩展用户集合字段
2. 创建用户资料页面
3. 实现资料编辑功能

### 11.3 添加分析历史
1. 创建分析记录集合
2. 关联用户和分析记录
3. 实现历史记录功能

## 总结

通过PocketBase，我们实现了：
- ✅ 用户注册和登录
- ✅ 安全的密码存储
- ✅ JWT令牌认证
- ✅ 用户数据持久化
- ✅ 响应式用户界面
- ✅ 错误处理和用户反馈

这个设置为AI助手网站提供了完整的用户认证系统，可以安全地存储用户信息并管理用户会话。 
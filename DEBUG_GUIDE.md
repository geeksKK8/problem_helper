# 登录问题调试指南

## 🔍 问题描述

用户遇到 "ClientResponseError 400: Failed to authenticate" 错误，无法登录系统。

## 🛠️ 调试工具

我们已经在代码中添加了详细的调试信息，帮助你调查登录问题。

### 1. 自动调试信息

当页面加载和登录时，控制台会自动显示以下信息：

- **环境变量配置**
- **PocketBase连接状态**
- **API配置信息**
- **登录流程详情**
- **错误详情和堆栈**

### 2. 手动调试工具

在浏览器控制台中，你可以使用以下命令进行调试：

#### 显示环境变量
```javascript
debugTools.showEnvironmentVariables()
```

#### 测试网络连接
```javascript
debugTools.testNetworkConnections()
```

#### 测试PocketBase认证
```javascript
debugTools.testPocketBaseAuth('your-email@example.com', 'your-password')
```

#### 生成完整调试报告
```javascript
debugTools.generateDebugReport('your-email@example.com', 'your-password')
```

## 🔧 调试步骤

### 步骤1: 检查环境变量
1. 打开浏览器开发者工具 (F12)
2. 切换到 Console 标签
3. 运行: `debugTools.showEnvironmentVariables()`
4. 检查以下关键配置：
   - `NEXT_PUBLIC_POCKETBASE_URL` 是否正确
   - `NEXT_PUBLIC_API_URL` 是否正确
   - `NODE_ENV` 是否为 production

### 步骤2: 测试网络连接
1. 运行: `debugTools.testNetworkConnections()`
2. 检查 PocketBase 和 Next.js API 是否可访问
3. 注意响应时间和状态码

### 步骤3: 测试认证流程
1. 运行: `debugTools.testPocketBaseAuth('email', 'password')`
2. 使用真实的用户名和密码
3. 观察认证过程中的每个步骤

### 步骤4: 分析错误信息
如果仍然失败，查看控制台中的详细错误信息：
- 错误类型和消息
- 网络请求详情
- PocketBase 状态信息

## 🚨 常见问题排查

### 问题1: 环境变量未正确加载
**症状**: 控制台显示环境变量为 undefined
**解决**: 检查 `.env.local` 文件是否正确配置

### 问题2: PocketBase 无法连接
**症状**: 健康检查失败
**解决**: 
- 检查 PocketBase 服务是否运行
- 验证端口 8090 是否开放
- 确认防火墙配置

### 问题3: 网络请求被阻止
**症状**: CORS 错误或网络超时
**解决**:
- 检查服务器网络配置
- 验证域名和端口设置
- 确认反向代理配置

### 问题4: 认证参数错误
**症状**: 400 错误但网络连接正常
**解决**:
- 验证用户名密码格式
- 检查 PocketBase 用户集合配置
- 确认认证规则设置

## 📋 调试检查清单

- [ ] 环境变量正确加载
- [ ] PocketBase 服务可访问
- [ ] Next.js API 可访问
- [ ] 网络连接正常
- [ ] 认证参数正确
- [ ] 错误日志完整

## 🔍 日志分析

### 成功登录的日志特征
```
✅ PocketBase连接正常，继续登录流程
✅ PocketBase认证成功
✅ 登录流程完成，返回用户数据
```

### 失败登录的日志特征
```
❌ PocketBase连接检查失败
❌ 登录流程失败
❌ 认证测试失败
```

## 📞 获取帮助

如果调试后仍然无法解决问题，请提供以下信息：

1. 完整的控制台日志
2. 环境变量配置
3. 网络连接测试结果
4. 错误截图或描述
5. 服务器配置信息

## 🎯 预期结果

使用这些调试工具后，你应该能够：

1. **准确定位问题**: 知道是网络、配置还是认证问题
2. **快速验证修复**: 确认修改后的配置是否正确
3. **提供详细报告**: 为技术支持提供完整的错误信息
4. **预防类似问题**: 了解系统的运行状态和配置

---

**注意**: 调试工具包含敏感信息，请在生产环境中谨慎使用，并确保不会泄露到日志文件中。 
# PocketBase Auto-Cancellation 错误分析与解决方案

## 🐛 错误描述

在打开历史记录详情页面时，在 `src/lib/api.ts` 第468行发生报错：
```
The request was autocancelled. You can find more info in https://github.com/pocketbase/js-sdk#auto-cancellation.
```

## 🔍 错误分析

### 错误发生位置
**文件**：`src/lib/api.ts` 第468行附近
**方法**：`getAnalysisHistoryDetail()`
**具体代码**：
```typescript
const record = await pb.collection('analysis_history').getOne(id, {
  filter: `user = "${pb.authStore.model!.id}"`
})
```

### PocketBase Auto-Cancellation 机制

PocketBase JS SDK 有一个自动取消机制，会在以下情况下自动取消请求：

1. **重复请求**：对同一个资源同时发起多个请求时，旧请求会被自动取消
2. **快速导航**：用户快速切换页面或路由时，未完成的请求会被取消
3. **组件卸载**：React组件卸载时，正在进行的请求可能被取消
4. **认证状态变化**：用户登录状态发生变化时，请求可能被取消

## 🎯 可能的触发场景

### 1. 快速点击详情链接
用户快速多次点击历史记录的"查看"按钮，导致多个相同的API请求同时发起。

### 2. 路由快速切换
用户在页面加载过程中快速导航到其他页面，导致请求被取消。

### 3. 组件重新渲染
React组件因为某些原因重新渲染，导致useEffect重新执行，新请求取消了旧请求。

### 4. 认证状态刷新
在请求过程中，认证token被刷新，导致请求被取消。

## ✅ 解决方案

### 方案1：添加请求去重机制

**文件**：`src/app/dashboard/history/[id]/page.tsx`

```typescript
// 加载历史记录详情
useEffect(() => {
  let isCancelled = false; // 添加取消标志

  const loadHistoryDetail = async () => {
    try {
      setLoading(true)
      setError(null)

      const result = await apiClient.getAnalysisHistoryDetail(historyId)
      
      // 检查请求是否被取消
      if (isCancelled) return;
      
      if (result.success && result.data) {
        setRecord(result.data)
      } else {
        setError(result.error || '获取历史记录详情失败')
      }
    } catch (error) {
      // 检查请求是否被取消
      if (isCancelled) return;
      
      console.error('加载历史记录详情失败:', error)
      // 忽略自动取消错误
      if (error instanceof Error && error.message.includes('autocancelled')) {
        console.log('请求被自动取消，这是正常现象')
        return;
      }
      setError(error instanceof Error ? error.message : '加载历史记录详情失败')
    } finally {
      if (!isCancelled) {
        setLoading(false)
      }
    }
  }

  if (historyId) {
    loadHistoryDetail()
  }

  // 清理函数：标记请求为已取消
  return () => {
    isCancelled = true;
  }
}, [historyId])
```

### 方案2：使用AbortController

```typescript
useEffect(() => {
  const abortController = new AbortController();

  const loadHistoryDetail = async () => {
    try {
      setLoading(true)
      setError(null)

      // 这里我们不能直接给PocketBase传递signal，
      // 但可以在组件卸载时进行状态检查
      const result = await apiClient.getAnalysisHistoryDetail(historyId)
      
      // 检查是否已被中止
      if (abortController.signal.aborted) return;
      
      if (result.success && result.data) {
        setRecord(result.data)
      } else {
        setError(result.error || '获取历史记录详情失败')
      }
    } catch (error) {
      if (abortController.signal.aborted) return;
      
      console.error('加载历史记录详情失败:', error)
      
      // 忽略自动取消错误
      if (error instanceof Error && error.message.includes('autocancelled')) {
        console.log('请求被自动取消，这是正常现象')
        return;
      }
      
      setError(error instanceof Error ? error.message : '加载历史记录详情失败')
    } finally {
      if (!abortController.signal.aborted) {
        setLoading(false)
      }
    }
  }

  if (historyId) {
    loadHistoryDetail()
  }

  // 清理函数
  return () => {
    abortController.abort();
  }
}, [historyId])
```

### 方案3：改进API客户端错误处理

**文件**：`src/lib/api.ts`

```typescript
async getAnalysisHistoryDetail(id: string): Promise<{
  success: boolean
  data?: { /* ... */ }
  error?: string
}> {
  try {
    if (!pb.authStore.isValid) {
      throw new Error('用户未登录')
    }

    const record = await pb.collection('analysis_history').getOne(id, {
      filter: `user = "${pb.authStore.model!.id}"`
    })

    return {
      success: true,
      data: {
        // ... 数据映射
      }
    }
  } catch (error) {
    console.error('获取分析历史详情失败:', error)
    
    // 特殊处理自动取消错误
    if (error instanceof Error && error.message.includes('autocancelled')) {
      console.log('PocketBase请求被自动取消')
      return {
        success: false,
        error: 'REQUEST_CANCELLED'
      }
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : '获取分析历史详情失败'
    }
  }
}
```

### 方案4：添加请求重试机制

```typescript
async getAnalysisHistoryDetail(id: string, retryCount = 0): Promise<{
  success: boolean
  data?: { /* ... */ }
  error?: string
}> {
  try {
    if (!pb.authStore.isValid) {
      throw new Error('用户未登录')
    }

    const record = await pb.collection('analysis_history').getOne(id, {
      filter: `user = "${pb.authStore.model!.id}"`
    })

    return {
      success: true,
      data: { /* ... */ }
    }
  } catch (error) {
    console.error('获取分析历史详情失败:', error)
    
    // 如果是自动取消错误且重试次数少于2次，则重试
    if (error instanceof Error && 
        error.message.includes('autocancelled') && 
        retryCount < 2) {
      console.log(`请求被取消，进行第${retryCount + 1}次重试...`)
      await new Promise(resolve => setTimeout(resolve, 100 * (retryCount + 1)))
      return this.getAnalysisHistoryDetail(id, retryCount + 1)
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : '获取分析历史详情失败'
    }
  }
}
```

## 🛡️ 最佳实践建议

### 1. 前端处理
- 在组件中添加请求取消逻辑
- 忽略自动取消错误，避免不必要的错误提示
- 使用防抖机制避免重复请求

### 2. 用户体验
- 添加加载状态指示器
- 对于快速操作给出适当的反馈
- 避免在加载过程中允许重复操作

### 3. 错误处理
- 区分真正的错误和自动取消
- 对用户友好的错误消息
- 适当的重试机制

## 🎯 推荐解决方案

**立即实施**：方案1 + 方案3的组合
1. 在组件中添加取消标志，避免已卸载组件的状态更新
2. 在API客户端中特殊处理自动取消错误
3. 对用户隐藏自动取消错误，避免不必要的困扰

**长期优化**：
1. 实施请求去重机制
2. 添加适当的重试逻辑
3. 改进用户交互流程，减少快速操作

## 🔗 参考资料

- [PocketBase JS SDK Auto-Cancellation](https://github.com/pocketbase/js-sdk#auto-cancellation)
- [React useEffect Cleanup](https://react.dev/reference/react/useEffect#removing-unnecessary-effect-dependencies)
- [AbortController MDN](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)

这个错误通常不会影响应用的正常功能，但正确处理可以提供更好的用户体验。 
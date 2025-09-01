// 调试工具 - 用于调查登录问题
export const debugTools = {
  // 显示所有环境变量
  showEnvironmentVariables() {
    console.log('🔍 环境变量调试信息:')
    console.log('  - NODE_ENV:', process.env.NODE_ENV)
    console.log('  - NEXT_PUBLIC_POCKETBASE_URL:', process.env.NEXT_PUBLIC_POCKETBASE_URL)
    console.log('  - NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL)
    console.log('  - PORT:', process.env.PORT)
    console.log('  - GOOGLE_API_KEY:', process.env.GOOGLE_API_KEY ? '已设置' : '未设置')
    console.log('  - UPLOAD_DIR:', process.env.UPLOAD_DIR)
    console.log('  - MAX_FILE_SIZE:', process.env.MAX_FILE_SIZE)
    console.log('  - 当前时间:', new Date().toISOString())
    console.log('  - 用户代理:', navigator.userAgent)
    console.log('  - 当前URL:', window.location.href)
    console.log('  - 当前域名:', window.location.hostname)
    console.log('  - 当前端口:', window.location.port)
  },

  // 测试网络连接
  async testNetworkConnections() {
    console.log('🔍 开始网络连接测试...')
    
    const tests = [
      {
        name: 'PocketBase健康检查',
        url: process.env.NEXT_PUBLIC_POCKETBASE_URL + '/api/health',
        description: '测试PocketBase服务是否可访问'
      },
      {
        name: 'Next.js API测试',
        url: process.env.NEXT_PUBLIC_API_URL + '/health',
        description: '测试Next.js API是否可访问'
      }
    ]

    for (const test of tests) {
      try {
        console.log(`🔍 测试: ${test.name}`)
        console.log(`  - 测试URL: ${test.url}`)
        console.log(`  - 描述: ${test.description}`)
        console.log(`  - 开始时间: ${new Date().toISOString()}`)
        
        const startTime = Date.now()
        const response = await fetch(test.url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        const endTime = Date.now()
        const duration = endTime - startTime
        
        console.log(`✅ ${test.name} 成功:`)
        console.log(`  - 状态码: ${response.status}`)
        console.log(`  - 响应时间: ${duration}ms`)
        console.log(`  - 完成时间: ${new Date().toISOString()}`)
        
        if (response.ok) {
          try {
            const data = await response.json()
            console.log(`  - 响应数据:`, data)
          } catch (e) {
            console.log(`  - 响应数据: 非JSON格式`)
          }
        }
      } catch (error: unknown) {
        console.error(`❌ ${test.name} 失败:`)
        console.error(`  - 错误类型: ${error instanceof Error ? error.constructor?.name : typeof error}`)
        console.error(`  - 错误消息: ${error instanceof Error ? error.message : String(error)}`)
        console.error(`  - 错误详情:`, error)
        console.error(`  - 失败时间: ${new Date().toISOString()}`)
      }
      console.log('---')
    }
  },

  // 测试PocketBase认证
  async testPocketBaseAuth(email: string, password: string) {
    console.log('🔍 开始PocketBase认证测试...')
    console.log(`  - 测试邮箱: ${email}`)
    console.log(`  - 密码长度: ${password.length}`)
    console.log(`  - 测试时间: ${new Date().toISOString()}`)
    
    try {
      // 动态导入PocketBase以避免SSR问题
      const { pb } = await import('./pocketbase')
      
      console.log('  - PocketBase实例信息:')
      console.log(`    - Base URL: ${pb.baseUrl}`)
      console.log(`    - Auth Store Valid: ${pb.authStore.isValid}`)
      console.log(`    - Auth Store Model: ${pb.authStore.model ? '存在' : '不存在'}`)
      
      console.log('  - 开始健康检查...')
      const health = await pb.health.check()
      console.log('✅ 健康检查成功:', health)
      
      console.log('  - 开始认证测试...')
      const authData = await pb.collection('users').authWithPassword(email, password)
      
      console.log('✅ 认证测试成功:')
      console.log(`    - 用户ID: ${authData.record?.id}`)
      console.log(`    - 用户邮箱: ${authData.record?.email}`)
      console.log(`    - Token存在: ${!!authData.token}`)
      console.log(`    - Token长度: ${authData.token?.length || 0}`)
      
      return { success: true, data: authData }
    } catch (error: unknown) {
      console.error('❌ PocketBase认证测试失败:')
      console.error(`  - 错误类型: ${error instanceof Error ? error.constructor?.name : typeof error}`)
      console.error(`  - 错误消息: ${error instanceof Error ? error.message : String(error)}`)
      console.error(`  - 错误详情:`, error)
      console.error(`  - 失败时间: ${new Date().toISOString()}`)
      
      return { success: false, error }
    }
  },

  // 显示完整的调试报告
  async generateDebugReport(email?: string, password?: string) {
    console.log('🔍 生成完整调试报告...')
    console.log('=' .repeat(50))
    
    this.showEnvironmentVariables()
    console.log('')
    
    await this.testNetworkConnections()
    console.log('')
    
    if (email && password) {
      await this.testPocketBaseAuth(email, password)
    }
    
    console.log('=' .repeat(50))
    console.log('✅ 调试报告生成完成')
  }
}

// 将调试工具添加到全局对象，方便在浏览器控制台中使用
if (typeof window !== 'undefined') {
  (window as any).debugTools = debugTools
  console.log('🔍 调试工具已加载到全局对象:')
  console.log('  - 使用方法: debugTools.showEnvironmentVariables()')
  console.log('  - 使用方法: debugTools.testNetworkConnections()')
  console.log('  - 使用方法: debugTools.testPocketBaseAuth(email, password)')
  console.log('  - 使用方法: debugTools.generateDebugReport(email, password)')
} 
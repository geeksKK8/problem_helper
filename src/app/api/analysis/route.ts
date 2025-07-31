import { NextRequest, NextResponse } from 'next/server'
import { analyzeImage } from '@/lib/ai'
import { join } from 'path'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { imageId, subject } = body

    if (!imageId) {
      return NextResponse.json(
        { success: false, error: '缺少imageId参数' },
        { status: 400 }
      )
    }

    // 构建图片路径，imageId现在包含完整的文件名
    const imagePath = join(process.cwd(), 'public', 'uploads', imageId)
    
    // 调用AI分析，传递科目信息
    const result = await analyzeImage(imagePath, subject)

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('分析失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '分析失败' 
      },
      { status: 500 }
    )
  }
} 
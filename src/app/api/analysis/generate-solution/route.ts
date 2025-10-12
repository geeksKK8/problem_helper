import { NextRequest, NextResponse } from 'next/server'
import { generateSolutionSteps } from '@/lib/ai'
import fs from 'fs'
import path from 'path'

interface Subject {
  studyPhaseCode: string
  subjectCode: string
  name: string
  category: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { imagePath, subject } = body as { imagePath: string; subject?: Subject }

    if (!imagePath) {
      return NextResponse.json(
        { success: false, error: '缺少图片路径参数' },
        { status: 400 }
      )
    }

    // 如果是 blob URL，需要从请求中获取实际的图片数据
    // 这里我们假设前端会上传图片到服务器，然后传递文件路径
    let actualImagePath = imagePath

    // 如果是完整路径，直接使用；否则假设在 public/uploads 目录
    if (!path.isAbsolute(imagePath)) {
      actualImagePath = path.join(process.cwd(), 'public', 'uploads', imagePath)
    }

    // 检查文件是否存在
    if (!fs.existsSync(actualImagePath)) {
      return NextResponse.json(
        { success: false, error: '图片文件不存在' },
        { status: 404 }
      )
    }

    console.log('开始生成解答:', actualImagePath)
    
    // 调用 AI 生成解题步骤
    const solutionSteps = await generateSolutionSteps(actualImagePath, subject)

    return NextResponse.json({
      success: true,
      data: {
        solutionSteps,
        knowledgePoint: subject ? `${subject.category} - ${subject.name}` : undefined
      }
    })

  } catch (error) {
    console.error('生成解答失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '生成解答失败' 
      },
      { status: 500 }
    )
  }
}


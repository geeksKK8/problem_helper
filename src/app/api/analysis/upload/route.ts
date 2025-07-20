import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('image') as File
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: '没有找到图片文件' },
        { status: 400 }
      )
    }

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: '只支持图片文件' },
        { status: 400 }
      )
    }

    // 验证文件大小 (10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: '文件大小不能超过10MB' },
        { status: 400 }
      )
    }

    // 创建上传目录
    const uploadDir = join(process.cwd(), 'public', 'uploads')
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // 生成唯一文件名
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 15)
    const extension = file.name.split('.').pop() || 'jpg'
    const fileName = `analysis_${timestamp}_${randomId}.${extension}`
    const filePath = join(uploadDir, fileName)

    // 保存文件
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // 返回文件信息
    const imageUrl = `/uploads/${fileName}`
    const analysisId = fileName // 使用完整文件名作为id

    return NextResponse.json({
      success: true,
      data: {
        id: analysisId,
        imageUrl,
        status: 'uploaded',
        fileName,
        fileSize: file.size,
        mimeType: file.type,
        extension: extension
      }
    })

  } catch (error) {
    console.error('文件上传错误:', error)
    return NextResponse.json(
      { success: false, error: '文件上传失败' },
      { status: 500 }
    )
  }
} 
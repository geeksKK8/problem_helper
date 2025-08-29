import { NextRequest, NextResponse } from 'next/server'
import puppeteer from 'puppeteer'
import katex from 'katex'
import { join } from 'path'
import { readFileSync } from 'fs'

interface SolutionStep {
  step: number
  title: string
  content: string
  formula?: string
}

interface Problem {
  id: string
  title: string
  content: string
  difficulty: 'easy' | 'medium' | 'hard'
  tags: string[]
  similarity: number
  estimatedTime: number
  source: string
}

interface HistoryRecord {
  id: string
  originalImageName: string
  imageUrl: string
  knowledgePoint: string
  solution: SolutionStep[]
  problems: Problem[]
  problemCount: number
  avgSimilarity: number
  createdAt: string
  updatedAt: string
  status: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { historyId, recordData }: { historyId: string; recordData: HistoryRecord } = body

    if (!historyId) {
      return NextResponse.json(
        { success: false, error: '缺少historyId参数' },
        { status: 400 }
      )
    }

    if (!recordData) {
      return NextResponse.json(
        { success: false, error: '缺少记录数据' },
        { status: 400 }
      )
    }

    // 处理图片URL，将相对路径转换为base64
    const processedRecord = await processImageUrl(recordData)

    // 生成HTML内容
    const htmlContent = generatePDFHTML(processedRecord)

    // 启动浏览器
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    })

    try {
      const page = await browser.newPage()
      
      // 设置页面大小
      await page.setViewport({
        width: 1200,
        height: 1600
      })

      // 直接设置HTML内容
      await page.setContent(htmlContent, {
        waitUntil: 'networkidle0',
        timeout: 30000
      })

      // 生成PDF
      const pdf = await page.pdf({
        format: 'A4',
        margin: {
          top: '15mm',
          right: '15mm',
          bottom: '15mm',
          left: '15mm'
        },
        printBackground: true,
        preferCSSPageSize: true
      })

      await browser.close()

      // 返回PDF文件
      return new NextResponse(pdf as BodyInit, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="analysis-${historyId}.pdf"`
        }
      })

    } catch (error) {
      await browser.close()
      throw error
    }

  } catch (error) {
    console.error('PDF生成详细错误:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'PDF生成失败' 
      },
      { status: 500 }
    )
  }
}

// 处理图片URL，将相对路径转换为base64
async function processImageUrl(record: HistoryRecord): Promise<HistoryRecord> {
  try {
    // 处理主图片
    let processedImageUrl = record.imageUrl
    if (record.imageUrl && record.imageUrl.startsWith('/uploads/')) {
      try {
        const imagePath = join(process.cwd(), 'public', record.imageUrl)
        const imageBuffer = readFileSync(imagePath)
        const base64Image = imageBuffer.toString('base64')
        
        // 根据文件扩展名确定MIME类型
        const extension = record.imageUrl.split('.').pop()?.toLowerCase()
        let mimeType = 'image/jpeg' // 默认
        
        if (extension === 'png') {
          mimeType = 'image/png'
        } else if (extension === 'gif') {
          mimeType = 'image/gif'
        } else if (extension === 'webp') {
          mimeType = 'image/webp'
        }
        
        processedImageUrl = `data:${mimeType};base64,${base64Image}`
      } catch (error) {
        console.error('读取主图片文件失败:', error)
        // 如果读取失败，保持原URL
      }
    }

    // 处理推荐题目中的图片
    const processedProblems = record.problems.map(problem => {
      let processedContent = problem.content
      
      // 查找图片标签并处理
      const imgRegex = /<img[^>]+src="([^"]+)"[^>]*>/gi
      processedContent = processedContent.replace(imgRegex, (match, src) => {
        // 如果是相对路径，转换为base64
        if (src.startsWith('/uploads/')) {
          try {
            const imagePath = join(process.cwd(), 'public', src)
            const imageBuffer = readFileSync(imagePath)
            const base64Image = imageBuffer.toString('base64')
            
            // 根据文件扩展名确定MIME类型
            const extension = src.split('.').pop()?.toLowerCase()
            let mimeType = 'image/jpeg' // 默认
            
            if (extension === 'png') {
              mimeType = 'image/png'
            } else if (extension === 'gif') {
              mimeType = 'image/gif'
            } else if (extension === 'webp') {
              mimeType = 'image/webp'
            }
            
            const dataUrl = `data:${mimeType};base64,${base64Image}`
            return `<img src="${dataUrl}" style="max-width: 100%; height: auto; margin: 5px 0; border-radius: 4px; border: 1px solid #e5e5e5;" />`
          } catch (error) {
            console.error('处理推荐题目图片失败:', error, '图片路径:', src)
            return '' // 如果图片处理失败，移除图片
          }
        }
        
        // 如果已经是绝对URL或data URL，直接返回
        return match
      })
      
      return {
        ...problem,
        content: processedContent
      }
    })
    
    return {
      ...record,
      imageUrl: processedImageUrl,
      problems: processedProblems
    }
  } catch (error) {
    console.error('处理图片URL失败:', error)
    return record
  }
}

// 数学公式渲染函数
function renderMath(text: string): string {
  if (!text) return ''
  
  try {
    // 处理行内公式 $...$
    let processed = text.replace(/\$([^$]+)\$/g, (match, formula) => {
      try {
        return katex.renderToString(formula, {
          throwOnError: false,
          displayMode: false
        })
      } catch (e) {
        return match // 如果渲染失败，返回原文
      }
    })

    // 处理块级公式 $$...$$
    processed = processed.replace(/\$\$([^$]+)\$\$/g, (match, formula) => {
      try {
        return `<div class="math-display">${katex.renderToString(formula, {
          throwOnError: false,
          displayMode: true
        })}</div>`
      } catch (e) {
        return match // 如果渲染失败，返回原文
      }
    })

    return processed
  } catch (error) {
    console.error('数学公式渲染失败:', error)
    return text
  }
}

// HTML内容清理和处理函数
function processContent(content: string): string {
  if (!content) return ''
  
  // 清理HTML标签但保留基本格式和换行，保留图片标签
  let processed = content
    .replace(/<script[^>]*>.*?<\/script>/gi, '') // 移除script标签
    .replace(/<style[^>]*>.*?<\/style>/gi, '') // 移除style标签
    .replace(/<br\s*\/?>/gi, '\n') // 将<br>标签转换为换行符
    .replace(/<\/p>/gi, '\n') // 将</p>标签转换为换行符
    .replace(/<p[^>]*>/gi, '') // 移除<p>开始标签
    .replace(/<div[^>]*>/gi, '') // 移除<div>开始标签
    .replace(/<\/div>/gi, '\n') // 将</div>标签转换为换行符
    .replace(/<[^>]*>/g, (match) => {
      // 保留img标签，移除其他标签
      if (match.toLowerCase().startsWith('<img')) {
        return match
      }
      return ''
    })
    .replace(/&nbsp;/g, ' ') // 替换空格实体
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\n\s*\n/g, '\n') // 合并多个连续换行
    .replace(/^\s+|\s+$/g, '') // 去除首尾空白
    .replace(/\n/g, '<br>') // 将换行符转换为HTML换行标签

  // 渲染数学公式
  processed = renderMath(processed)
  
  return processed
}

function generatePDFHTML(record: HistoryRecord): string {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatSimilarity = (similarity: number) => {
    return `${similarity.toFixed(1)}%`
  }

  const difficultyLabels: Record<string, string> = {
    easy: '简单',
    medium: '中等',
    hard: '困难',
  }

  return `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>分析报告 - ${record.originalImageName}</title>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
          line-height: 1.4;
          color: #333;
          background: #fff;
          font-size: 12px;
        }
        
        .container {
          max-width: 100%;
          margin: 0 auto;
        }
        
        .header {
          text-align: center;
          border-bottom: 2px solid #3b82f6;
          padding-bottom: 10px;
          margin-bottom: 15px;
        }
        
        .title {
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 5px;
          color: #1a1a1a;
        }
        
        .subtitle {
          color: #666;
          font-size: 14px;
        }
        
        .section {
          margin-bottom: 15px;
          page-break-inside: avoid;
        }
        
        .section-title {
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 8px;
          color: #1a1a1a;
          border-left: 3px solid #3b82f6;
          padding-left: 8px;
          background: #f8fafc;
          padding: 5px 8px;
          page-break-after: avoid;
          break-after: avoid;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 10px;
        }
        
        .info-item {
          padding: 8px;
          background: #f8f9fa;
          border-radius: 4px;
          border: 1px solid #e5e5e5;
        }
        
        .info-label {
          font-size: 10px;
          color: #666;
          margin-bottom: 3px;
          font-weight: 500;
        }
        
        .info-value {
          font-size: 12px;
          font-weight: 600;
        }
        
        .knowledge-point {
          background: #dbeafe;
          color: #1e40af;
          padding: 4px 8px;
          border-radius: 12px;
          display: inline-block;
          font-weight: 500;
          font-size: 11px;
        }
        
        .image-section {
          text-align: center;
          margin-bottom: 15px;
        }
        
        .original-image {
          max-width: 100%;
          max-height: 300px;
          border-radius: 6px;
          border: 1px solid #e5e5e5;
          object-fit: contain;
        }
        
        .solution-step {
          margin-bottom: 12px;
          page-break-inside: avoid;
          break-inside: avoid;
          border-left: 2px solid #e5e5e5;
          padding-left: 10px;
        }
        
        .step-header {
          display: flex;
          align-items: center;
          margin-bottom: 6px;
        }
        
        .step-number {
          width: 20px;
          height: 20px;
          background: #3b82f6;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          margin-right: 8px;
          font-size: 10px;
          flex-shrink: 0;
        }
        
        .step-title {
          font-size: 12px;
          font-weight: 600;
          color: #1a1a1a;
        }
        
        .step-content {
          margin-left: 28px;
          margin-bottom: 6px;
          line-height: 1.5;
          font-size: 11px;
        }
        
        .step-formula {
          margin-left: 28px;
          background: #f1f5f9;
          padding: 8px;
          border-radius: 4px;
          border-left: 3px solid #3b82f6;
          margin-bottom: 6px;
        }
        
        .formula-label {
          font-size: 10px;
          color: #666;
          margin-bottom: 4px;
          font-weight: 500;
        }
        
        .formula-content {
          text-align: center;
          font-size: 12px;
        }
        
        .math-display {
          text-align: center;
          margin: 8px 0;
        }
        
        .problem-item {
          border: 1px solid #e5e5e5;
          border-radius: 6px;
          padding: 10px;
          margin-bottom: 8px;
          page-break-inside: avoid;
          break-inside: avoid;
          font-size: 11px;
        }
        
        .problem-content {
          margin-bottom: 6px;
          line-height: 1.4;
        }
        
        .problem-content img {
          max-width: 100%;
          height: auto;
          margin: 5px 0;
          border-radius: 4px;
          border: 1px solid #e5e5e5;
        }
        
        .problem-meta {
          display: flex;
          gap: 8px;
          align-items: center;
          flex-wrap: wrap;
        }
        
        .badge {
          padding: 2px 6px;
          border-radius: 10px;
          font-size: 9px;
          font-weight: 500;
        }
        
        .badge-easy { background: #dcfce7; color: #166534; }
        .badge-medium { background: #fef3c7; color: #92400e; }
        .badge-hard { background: #fee2e2; color: #991b1b; }
        
        .meta-item {
          font-size: 9px;
          color: #666;
        }
        
        @media print {
          body { 
            margin: 0; 
            padding: 0;
            font-size: 11px;
          }
          .section { 
            page-break-inside: avoid; 
            break-inside: avoid;
          }
          .solution-step { 
            page-break-inside: avoid; 
            break-inside: avoid;
          }
          .problem-item { 
            page-break-inside: avoid; 
            break-inside: avoid;
          }
          .image-section {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .section-title {
            page-break-after: avoid;
            break-after: avoid;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        ${record.imageUrl ? `
        <div class="section">
          <h2 class="section-title">原题图片</h2>
          <div class="image-section">
            <img src="${record.imageUrl}" alt="${record.originalImageName}" class="original-image">
          </div>
        </div>
        ` : ''}

        <div class="section">
          <h2 class="section-title">基本信息</h2>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">识别知识点</div>
              <div class="info-value">
                <span class="knowledge-point">${record.knowledgePoint}</span>
              </div>
            </div>
            <div class="info-item">
              <div class="info-label">推荐题目</div>
              <div class="info-value">${record.problemCount || 0} 个</div>
            </div>
          </div>
          
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">分析时间</div>
              <div class="info-value">${formatDate(record.createdAt)}</div>
            </div>
            <div class="info-item">
              <div class="info-label">平均相似度</div>
              <div class="info-value">${formatSimilarity(record.avgSimilarity || 0)}</div>
            </div>
          </div>
        </div>

        ${record.solution && record.solution.length > 0 ? `
        <div class="section">
          <h2 class="section-title">解题过程</h2>
          ${record.solution.map((step: SolutionStep) => `
            <div class="solution-step">
              <div class="step-header">
                <div class="step-number">${step.step}</div>
                <div class="step-title">${step.title}</div>
              </div>
              <div class="step-content">${processContent(step.content)}</div>
              ${step.formula ? `
                <div class="step-formula">
                  <div class="formula-label">相关公式：</div>
                  <div class="formula-content">${renderMath(`$$${step.formula}$$`)}</div>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
        ` : ''}

        ${record.problems && record.problems.length > 0 ? `
        <div class="section">
          <h2 class="section-title">推荐题目</h2>
          ${record.problems.map((problem: Problem) => `
            <div class="problem-item">
              <div class="problem-content">${processContent(problem.content)}</div>
              <div class="problem-meta">
                <span class="badge badge-${problem.difficulty}">${difficultyLabels[problem.difficulty as keyof typeof difficultyLabels]}</span>
                <span class="meta-item">相似度: ${formatSimilarity(problem.similarity)}</span>
                ${problem.estimatedTime ? `<span class="meta-item">预计 ${problem.estimatedTime} 分钟</span>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
        ` : ''}
      </div>
    </body>
    </html>
  `
}
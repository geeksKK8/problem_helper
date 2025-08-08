"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, Clock, CheckCircle, XCircle, Download, Eye, FileText } from "lucide-react"
import { apiClient } from "@/lib/api"
import KatexHtmlRenderer from "@/components/ui/katex-html-renderer"
import { AnalysisResultDisplay } from "@/components/analysis/analysis-result-display"
import { toast } from "sonner"
import type { HistoryRecord } from "@/types"

const statusIcons = {
  completed: <CheckCircle className="h-5 w-5 text-green-500" />,
  processing: <Clock className="h-5 w-5 text-yellow-500" />,
  failed: <XCircle className="h-5 w-5 text-red-500" />,
}

const statusLabels = {
  completed: '分析完成',
  processing: '正在分析',
  failed: '分析失败',
}

const statusColors = {
  completed: 'bg-green-100 text-green-800',
  processing: 'bg-yellow-100 text-yellow-800',
  failed: 'bg-red-100 text-red-800',
}

const difficultyColors = {
  easy: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  hard: 'bg-red-100 text-red-800',
}

const difficultyLabels = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
}

export default function HistoryDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [record, setRecord] = useState<HistoryRecord | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false)

  const historyId = params.id as string
  const isPDFMode = searchParams.get('pdf') === 'true'

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

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  // 格式化相似度
  const formatSimilarity = (similarity: number) => {
    return `${similarity.toFixed(1)}%`
  }

  // 返回列表
  const handleBack = () => {
    router.push('/dashboard/history')
  }

  // 查看题目详情
  const handleViewProblem = (problemId: string) => {
    router.push(`/dashboard/problem/${problemId}`)
  }

  // 下载PDF
  const handleDownloadPDF = async () => {
    if (!record) {
      toast.error('记录数据不存在')
      return
    }

    try {
      setIsDownloadingPDF(true)
      toast.loading('正在生成PDF...', { id: 'pdf-download' })
      
      const blob = await apiClient.downloadPDF(historyId, record as unknown as Record<string, unknown>)
      
      // 创建下载链接
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `analysis-${historyId}-${record.originalImageName || 'report'}.pdf`
      
      document.body.appendChild(a)
      a.click()
      
      // 清理
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('PDF下载成功！', { id: 'pdf-download' })
    } catch (error) {
      console.error('PDF下载失败:', error)
      toast.error(error instanceof Error ? error.message : 'PDF下载失败', { id: 'pdf-download' })
    } finally {
      setIsDownloadingPDF(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-40" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-48 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error || !record) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回列表
          </Button>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <XCircle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">加载失败</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              重试
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6" data-pdf-content>
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {!isPDFMode && (
            <Button variant="ghost" size="sm" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回列表
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold">分析详情</h1>
            <p className="text-muted-foreground">{record.originalImageName}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge className={statusColors[record.status]}>
            <div className="flex items-center gap-1">
              {statusIcons[record.status]}
              {statusLabels[record.status]}
            </div>
          </Badge>
          {!isPDFMode && (
            <Button 
              onClick={handleDownloadPDF}
              disabled={isDownloadingPDF}
              size="sm"
            >
              <FileText className="h-4 w-4 mr-2" />
              {isDownloadingPDF ? '生成中...' : '下载PDF'}
            </Button>
          )}
        </div>
      </div>

      {/* 基本信息和原图 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 原图显示 */}
        <Card>
          <CardHeader>
            <CardTitle>原题图片</CardTitle>
            <CardDescription>上传的题目图片</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <img
                src={record.imageUrl}
                alt={record.originalImageName}
                className="w-full rounded-lg border shadow-sm"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder-image.png'
                }}
              />
              {!isPDFMode && (
                <div className="absolute top-2 right-2">
                  <Button size="sm" variant="secondary">
                    <Download className="h-4 w-4 mr-1" />
                    下载
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 分析信息 */}
        <Card>
          <CardHeader>
            <CardTitle>分析信息</CardTitle>
            <CardDescription>AI识别和分析结果</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 知识点 */}
            <div>
              <label className="text-sm font-medium text-muted-foreground">识别知识点</label>
              <div className="mt-1">
                <Badge variant="secondary" className="text-base px-3 py-1">
                  {record.knowledgePoint}
                </Badge>
              </div>
            </div>

            {/* 统计信息 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">推荐题目</label>
                <div className="text-2xl font-bold">{record.problemCount}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">平均相似度</label>
                <div className="text-2xl font-bold">{formatSimilarity(record.avgSimilarity)}</div>
              </div>
            </div>

            {/* 时间信息 */}
            <Separator />
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">分析时间</span>
                <span>{formatDate(record.createdAt)}</span>
              </div>
              {record.updatedAt !== record.createdAt && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">更新时间</span>
                  <span>{formatDate(record.updatedAt)}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 解题步骤 */}
      {record.solution && record.solution.length > 0 && (
        <Card className="pdf-optimized">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              解题过程
            </CardTitle>
            <CardDescription>
              AI分析生成的详细解题步骤
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {record.solution.map((step, index) => (
              <div key={step.step} className="space-y-3 pdf-step">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                    {step.step}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {step.title}
                  </h3>
                </div>
                
                <div className="ml-11 space-y-3">
                  <div className="text-gray-700 leading-relaxed">
                    <KatexHtmlRenderer 
                      html={step.content}
                      className="text-base"
                      preserveLineBreaks={true}
                    />
                  </div>
                  
                  {step.formula && (
                    <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-primary">
                      <div className="text-sm font-medium text-gray-600 mb-2">相关公式：</div>
                      <div className="text-center">
                        <KatexHtmlRenderer 
                          html={`$$${step.formula}$$`}
                          className="text-lg"
                          preserveLineBreaks={true}
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                {index < record.solution.length - 1 && (
                  <div className="ml-11">
                    <Separator className="my-4" />
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 推荐题目 */}
      {record.problems && record.problems.length > 0 && (
        <Card className="pdf-optimized">
          <CardHeader>
            <CardTitle>推荐题目</CardTitle>
            <CardDescription>基于当前题目推荐的相似题目</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {record.problems.map((problem) => (
                <div key={problem.id} className="border rounded-lg p-4 pdf-problem">
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">
                      <KatexHtmlRenderer 
                        html={problem.content}
                        className="text-sm"
                        preserveLineBreaks={true}
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={difficultyColors[problem.difficulty]}>
                        {difficultyLabels[problem.difficulty]}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        相似度: {formatSimilarity(problem.similarity)}
                      </span>
                      {problem.estimatedTime && (
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          预计 {problem.estimatedTime} 分钟
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* PDF专用样式 */}
      {isPDFMode && (
        <style jsx global>{`
          .pdf-optimized {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          
          .pdf-step {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          
          .pdf-problem {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          
          @media print {
            .pdf-optimized {
              page-break-inside: avoid;
            }
            
            .pdf-step {
              page-break-inside: avoid;
            }
            
            .pdf-problem {
              page-break-inside: avoid;
            }
          }
        `}</style>
      )}
    </div>
  )
} 
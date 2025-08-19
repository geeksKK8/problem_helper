"use client"

import { useState, useCallback, useEffect } from "react"
import { useDropzone } from "react-dropzone"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Upload, X, FileImage, CheckCircle, AlertCircle } from "lucide-react"
import { apiClient } from "@/lib/api"

// 科目类型定义
interface Subject {
  studyPhaseCode: string
  subjectCode: string
  name: string
  category: string
}

// 文件项类型
interface FileItem {
  id: string
  file: File
  previewUrl?: string
  subject: Subject
  status: 'pending' | 'uploading' | 'analyzing' | 'completed' | 'error'
  progress: number
  message: string
  result?: {
    knowledgePoint: string
    problems: Array<{
      id: string
      title: string
      content: string
      difficulty: 'easy' | 'medium' | 'hard'
      tags: string[]
      similarity: number
      estimatedTime: number
      source: string
    }>
    historyId?: string | null
  }
  error?: string
}

interface BatchUploadZoneProps {
  onBatchComplete: (results: Array<{ file: File; result: { knowledgePoint: string; problems: Array<{
    id: string
    title: string
    content: string
    difficulty: 'easy' | 'medium' | 'hard'
    tags: string[]
    similarity: number
    estimatedTime: number
    source: string
  }>; historyId?: string | null }; subject: Subject }>) => void
  accept?: string
  maxSize?: number
  maxFiles?: number
  subjects: Subject[]
  preloadedFiles?: File[] // 新增：预加载的文件
}

export function BatchUploadZone({
  onBatchComplete,
  accept = "image/*",
  maxSize = 10 * 1024 * 1024, // 10MB
  maxFiles = 10,
  subjects,
  preloadedFiles = [],
}: BatchUploadZoneProps) {
  const [files, setFiles] = useState<FileItem[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [overallProgress, setOverallProgress] = useState(0)

  // 处理预加载的文件
  useEffect(() => {
    if (preloadedFiles.length > 0) {
      const preloadedFileItems: FileItem[] = preloadedFiles.map((file, index) => ({
        id: `preloaded-${Date.now()}-${index}`,
        file,
        previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
        subject: subjects[11], // 默认选择高中数学
        status: 'pending',
        progress: 0,
        message: "等待处理"
      }))
      setFiles(preloadedFileItems)
    }
  }, [preloadedFiles, subjects])

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return

      const newFiles: FileItem[] = acceptedFiles.map((file, index) => ({
        id: `${Date.now()}-${index}`,
        file,
        previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
        subject: subjects[11], // 默认选择高中数学
        status: 'pending',
        progress: 0,
        message: "等待处理"
      }))

      setFiles(prev => [...prev, ...newFiles])
    },
    [subjects]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept ? { [accept]: [] } : undefined,
    maxSize,
    multiple: true,
    maxFiles,
  })

  const updateFileStatus = useCallback((fileId: string, updates: Partial<FileItem>) => {
    setFiles(prev => prev.map(file => 
      file.id === fileId ? { ...file, ...updates } : file
    ))
  }, [])

  const removeFile = useCallback((fileId: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === fileId)
      if (file?.previewUrl) {
        URL.revokeObjectURL(file.previewUrl)
      }
      return prev.filter(f => f.id !== fileId)
    })
  }, [])

  const updateSubject = useCallback((fileId: string, subject: Subject) => {
    updateFileStatus(fileId, { subject })
  }, [updateFileStatus])

  const processBatch = useCallback(async () => {
    if (files.length === 0 || isProcessing) return

    setIsProcessing(true)
    setOverallProgress(0)

    const pendingFiles = files.filter(f => f.status === 'pending')
    const totalFiles = pendingFiles.length
    let completedCount = 0

    // 并行处理文件，但限制并发数
    const batchSize = 3 // 同时处理3个文件
    const results: Array<{ file: File; result: { knowledgePoint: string; problems: Array<{
      id: string
      title: string
      content: string
      difficulty: 'easy' | 'medium' | 'hard'
      tags: string[]
      similarity: number
      estimatedTime: number
      source: string
    }>; historyId?: string | null }; subject: Subject }> = []

    for (let i = 0; i < pendingFiles.length; i += batchSize) {
      const batch = pendingFiles.slice(i, i + batchSize)
      
      const batchPromises = batch.map(async (fileItem) => {
        try {
          // 更新状态为上传中
          updateFileStatus(fileItem.id, { 
            status: 'uploading', 
            progress: 0, 
            message: "正在上传图片..." 
          })

          // 1. 上传图片
          const uploadResult = await apiClient.uploadImage(fileItem.file)
          if (!uploadResult.success) {
            throw new Error(uploadResult.error || '上传失败')
          }

          if (!uploadResult.data?.id) {
            throw new Error('上传成功但未返回图片ID')
          }

          updateFileStatus(fileItem.id, { progress: 30, message: "AI正在分析..." })
          
          // 2. 开始分析，传递科目信息
          const analysisResult = await apiClient.analyzeImage(uploadResult.data.id, fileItem.subject)
          if (!analysisResult.success) {
            throw new Error(analysisResult.error || '分析失败')
          }

          if (!analysisResult.data) {
            throw new Error('分析成功但未返回数据')
          }

          updateFileStatus(fileItem.id, { progress: 100, message: "分析完成" })

          // 保存分析历史到数据库
          let historyId: string | null = null
          try {
            const saveResult = await apiClient.saveAnalysisHistory({
              imageUrl: uploadResult.data.imageUrl,
              originalImageName: fileItem.file.name,
              knowledgePoint: analysisResult.data.knowledgePoint,
              solution: analysisResult.data.solution || [],
              problems: analysisResult.data.problems,
              status: 'completed'
            })
            
            if (saveResult.success && saveResult.data) {
              historyId = saveResult.data.id
            }
          } catch (saveError) {
            console.error('保存分析历史失败:', saveError)
            // 不影响主流程，只记录错误
          }

          updateFileStatus(fileItem.id, { 
            status: 'completed', 
            result: {
              knowledgePoint: analysisResult.data.knowledgePoint,
              problems: analysisResult.data.problems,
              historyId: historyId
            }
          })

          results.push({
            file: fileItem.file,
            result: {
              knowledgePoint: analysisResult.data.knowledgePoint,
              problems: analysisResult.data.problems,
              historyId: historyId
            },
            subject: fileItem.subject
          })

          completedCount++
          setOverallProgress((completedCount / totalFiles) * 100)

        } catch (error) {
          updateFileStatus(fileItem.id, { 
            status: 'error', 
            error: error instanceof Error ? error.message : "处理失败" 
          })
          completedCount++
          setOverallProgress((completedCount / totalFiles) * 100)
        }
      })

      await Promise.all(batchPromises)
    }

    setIsProcessing(false)
    
    if (results.length > 0) {
      onBatchComplete(results)
    }
  }, [files, isProcessing, updateFileStatus, onBatchComplete])

  const clearAll = useCallback(() => {
    files.forEach(file => {
      if (file.previewUrl) {
        URL.revokeObjectURL(file.previewUrl)
      }
    })
    setFiles([])
    setOverallProgress(0)
  }, [files])

  const getStatusIcon = (status: FileItem['status']) => {
    switch (status) {
      case 'pending':
        return <FileImage className="h-4 w-4 text-muted-foreground" />
      case 'uploading':
      case 'analyzing':
        return <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusColor = (status: FileItem['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-100 text-gray-800'
      case 'uploading':
      case 'analyzing':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'error':
        return 'bg-red-100 text-red-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* 批量上传区域 */}
      <Card>
        <CardHeader>
          <CardTitle>批量上传题目图片</CardTitle>
          <CardDescription>
            {preloadedFiles.length > 0 
              ? `已加载 ${preloadedFiles.length} 张预处理图片，可继续添加更多图片进行批量分析`
              : `支持同时上传多张题目图片进行批量分析，最多${maxFiles}张图片`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
              transition-colors duration-200
              ${isDragActive 
                ? "border-primary bg-primary/5" 
                : "border-muted-foreground/25 hover:border-primary/50"
              }
            `}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            {isDragActive ? (
              <p className="text-primary font-medium">将文件拖放到这里...</p>
            ) : (
              <div>
                <p className="text-muted-foreground mb-2">
                  拖拽文件到这里，或点击选择文件
                </p>
                <Button variant="outline" size="sm">
                  选择文件
                </Button>
              </div>
            )}
          </div>

          {/* 操作按钮 */}
          {files.length > 0 && (
            <div className="flex gap-2 mt-4">
              <Button 
                onClick={processBatch} 
                disabled={isProcessing || files.filter(f => f.status === 'pending').length === 0}
              >
                {isProcessing ? "处理中..." : "开始批量分析"}
              </Button>
              <Button variant="outline" onClick={clearAll} disabled={isProcessing}>
                清空所有
              </Button>
            </div>
          )}

          {/* 总体进度 */}
          {isProcessing && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>批量处理进度</span>
                <span>{Math.round(overallProgress)}%</span>
              </div>
              <Progress value={overallProgress} className="w-full" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* 文件列表 */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>文件列表 ({files.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {files.map((fileItem) => (
                <div key={fileItem.id} className="border rounded-lg p-4">
                  <div className="flex items-start gap-4">
                    {/* 预览图 */}
                    {fileItem.previewUrl && (
                      <div className="relative w-20 h-20 flex-shrink-0">
                        <Image
                          src={fileItem.previewUrl}
                          alt="预览"
                          fill
                          className="object-cover rounded border"
                        />
                      </div>
                    )}

                    {/* 文件信息 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(fileItem.status)}
                        <span className="font-medium truncate">{fileItem.file.name}</span>
                        <Badge className={getStatusColor(fileItem.status)}>
                          {fileItem.status === 'pending' && '等待处理'}
                          {fileItem.status === 'uploading' && '上传中'}
                          {fileItem.status === 'analyzing' && '分析中'}
                          {fileItem.status === 'completed' && '已完成'}
                          {fileItem.status === 'error' && '处理失败'}
                        </Badge>
                      </div>

                      {/* 科目选择 */}
                      {fileItem.status === 'pending' && (
                        <div className="mb-2">
                          <Label className="text-sm">选择科目:</Label>
                          <Select 
                            value={`${fileItem.subject.studyPhaseCode}-${fileItem.subject.subjectCode}`}
                            onValueChange={(value) => {
                              const [studyPhaseCode, subjectCode] = value.split('-')
                              const subject = subjects.find(s => 
                                s.studyPhaseCode === studyPhaseCode && s.subjectCode === subjectCode
                              )
                              if (subject) {
                                updateSubject(fileItem.id, subject)
                              }
                            }}
                          >
                            <SelectTrigger className="w-full mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <div className="space-y-2">
                                <div className="px-2 py-1 text-sm font-medium text-muted-foreground">初中</div>
                                {subjects.filter(s => s.category === '初中').map((subject) => (
                                  <SelectItem 
                                    key={`${subject.studyPhaseCode}-${subject.subjectCode}`}
                                    value={`${subject.studyPhaseCode}-${subject.subjectCode}`}
                                  >
                                    {subject.name}
                                  </SelectItem>
                                ))}
                                <Separator />
                                <div className="px-2 py-1 text-sm font-medium text-muted-foreground">高中</div>
                                {subjects.filter(s => s.category === '高中').map((subject) => (
                                  <SelectItem 
                                    key={`${subject.studyPhaseCode}-${subject.subjectCode}`}
                                    value={`${subject.studyPhaseCode}-${subject.subjectCode}`}
                                  >
                                    {subject.name}
                                  </SelectItem>
                                ))}
                              </div>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* 进度和消息 */}
                      {(fileItem.status === 'uploading' || fileItem.status === 'analyzing') && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span>{fileItem.message}</span>
                            <span>{fileItem.progress}%</span>
                          </div>
                          <Progress value={fileItem.progress} className="w-full" />
                        </div>
                      )}

                      {/* 错误信息 */}
                      {fileItem.status === 'error' && fileItem.error && (
                        <Alert variant="destructive" className="mt-2">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{fileItem.error}</AlertDescription>
                        </Alert>
                      )}

                      {/* 结果信息 */}
                      {fileItem.status === 'completed' && fileItem.result && (
                        <div className="mt-2 text-sm text-muted-foreground">
                          <p>知识点: {fileItem.result.knowledgePoint}</p>
                          <p>推荐题目: {fileItem.result.problems.length} 道</p>
                        </div>
                      )}
                    </div>

                    {/* 删除按钮 */}
                    {fileItem.status === 'pending' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(fileItem.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 
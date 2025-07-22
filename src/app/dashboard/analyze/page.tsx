"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { UploadZone } from "@/components/upload/upload-zone"
import { AnalysisProgress } from "@/components/analysis/analysis-progress"
import { ProblemDisplay } from "@/components/problems/problem-display"

import { apiClient } from "@/lib/api"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import type { Problem } from "@/types"

export default function AnalyzePage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<'upload' | 'analyzing' | 'selecting' | 'complete' | 'error'>('upload')
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [knowledgePoint, setKnowledgePoint] = useState<string>("")
  const [problems, setProblems] = useState<Problem[]>([])


  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
    setCurrentStep('upload')
    setProgress(0)
  }

  const handleUpload = async (file: File) => {
    try {
      setCurrentStep('analyzing')
      setMessage("正在上传图片...")
      setProgress(20)

      // 1. 上传图片
      const uploadResult = await apiClient.uploadImage(file)
      if (!uploadResult.success) {
        throw new Error(uploadResult.error || '上传失败')
      }

      if (!uploadResult.data?.id) {
        throw new Error('上传成功但未返回图片ID')
      }

      setProgress(40)
      setMessage("AI正在分析图片...")
      
      // 2. 开始分析
      const analysisResult = await apiClient.analyzeImage(uploadResult.data.id)
      if (!analysisResult.success) {
        throw new Error(analysisResult.error || '分析失败')
      }

      if (!analysisResult.data) {
        throw new Error('分析成功但未返回数据')
      }

      setProgress(100)
      setMessage("分析完成！")

      // 设置结果
      setKnowledgePoint(analysisResult.data.knowledgePoint)
      setProblems(analysisResult.data.problems)

      setCurrentStep('complete')
      toast.success("分析完成！")
    } catch (error) {
      console.error('分析错误:', error)
      setCurrentStep('error')
      setMessage(error instanceof Error ? error.message : "分析失败，请重试")
      toast.error(error instanceof Error ? error.message : "分析失败，请重试")
    }
  }

  const handleCancel = () => {
    setCurrentStep('upload')
    setProgress(0)
    setMessage("")
    setSelectedFile(null)
    setKnowledgePoint("")
    setProblems([])
  }

  const handleRetry = () => {
    if (selectedFile) {
      handleUpload(selectedFile)
    }
  }

  const handleViewProblem = (id: string) => {
    // 导航到问题详情页面
    router.push(`/dashboard/problem/${id}`)
  }

  const handleSaveProblem = (id: string) => {
    toast.success(`已保存题目: ${id}`)
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold">题目分析</h1>
        <p className="text-muted-foreground">
          上传数学题目图片，获取相关题目推荐
        </p>
      </div>

      {/* 上传区域 */}
      {currentStep === 'upload' && (
        <UploadZone
          onFileSelect={handleFileSelect}
          onUpload={handleUpload}
          accept="image/*"
          maxSize={10 * 1024 * 1024}
          preview={true}
        />
      )}

      {/* 分析进度 */}
      {(currentStep === 'analyzing' || currentStep === 'selecting' || currentStep === 'error') && (
        <AnalysisProgress
          currentStep={currentStep}
          progress={progress}
          message={message}
          onCancel={handleCancel}
          onRetry={handleRetry}
        />
      )}

      {/* 分析结果 */}
      {currentStep === 'complete' && (
        <div className="space-y-6">
          {/* 知识点 */}
          <Card>
            <CardHeader>
              <CardTitle>AI识别的知识点</CardTitle>
              <CardDescription>
                基于图片分析得出的核心知识点
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary" className="text-lg px-4 py-2">
                {knowledgePoint}
              </Badge>
            </CardContent>
          </Card>

          {/* 推荐题目 */}
          <Card>
            <CardHeader>
              <CardTitle>推荐题目</CardTitle>
              <CardDescription>
                基于相似度算法精选的相关题目
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {problems.map((problem) => (
                  <ProblemDisplay
                    key={problem.id}
                    problem={problem}
                    onView={handleViewProblem}
                    onSave={handleSaveProblem}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 操作按钮 */}
          <div className="flex gap-4">
            <Button onClick={() => setCurrentStep('upload')}>
              分析新题目
            </Button>
            <Button variant="outline">
              保存结果
            </Button>
          </div>
        </div>
      )}
    </div>
  )
} 
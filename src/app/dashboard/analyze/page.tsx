"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { UploadZone } from "@/components/upload/upload-zone"
import { AnalysisProgress } from "@/components/analysis/analysis-progress"
import { ProblemDisplay } from "@/components/problems/problem-display"
import { AnalysisResultDisplay } from "@/components/analysis/analysis-result-display"

import KatexHtmlRenderer from "@/components/ui/katex-html-renderer"

import { apiClient } from "@/lib/api"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { CheckCircle } from "lucide-react"
import type { Problem } from "@/types"

// 解题步骤类型定义
interface SolutionStep {
  step: number
  title: string
  content: string
  formula?: string
}

// 科目类型定义
interface Subject {
  studyPhaseCode: string
  subjectCode: string
  name: string
  category: string
}

// 科目配置
const SUBJECTS: Subject[] = [
  // 初中科目
  { studyPhaseCode: "200", subjectCode: "1", name: "语文", category: "初中" },
  { studyPhaseCode: "200", subjectCode: "2", name: "数学", category: "初中" },
  { studyPhaseCode: "200", subjectCode: "3", name: "英语", category: "初中" },
  { studyPhaseCode: "200", subjectCode: "5", name: "历史", category: "初中" },
  { studyPhaseCode: "200", subjectCode: "6", name: "地理", category: "初中" },
  { studyPhaseCode: "200", subjectCode: "7", name: "物理", category: "初中" },
  { studyPhaseCode: "200", subjectCode: "8", name: "化学", category: "初中" },
  { studyPhaseCode: "200", subjectCode: "9", name: "生物", category: "初中" },
  { studyPhaseCode: "200", subjectCode: "56", name: "道德与法治", category: "初中" },
  { studyPhaseCode: "200", subjectCode: "57", name: "科学", category: "初中" },
  // 高中科目
  { studyPhaseCode: "300", subjectCode: "1", name: "语文", category: "高中" },
  { studyPhaseCode: "300", subjectCode: "2", name: "数学", category: "高中" },
  { studyPhaseCode: "300", subjectCode: "3", name: "英语", category: "高中" },
  { studyPhaseCode: "300", subjectCode: "4", name: "政治", category: "高中" },
  { studyPhaseCode: "300", subjectCode: "5", name: "历史", category: "高中" },
  { studyPhaseCode: "300", subjectCode: "6", name: "地理", category: "高中" },
  { studyPhaseCode: "300", subjectCode: "7", name: "物理", category: "高中" },
  { studyPhaseCode: "300", subjectCode: "8", name: "化学", category: "高中" },
  { studyPhaseCode: "300", subjectCode: "9", name: "生物", category: "高中" },
]

export default function AnalyzePage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<'upload' | 'analyzing' | 'selecting' | 'complete' | 'error'>('upload')
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedSubject, setSelectedSubject] = useState<Subject>(SUBJECTS[11]) // 默认选择高中数学
  const [imageUrl, setImageUrl] = useState<string>("")
  const [knowledgePoint, setKnowledgePoint] = useState<string>("")
  const [solutionSteps, setSolutionSteps] = useState<SolutionStep[]>([])
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
      
      // 2. 开始分析，传递科目信息
      const analysisResult = await apiClient.analyzeImage(uploadResult.data.id, selectedSubject)
      if (!analysisResult.success) {
        throw new Error(analysisResult.error || '分析失败')
      }

      if (!analysisResult.data) {
        throw new Error('分析成功但未返回数据')
      }

      setProgress(100)
      setMessage("分析完成！")

      // 设置结果
      setImageUrl(uploadResult.data.imageUrl)
      setKnowledgePoint(analysisResult.data.knowledgePoint)
      setSolutionSteps(analysisResult.data.solution || [])
      setProblems(analysisResult.data.problems)

      // 保存分析历史到数据库
      try {
        await apiClient.saveAnalysisHistory({
          imageUrl: uploadResult.data.imageUrl,
          originalImageName: file.name,
          knowledgePoint: analysisResult.data.knowledgePoint,
          solution: analysisResult.data.solution || [],
          problems: analysisResult.data.problems,
          status: 'completed'
        })

      } catch (saveError) {
        console.error('保存分析历史失败:', saveError)
        // 不影响主流程，只记录错误
      }

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
    setSolutionSteps([])
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
          上传题目图片，获取相关题目推荐
        </p>
      </div>

      {/* 科目选择器 */}
      {currentStep === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle>选择科目</CardTitle>
            <CardDescription>
              请选择题目对应的科目，这将帮助AI更准确地分析和推荐相关题目
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="subject-select">科目</Label>
              <Select 
                value={`${selectedSubject.studyPhaseCode}-${selectedSubject.subjectCode}`}
                onValueChange={(value) => {
                  const [studyPhaseCode, subjectCode] = value.split('-')
                  const subject = SUBJECTS.find(s => 
                    s.studyPhaseCode === studyPhaseCode && s.subjectCode === subjectCode
                  )
                  if (subject) {
                    setSelectedSubject(subject)
                  }
                }}
              >
                <SelectTrigger id="subject-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <div className="space-y-2">
                    <div className="px-2 py-1 text-sm font-medium text-muted-foreground">初中</div>
                    {SUBJECTS.filter(s => s.category === '初中').map((subject) => (
                      <SelectItem 
                        key={`${subject.studyPhaseCode}-${subject.subjectCode}`}
                        value={`${subject.studyPhaseCode}-${subject.subjectCode}`}
                      >
                        {subject.name}
                      </SelectItem>
                    ))}
                    <Separator />
                    <div className="px-2 py-1 text-sm font-medium text-muted-foreground">高中</div>
                    {SUBJECTS.filter(s => s.category === '高中').map((subject) => (
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
              <p className="text-sm text-muted-foreground">
                当前选择：{selectedSubject.category} - {selectedSubject.name}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

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
          <AnalysisResultDisplay
            imageUrl={imageUrl}
            knowledgePoint={knowledgePoint}
            solutionSteps={solutionSteps}
            problems={problems}
            showOriginalImage={true}
            originalImageName={selectedFile?.name}
          />

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
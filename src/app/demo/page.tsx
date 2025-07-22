"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { UploadZone } from "@/components/upload/upload-zone"
import { 
  Upload, 
  Brain, 
  Target, 
  Bookmark,
  ExternalLink,
  Star,
  Clock,
  Tag
} from "lucide-react"
import { toast } from "sonner"

// 模拟题目数据
const mockProblems = [
  {
    id: "1",
    title: "二次函数图像与性质",
    content: "已知二次函数f(x)=ax²+bx+c的图像经过点(1,0)和(3,0)，且f(0)=3，求a、b、c的值。",
    difficulty: "medium" as const,
    tags: ["二次函数", "图像", "性质"],
    similarity: 95,
    estimatedTime: 15,
  },
  {
    id: "2", 
    title: "二次函数的最值问题",
    content: "求函数f(x)=x²-4x+3在区间[0,4]上的最大值和最小值。",
    difficulty: "easy" as const,
    tags: ["二次函数", "最值", "区间"],
    similarity: 88,
    estimatedTime: 12,
  },
  {
    id: "3",
    title: "二次函数的应用",
    content: "一个物体从高度h米自由落下，经过t秒后的高度为h-4.9t²米。如果物体从100米高度落下，求物体落地的时间。",
    difficulty: "hard" as const,
    tags: ["二次函数", "应用", "物理"],
    similarity: 82,
    estimatedTime: 20,
  },
]

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

export default function DemoPage() {
  const [currentStep, setCurrentStep] = useState<'upload' | 'analyzing' | 'complete'>('upload')
  const [progress, setProgress] = useState(0)
  const [showResults, setShowResults] = useState(false)


  const handleFileSelect = (file: File) => {
    toast.success(`已选择文件: ${file.name}`)
  }

  const handleUpload = async () => {
    setCurrentStep('analyzing')
    setProgress(0)

    // 模拟分析过程
    for (let i = 0; i <= 100; i += 20) {
      await new Promise(resolve => setTimeout(resolve, 500))
      setProgress(i)
    }

    setCurrentStep('complete')
    setShowResults(true)
    toast.success("分析完成！")
  }

  const handleViewProblem = (id: string) => {
    toast.info(`查看题目详情: ${id}`)
  }

  const handleSaveProblem = (id: string) => {
    toast.success(`已保存题目: ${id}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            AI助手演示
          </h1>
          <p className="text-xl text-gray-600">
            体验智能题目分析功能
          </p>
        </div>

        {currentStep === 'upload' && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                上传题目图片
              </CardTitle>
              <CardDescription>
                支持PNG、JPG格式，最大10MB
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UploadZone
                onFileSelect={handleFileSelect}
                onUpload={handleUpload}
                accept="image/*"
                maxSize={10 * 1024 * 1024}
                preview={true}
              />
            </CardContent>
          </Card>
        )}

        {currentStep === 'analyzing' && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                AI分析中
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span>分析进度</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Target className="h-4 w-4" />
                <span>识别知识点...</span>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 'complete' && showResults && (
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
                  高中数学 → 函数 → 二次函数
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {mockProblems.map((problem) => (
                    <Card key={problem.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg line-clamp-2">
                              {problem.title}
                            </CardTitle>
                            <CardDescription className="mt-2 line-clamp-3">
                              {problem.content}
                            </CardDescription>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSaveProblem(problem.id)}
                            className="ml-2"
                          >
                            <Bookmark className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {/* 相似度评分 */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">相似度</span>
                            <span className="font-medium">{problem.similarity}%</span>
                          </div>
                          <Progress value={problem.similarity} className="h-2" />
                        </div>

                        {/* 标签和难度 */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className={difficultyColors[problem.difficulty]}>
                              {difficultyLabels[problem.difficulty]}
                            </Badge>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>{problem.estimatedTime}分钟</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-500" />
                            <span className="text-sm text-muted-foreground">
                              {problem.similarity >= 90 ? '极高' : 
                               problem.similarity >= 70 ? '高' : 
                               problem.similarity >= 50 ? '中等' : '低'}
                            </span>
                          </div>
                        </div>

                        {/* 标签 */}
                        <div className="flex items-center gap-1 flex-wrap">
                          <Tag className="h-3 w-3 text-muted-foreground" />
                          {problem.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>

                        {/* 操作按钮 */}
                        <div className="flex gap-2 pt-2">
                          <Button 
                            variant="default" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => handleViewProblem(problem.id)}
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            查看详情
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleSaveProblem(problem.id)}
                          >
                            <Bookmark className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 操作按钮 */}
            <div className="flex justify-center gap-4">
              <Button onClick={() => {
                setCurrentStep('upload')
                setProgress(0)
                setShowResults(false)
              }}>
                重新分析
              </Button>
              <Button variant="outline">
                保存结果
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 
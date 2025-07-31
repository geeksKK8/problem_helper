"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, Clock } from "lucide-react"
import KatexHtmlRenderer from "@/components/ui/katex-html-renderer"

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
  estimatedTime?: number
  source?: string
}

interface AnalysisResultDisplayProps {
  imageUrl?: string
  knowledgePoint: string
  solutionSteps?: SolutionStep[]
  problems: Problem[]
  showOriginalImage?: boolean
  originalImageName?: string
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

export function AnalysisResultDisplay({ 
  imageUrl, 
  knowledgePoint, 
  solutionSteps, 
  problems,
  showOriginalImage = true,
  originalImageName
}: AnalysisResultDisplayProps) {

  return (
    <div className="space-y-6">
      {/* 原图显示 */}
      {showOriginalImage && imageUrl && (
        <Card>
          <CardHeader>
            <CardTitle>原始题目</CardTitle>
            <CardDescription>
              {originalImageName ? `${originalImageName}` : '您上传的题目图片'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <img 
                src={imageUrl} 
                alt="原始题目图片" 
                className="max-w-full h-auto rounded-lg border shadow-sm"
                style={{ maxHeight: '400px' }}
              />
            </div>
          </CardContent>
        </Card>
      )}

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

      {/* 解题过程 */}
      {solutionSteps && solutionSteps.length > 0 && (
        <Card>
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
            {solutionSteps.map((step, index) => (
              <div key={step.step} className="space-y-3">
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
                    />
                  </div>
                  
                  {step.formula && (
                    <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-primary">
                      <div className="text-sm font-medium text-gray-600 mb-2">相关公式：</div>
                      <div className="text-center">
                        <KatexHtmlRenderer 
                          html={`$$${step.formula}$$`}
                          className="text-lg"
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                {index < solutionSteps.length - 1 && (
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
      {problems && problems.length > 0 && (
        <div className="space-y-4">
          {problems.map((problem) => (
            <div key={problem.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="space-y-2">
                <div className="text-sm text-gray-600">
                  <KatexHtmlRenderer 
                    html={problem.content}
                    className="text-sm"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={difficultyColors[problem.difficulty]}>
                    {difficultyLabels[problem.difficulty]}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    相似度: {(problem.similarity * 100).toFixed(1)}%
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
      )}
    </div>
  )
} 
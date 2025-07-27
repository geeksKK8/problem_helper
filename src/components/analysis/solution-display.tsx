"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import KatexHtmlRenderer from "@/components/ui/katex-html-renderer"
import { CheckCircle } from "lucide-react"

interface SolutionStep {
  step: number
  title: string
  content: string
  formula?: string
}

interface SolutionDisplayProps {
  solutionSteps: SolutionStep[]
  knowledgePoint?: string
}

export function SolutionDisplay({ solutionSteps, knowledgePoint }: SolutionDisplayProps) {
  if (!solutionSteps || solutionSteps.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary" />
            解题过程
          </CardTitle>
          <CardDescription>
            AI生成的详细解题步骤
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">暂无解题过程</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-primary" />
          解题过程
        </CardTitle>
        <CardDescription>
          AI分析生成的详细解题步骤
        </CardDescription>
        {knowledgePoint && (
          <div className="pt-2">
            <Badge variant="secondary" className="text-sm">
              知识点：{knowledgePoint.split(' -> ').pop()}
            </Badge>
          </div>
        )}
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
  )
} 
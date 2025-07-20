"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Upload, 
  Brain, 
  Target, 
  CheckCircle, 
  X,
  AlertCircle 
} from "lucide-react"

interface AnalysisProgressProps {
  currentStep: 'upload' | 'analyzing' | 'selecting' | 'complete' | 'error'
  progress: number
  message: string
  onCancel?: () => void
  onRetry?: () => void
}

const steps = [
  { key: 'upload', label: '上传图片', icon: Upload },
  { key: 'analyzing', label: 'AI分析', icon: Brain },
  { key: 'selecting', label: '选择知识点', icon: Target },
  { key: 'complete', label: '完成', icon: CheckCircle },
]

export function AnalysisProgress({
  currentStep,
  progress,
  message,
  onCancel,
  onRetry,
}: AnalysisProgressProps) {
  const currentStepIndex = steps.findIndex(step => step.key === currentStep)
  const isError = currentStep === 'error'

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isError ? (
            <AlertCircle className="h-5 w-5 text-destructive" />
          ) : (
            <Brain className="h-5 w-5 text-primary" />
          )}
          {isError ? '分析失败' : 'AI分析中'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 步骤指示器 */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isActive = index === currentStepIndex
            const isCompleted = index < currentStepIndex
            const isError = currentStep === 'error' && index === currentStepIndex

            return (
              <div key={step.key} className="flex items-center">
                <div className={`
                  flex items-center justify-center w-8 h-8 rounded-full
                  ${isCompleted 
                    ? 'bg-primary text-primary-foreground' 
                    : isActive 
                    ? 'bg-primary/20 text-primary border-2 border-primary'
                    : 'bg-muted text-muted-foreground'
                  }
                `}>
                  {isCompleted ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : isError ? (
                    <X className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>
                <span className={`
                  ml-2 text-sm font-medium
                  ${isActive ? 'text-primary' : 'text-muted-foreground'}
                `}>
                  {step.label}
                </span>
                {index < steps.length - 1 && (
                  <div className={`
                    w-8 h-0.5 mx-2
                    ${isCompleted ? 'bg-primary' : 'bg-muted'}
                  `} />
                )}
              </div>
            )
          })}
        </div>

        {/* 进度条 */}
        {!isError && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>{message}</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}

        {/* 错误提示 */}
        {isError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        {/* 操作按钮 */}
        <div className="flex gap-2">
          {onCancel && !isError && (
            <Button variant="outline" onClick={onCancel}>
              取消
            </Button>
          )}
          {onRetry && isError && (
            <Button onClick={onRetry}>
              重试
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 
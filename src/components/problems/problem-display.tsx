"use client"

import { Button } from "@/components/ui/button"
import KatexHtmlRenderer from "@/components/ui/katex-html-renderer"
import { 
  Bookmark, 
  ExternalLink,
  Clock,
  Star
} from "lucide-react"
import type { Problem } from "@/types"

interface ProblemDisplayProps {
  problem: Problem
  onView: (id: string) => void
  onSave: (id: string) => void
  saved?: boolean
}

export function ProblemDisplay({
  problem,
  onView,
  onSave,
  saved = false,
}: ProblemDisplayProps) {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      {/* 题目内容 */}
      <div className="prose max-w-none">
        <KatexHtmlRenderer 
          html={problem.content} 
          className="text-base leading-relaxed"
        />
      </div>
      
      {/* 题目信息 */}
      <div className="flex items-center justify-between pt-3 border-t">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4" />
            <span>相似度: {problem.similarity}%</span>
          </div>
          {problem.estimatedTime && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>预计时间: {problem.estimatedTime}分钟</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <span>来源: {problem.source}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onView(problem.id)}
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            查看详情
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onSave(problem.id)}
          >
            <Bookmark className={`h-4 w-4 mr-1 ${saved ? 'fill-current' : ''}`} />
            保存
          </Button>
        </div>
      </div>
    </div>
  )
} 
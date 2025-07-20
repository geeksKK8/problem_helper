"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import KatexHtmlRenderer from "@/components/ui/katex-html-renderer"
import { 
  Bookmark, 
  ExternalLink, 
  Star,
  Clock,
  Tag
} from "lucide-react"
import type { Problem } from "@/types"

interface ProblemCardProps {
  problem: Problem
  onView: (id: string) => void
  onSave: (id: string) => void
  saved?: boolean
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

export function ProblemCard({
  problem,
  onView,
  onSave,
  saved = false,
}: ProblemCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-2">
              {problem.title}
            </CardTitle>
            <CardDescription className="mt-2 line-clamp-3">
              <KatexHtmlRenderer 
                html={problem.content} 
                className="text-sm text-muted-foreground"
              />
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSave(problem.id)}
            className="ml-2"
          >
            <Bookmark className={`h-4 w-4 ${saved ? 'fill-current' : ''}`} />
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
            {problem.estimatedTime && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{problem.estimatedTime}分钟</span>
              </div>
            )}
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
        {problem.tags.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            <Tag className="h-3 w-3 text-muted-foreground" />
            {problem.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {problem.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{problem.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex gap-2 pt-2">
          <Button 
            variant="default" 
            size="sm" 
            className="flex-1"
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
            <Bookmark className={`h-4 w-4 ${saved ? 'fill-current' : ''}`} />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 
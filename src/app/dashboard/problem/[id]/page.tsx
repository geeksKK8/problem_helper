import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import KatexHtmlRenderer from "@/components/ui/katex-html-renderer"
import { 
  Bookmark, 
  ArrowLeft,
  Star,
  Clock,
  Tag,
  ExternalLink
} from "lucide-react"
import Link from "next/link"
import type { Problem } from "@/types"

interface ProblemDetailPageProps {
  params: Promise<{
    id: string
  }>
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

export default async function ProblemDetailPage({ params }: ProblemDetailPageProps) {
  const resolvedParams = await params
  
  // 这里可以从API获取题目详情，现在使用模拟数据
  const problem: Problem = {
    id: resolvedParams.id,
    title: "圆锥体积与最短距离问题",
    content: `<p>5．已知在圆锥<i>SO</i>中，底面圆<i>O</i>的直径 $ AB=2 $ ，圆锥<i>SO</i>的体积为 $ \\dfrac { 2\\sqrt { 2 } } { 3 }{ \\rm{ π } } $ ，点<i>M</i>在母线<i>SB</i>上，且 $ \\overrightarrow {{ SM }}=\\dfrac { 1 } { 3 }\\overrightarrow {{ SB }} $ ，一只蚂蚁若从<i>A</i>点出发，沿圆锥侧面爬行到达<i>M</i>点，则它爬行的最短距离为（&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;）</p><p><img src="https://cdn.stzy.com/zhizhi/Paper/0/2025/07/16/2/1/0/0/0/600479939335335940/images/img_4.png" style="vertical-align:middle;" width="148" alt="试题资源网 https://stzy.com"></p><p>A． $ \\sqrt { 7 } $ B． $ \\sqrt { 13 } $ C． $ \\sqrt { 19 } $ D． $ 3\\sqrt { 3 } $ </p>`,
    difficulty: "hard",
    tags: ["圆锥", "体积", "最短距离", "向量"],
    similarity: 95,
    estimatedTime: 15,
    source: "题库"
  }



  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <Link href="/dashboard" className="inline-flex items-center">
          <Button variant="ghost">
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
        </Link>
        <Button variant="outline">
          <Bookmark className="h-4 w-4 mr-2" />
          保存题目
        </Button>
      </div>

      {/* 题目详情卡片 */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl mb-2">{problem.title}</CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4" />
                  <span>相似度 {problem.similarity}%</span>
                </div>
                {problem.estimatedTime && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>预计 {problem.estimatedTime} 分钟</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <ExternalLink className="h-4 w-4" />
                  <span>来源: {problem.source}</span>
                </div>
              </div>
            </div>
            <Badge variant="secondary" className={difficultyColors[problem.difficulty]}>
              {difficultyLabels[problem.difficulty]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 相似度评分 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">相似度评分</span>
              <span className="font-medium">{problem.similarity}%</span>
            </div>
            <Progress value={problem.similarity} className="h-2" />
            <div className="text-sm text-muted-foreground">
              {problem.similarity >= 90 ? '极高相似度' : 
               problem.similarity >= 70 ? '高相似度' : 
               problem.similarity >= 50 ? '中等相似度' : '低相似度'}
            </div>
          </div>

          {/* 题目内容 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">题目内容</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <KatexHtmlRenderer 
                html={problem.content} 
                className="text-base leading-relaxed"
              />
            </div>
          </div>

          {/* 标签 */}
          {problem.tags.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">相关标签</h3>
              <div className="flex items-center gap-2 flex-wrap">
                <Tag className="h-4 w-4 text-muted-foreground" />
                {problem.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex gap-4 pt-4">
            <Button variant="default" className="flex-1">
              开始解答
            </Button>
            <Button variant="outline">
              查看解析
            </Button>
            <Button variant="outline">
              分享题目
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 
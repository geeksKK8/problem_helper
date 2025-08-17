"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Eye, Download, Save, X, ChevronUp } from "lucide-react"
import { ProblemDisplay } from "@/components/problems/problem-display"
import type { Problem } from "@/types"

interface BatchResult {
  file: File
  result: {
    knowledgePoint: string
    problems: Problem[]
  }
  subject: {
    studyPhaseCode: string
    subjectCode: string
    name: string
    category: string
  }
}

interface BatchResultDisplayProps {
  results: BatchResult[]
  onClear: () => void
  onExport: () => void
}

export function BatchResultDisplay({ results, onClear, onExport }: BatchResultDisplayProps) {
  const [expandedResults, setExpandedResults] = useState<Set<number>>(new Set())

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedResults)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedResults(newExpanded)
  }

  const handleSaveResult = (result: BatchResult) => {
    // TODO: 实现保存单个结果的功能
    console.log('保存结果:', result)
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'hard':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>批量分析结果</CardTitle>
          <CardDescription>
            共完成 {results.length} 个文件的分析
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {results.map((result, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <h3 className="font-medium text-lg">{result.file.name}</h3>
                    <Badge variant="outline">
                      {result.subject.category} - {result.subject.name}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => toggleExpanded(index)}
                    >
                      {expandedResults.has(index) ? (
                        <>
                          <ChevronUp className="h-4 w-4 mr-1" />
                          收起详情
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-1" />
                          查看详情
                        </>
                      )}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleSaveResult(result)}
                    >
                      <Save className="h-4 w-4 mr-1" />
                      保存结果
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">知识点:</span>
                    <p className="font-medium">{result.result.knowledgePoint}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">推荐题目:</span>
                    <p className="font-medium">{result.result.problems.length} 道</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">平均相似度:</span>
                    <p className="font-medium">
                      {result.result.problems.length > 0 
                        ? `${(result.result.problems.reduce((sum, p) => sum + p.similarity, 0) / result.result.problems.length * 100).toFixed(1)}%`
                        : 'N/A'
                      }
                    </p>
                  </div>
                </div>

                {/* 题目预览 */}
                {result.result.problems.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">题目预览</h4>
                    <div className="space-y-2">
                      {result.result.problems.slice(0, 3).map((problem, problemIndex) => (
                        <div key={problemIndex} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{problem.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className={getDifficultyColor(problem.difficulty)}>
                                {problem.difficulty === 'easy' ? '简单' : 
                                 problem.difficulty === 'medium' ? '中等' : '困难'}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                相似度: {(problem.similarity * 100).toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                      {result.result.problems.length > 3 && (
                        <p className="text-sm text-muted-foreground text-center">
                          还有 {result.result.problems.length - 3} 道题目...
                        </p>
                      )}
                                         </div>
                   </div>
                 )}

                 {/* 展开的详情内容 */}
                 {expandedResults.has(index) && (
                   <div className="mt-4 pt-4 border-t">
                     <div className="space-y-4">
                       <div>
                         <h4 className="font-medium mb-2">知识点详情</h4>
                         <p className="text-muted-foreground">{result.result.knowledgePoint}</p>
                       </div>
                       <Separator />
                       <div>
                         <h4 className="font-medium mb-3">推荐题目详情 ({result.result.problems.length} 道)</h4>
                         <div className="space-y-3">
                           {result.result.problems.map((problem, problemIndex) => (
                             <ProblemDisplay
                               key={problem.id || problemIndex}
                               problem={problem}
                               onView={() => console.log('查看题目:', problem.id)}
                               onSave={() => console.log('保存题目:', problem.id)}
                             />
                           ))}
                         </div>
                       </div>
                     </div>
                   </div>
                 )}
               </div>
             ))}
           </div>
          
          <Separator className="my-6" />
          
          <div className="flex gap-4">
            <Button onClick={onClear} variant="outline">
              <X className="h-4 w-4 mr-1" />
              清空结果
            </Button>
            <Button onClick={onExport}>
              <Download className="h-4 w-4 mr-1" />
              导出所有结果
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 
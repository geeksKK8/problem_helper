import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-8">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-6xl">
            AI助手
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            基于人工智能的智能题目分析助手，帮助您快速找到相关的数学题目
          </p>
          <div className="flex justify-center gap-4">
            <Button asChild size="lg">
              <Link href="/demo">体验演示</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/login">开始使用</Link>
            </Button>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>智能分析</CardTitle>
              <CardDescription>
                上传数学题目图片，AI自动识别知识点
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                使用先进的计算机视觉技术，准确识别题目类型和知识点
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>精准推荐</CardTitle>
              <CardDescription>
                基于相似度算法推荐最相关的题目
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                从海量题库中筛选出最相似的题目，提高学习效率
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>历史记录</CardTitle>
              <CardDescription>
                保存分析历史，随时查看过往记录
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                完整记录您的分析历史，方便回顾和对比
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 
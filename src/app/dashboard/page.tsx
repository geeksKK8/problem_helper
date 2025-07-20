import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Upload, 
  History, 
  TrendingUp, 
  CheckCircle,
  Clock,
  AlertCircle
} from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  // 模拟数据
  const stats = [
    { title: "总分析次数", value: "1,234", icon: TrendingUp, color: "text-blue-600" },
    { title: "本月分析", value: "156", icon: Clock, color: "text-green-600" },
    { title: "成功率", value: "98.5%", icon: CheckCircle, color: "text-purple-600" },
  ]

  const recentActivity = [
    {
      id: "1",
      date: "2024-01-15 14:30",
      type: "题目分析",
      status: "completed",
      knowledgePoint: "高中数学 -> 函数 -> 二次函数",
    },
    {
      id: "2", 
      date: "2024-01-15 10:15",
      type: "题目分析",
      status: "completed",
      knowledgePoint: "高中数学 -> 几何 -> 三角函数",
    },
    {
      id: "3",
      date: "2024-01-14 16:45", 
      type: "题目分析",
      status: "failed",
      knowledgePoint: "高中数学 -> 代数 -> 不等式",
    },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default">已完成</Badge>
      case "processing":
        return <Badge variant="secondary">处理中</Badge>
      case "failed":
        return <Badge variant="destructive">失败</Badge>
      default:
        return <Badge variant="outline">未知</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold">仪表板</h1>
        <p className="text-muted-foreground">
          欢迎回来！这里是您的AI助手概览
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 快速操作 */}
      <Card>
        <CardHeader>
          <CardTitle>快速操作</CardTitle>
          <CardDescription>
            快速开始您的分析工作
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button asChild>
              <Link href="/dashboard/analyze">
                <Upload className="mr-2 h-4 w-4" />
                上传新题目
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard/history">
                <History className="mr-2 h-4 w-4" />
                查看历史
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 最近活动 */}
      <Card>
        <CardHeader>
          <CardTitle>最近活动</CardTitle>
          <CardDescription>
            您最近的分析记录
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>时间</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>知识点</TableHead>
                <TableHead>状态</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentActivity.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell className="font-medium">
                    {activity.date}
                  </TableCell>
                  <TableCell>{activity.type}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {activity.knowledgePoint}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(activity.status)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
} 
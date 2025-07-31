"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertCircle, Clock, CheckCircle, XCircle, Search, Filter, Eye, Trash2 } from "lucide-react"
import { apiClient } from "@/lib/api"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import type { HistoryItem, HistoryQueryParams } from "@/types"

const statusIcons = {
  completed: <CheckCircle className="h-4 w-4 text-green-500" />,
  processing: <Clock className="h-4 w-4 text-yellow-500" />,
  failed: <XCircle className="h-4 w-4 text-red-500" />,
}

const statusLabels = {
  completed: '已完成',
  processing: '分析中',
  failed: '失败',
}

const statusColors = {
  completed: 'bg-green-100 text-green-800',
  processing: 'bg-yellow-100 text-yellow-800',
  failed: 'bg-red-100 text-red-800',
}

export default function HistoryPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [records, setRecords] = useState<HistoryItem[]>([])
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  
  // 筛选参数
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'processing' | 'failed'>('all')
  const [dateFilter, setDateFilter] = useState<'all' | '7days' | '30days' | '90days'>('all')

  // 选择和删除状态
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [deleting, setDeleting] = useState(false)

  // 加载历史记录
  const loadHistory = useCallback(async (params: HistoryQueryParams = {}) => {
    try {
      setLoading(true)
      
      // 构建查询参数
      const queryParams: HistoryQueryParams = {
        page: params.page || currentPage,
        limit: 10,
        ...params
      }
      
      if (statusFilter !== 'all') {
        queryParams.status = statusFilter
      }
      
      if (searchTerm.trim()) {
        queryParams.search = searchTerm.trim()
      }
      
      // 设置日期筛选
      if (dateFilter !== 'all') {
        const now = new Date()
        const days = {
          '7days': 7,
          '30days': 30,
          '90days': 90
        }[dateFilter]
        
        if (days) {
          const fromDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
          queryParams.dateFrom = fromDate.toISOString().split('T')[0]
        }
      }

      const result = await apiClient.getAnalysisHistory(queryParams)
      
      if (result.success && result.data) {
        setRecords(result.data.records)
        setTotal(result.data.total)
        setHasMore(result.data.hasMore)
      } else {
        throw new Error(result.error || '获取历史记录失败')
      }
    } catch (error) {
      console.error('加载历史记录失败:', error)
      toast.error(error instanceof Error ? error.message : '加载历史记录失败')
    } finally {
      setLoading(false)
    }
  }, [currentPage, statusFilter, searchTerm, dateFilter])

  // 初始加载
  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  // 搜索和筛选变化时重新加载
  useEffect(() => {
    if (currentPage === 1) {
      loadHistory()
    } else {
      setCurrentPage(1)
    }
  }, [searchTerm, statusFilter, dateFilter])

  // 查看详情
  const handleViewDetail = (id: string) => {
    router.push(`/dashboard/history/${id}`)
  }

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 格式化相似度
  const formatSimilarity = (similarity: number) => {
    return `${similarity.toFixed(1)}%`
  }

  // 处理选择记录
  const handleSelectRecord = (recordId: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, recordId])
    } else {
      setSelectedIds(prev => prev.filter(id => id !== recordId))
    }
  }

  // 处理全选
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(records.map(record => record.id))
    } else {
      setSelectedIds([])
    }
  }

  // 删除选中的记录
  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) {
      toast.error('请选择要删除的记录')
      return
    }

    if (!confirm(`确定要删除 ${selectedIds.length} 条记录吗？此操作不可撤销。`)) {
      return
    }

    try {
      setDeleting(true)
      const result = await apiClient.deleteAnalysisHistory(selectedIds)
      
      if (result.success) {
        toast.success(`成功删除 ${result.deletedCount} 条记录`)
        setSelectedIds([])
        // 重新加载当前页数据
        loadHistory({ page: currentPage })
      } else {
        toast.error(result.error || '删除失败')
      }
    } catch (error) {
      toast.error('删除记录时发生错误')
      console.error('删除记录失败:', error)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">分析历史</h1>
        <p className="text-muted-foreground">查看和管理您的题目分析记录</p>
      </div>

      {/* 筛选和搜索 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            筛选和搜索
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4">
            {/* 搜索框 */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索知识点或文件名..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {/* 状态筛选 */}
            <Select value={statusFilter} onValueChange={(value: 'all' | 'completed' | 'processing' | 'failed') => setStatusFilter(value)}>
              <SelectTrigger className="w-full lg:w-40">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="completed">已完成</SelectItem>
                <SelectItem value="processing">分析中</SelectItem>
                <SelectItem value="failed">失败</SelectItem>
              </SelectContent>
            </Select>
            
            {/* 日期筛选 */}
            <Select value={dateFilter} onValueChange={(value: 'all' | '7days' | '30days' | '90days') => setDateFilter(value)}>
              <SelectTrigger className="w-full lg:w-40">
                <SelectValue placeholder="时间范围" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部时间</SelectItem>
                <SelectItem value="7days">最近7天</SelectItem>
                <SelectItem value="30days">最近30天</SelectItem>
                <SelectItem value="90days">最近90天</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 历史记录列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>历史记录</span>
            <span className="text-sm text-muted-foreground">
              共 {total} 条记录
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            /* 加载状态 */
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : records.length === 0 ? (
            /* 空状态 */
            <div className="text-center py-12">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">暂无历史记录</h3>
              <p className="mt-2 text-muted-foreground">
                开始分析题目，创建您的第一条记录
              </p>
              <Button 
                className="mt-4" 
                onClick={() => router.push('/dashboard/analyze')}
              >
                开始分析
              </Button>
            </div>
          ) : (
            /* 记录列表 */
            <div className="space-y-4">
              {/* 批量操作工具栏 */}
              {selectedIds.length > 0 && (
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg mb-4">
                  <span className="text-sm text-muted-foreground">
                    已选中 {selectedIds.length} 条记录
                  </span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteSelected}
                    disabled={deleting}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {deleting ? '删除中...' : '删除选中'}
                  </Button>
                </div>
              )}

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedIds.length === records.length && records.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>图片</TableHead>
                    <TableHead>知识点</TableHead>
                    <TableHead>题目数量</TableHead>
                    <TableHead>相似度</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>分析时间</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record.id}>
                      {/* 选择框 */}
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(record.id)}
                          onCheckedChange={(checked) => handleSelectRecord(record.id, checked as boolean)}
                        />
                      </TableCell>
                      
                      {/* 图片预览 */}
                      <TableCell>
                        <img
                          src={record.imageUrl}
                          alt={record.originalImageName}
                          className="h-12 w-12 rounded object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder-image.png'
                          }}
                        />
                      </TableCell>
                      
                      {/* 知识点 */}
                      <TableCell>
                        <div>
                          <div className="font-medium">{record.knowledgePoint}</div>
                          <div className="text-sm text-muted-foreground">
                            {record.originalImageName}
                          </div>
                        </div>
                      </TableCell>
                      
                      {/* 题目数量 */}
                      <TableCell>
                        <Badge variant="secondary">
                          {record.problemCount} 道题目
                        </Badge>
                      </TableCell>
                      
                      {/* 相似度 */}
                      <TableCell>
                        <div className="text-sm">
                          {formatSimilarity(record.avgSimilarity)}
                        </div>
                      </TableCell>
                      
                      {/* 状态 */}
                      <TableCell>
                        <Badge className={statusColors[record.status]}>
                          <div className="flex items-center gap-1">
                            {statusIcons[record.status]}
                            {statusLabels[record.status]}
                          </div>
                        </Badge>
                      </TableCell>
                      
                      {/* 时间 */}
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(record.date)}
                        </div>
                      </TableCell>
                      
                      {/* 操作 */}
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetail(record.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          查看
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {/* 分页 */}
              {total > 10 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    显示第 {(currentPage - 1) * 10 + 1} - {Math.min(currentPage * 10, total)} 条，共 {total} 条记录
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => prev - 1)}
                    >
                      上一页
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!hasMore}
                      onClick={() => setCurrentPage(prev => prev + 1)}
                    >
                      下一页
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 
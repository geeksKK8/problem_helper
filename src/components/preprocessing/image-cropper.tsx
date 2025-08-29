"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { 
  Trash2, 
  Check,
  X,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  RotateCw
} from "lucide-react"

// 科目类型定义
interface Subject {
  studyPhaseCode: string
  subjectCode: string
  name: string
  category: string
}

// 剪裁区域类型
interface CropArea {
  id: string
  x: number
  y: number
  width: number
  height: number
  subject: Subject
}

interface ImageCropperProps {
  imageUrl: string
  defaultSubject: Subject
  subjects: Subject[]
  onComplete: (areas: CropArea[], croppedCanvases: HTMLCanvasElement[]) => void
  onCancel: () => void
  currentImageIndex?: number // 当前图片索引
  totalImages?: number // 总图片数量
}

export function ImageCropper({ 
  imageUrl, 
  defaultSubject, 
  subjects, 
  onComplete, 
  onCancel,
  currentImageIndex = 0,
  totalImages = 1
}: ImageCropperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const [cropAreas, setCropAreas] = useState<CropArea[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentArea, setCurrentArea] = useState<Partial<CropArea> | null>(null)
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [imageScale, setImageScale] = useState(1)
  const [imageOffset, setImageOffset] = useState({ x: 0, y: 0 })
  
  // 新增：缩放相关状态
  const [isResizing, setIsResizing] = useState(false)
  const [resizeHandle, setResizeHandle] = useState<'nw' | 'ne' | 'sw' | 'se' | null>(null)
  const [resizeStartArea, setResizeStartArea] = useState<CropArea | null>(null)
  
  // 新增：图片缩放控制状态
  const [userScale, setUserScale] = useState(1) // 用户自定义缩放比例
  const [originalImageScale, setOriginalImageScale] = useState(1) // 原始适配缩放比例

  // 当图片URL改变时重置剪裁区域
  useEffect(() => {
    setCropAreas([])
    setSelectedAreaId(null)
    setIsDrawing(false)
    setCurrentArea(null)
    setIsDragging(false)
    setIsResizing(false)
    setResizeHandle(null)
    setResizeStartArea(null)
    setUserScale(1) // 重置用户缩放比例
  }, [imageUrl])

  // 初始化画布
  useEffect(() => {
    const canvas = canvasRef.current
    const image = imageRef.current
    if (!canvas || !image) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    image.onload = () => {
      // 计算适合的缩放比例
      const containerWidth = canvas.parentElement?.clientWidth || 800
      const containerHeight = 600
      const scaleX = containerWidth / image.naturalWidth
      const scaleY = containerHeight / image.naturalHeight
      const scale = Math.min(scaleX, scaleY, 1)
      
      setOriginalImageScale(scale)
      setImageScale(scale * userScale)
      
      canvas.width = image.naturalWidth * scale * userScale
      canvas.height = image.naturalHeight * scale * userScale
      
      // 居中图片
      const offsetX = (containerWidth - canvas.width) / 2
      setImageOffset({ x: Math.max(0, offsetX), y: 0 })
      
      drawCanvas()
    }
    
    if (image.complete) {
      image.onload(null as unknown as Event)
    }
  }, [imageUrl])

  // 绘制画布
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const image = imageRef.current
    if (!canvas || !image) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // 绘制图片
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
    
    // 绘制剪裁区域
    cropAreas.forEach(area => {
      // 内联绘制剪裁区域函数
      if (!area.x || !area.y || !area.width || !area.height) return

      const x = area.x * imageScale
      const y = area.y * imageScale
      const width = area.width * imageScale
      const height = area.height * imageScale

      // 绘制矩形边框
      ctx.strokeStyle = area.id === selectedAreaId ? '#3b82f6' : '#6b7280'
      ctx.lineWidth = 2
      ctx.setLineDash([])
      ctx.strokeRect(x, y, width, height)
      
      // 绘制半透明覆盖
      if (area.id === selectedAreaId) {
        ctx.fillStyle = 'rgba(59, 130, 246, 0.1)'
        ctx.fillRect(x, y, width, height)
      }
      
      // 绘制调整手柄
      if (area.id === selectedAreaId) {
        const handleSize = 8
        ctx.fillStyle = '#3b82f6'
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 1
        
        // 四个角的手柄
        const handles = [
          { x: x - handleSize/2, y: y - handleSize/2 }, // 左上
          { x: x + width - handleSize/2, y: y - handleSize/2 }, // 右上
          { x: x - handleSize/2, y: y + height - handleSize/2 }, // 左下
          { x: x + width - handleSize/2, y: y + height - handleSize/2 } // 右下
        ]
        
        handles.forEach(handle => {
          ctx.fillRect(handle.x, handle.y, handleSize, handleSize)
          ctx.strokeRect(handle.x, handle.y, handleSize, handleSize)
        })
      }
    })
    
    // 绘制当前正在创建的区域
    if (currentArea && currentArea.x !== undefined && currentArea.y !== undefined && 
        currentArea.width !== undefined && currentArea.height !== undefined) {
      const x = currentArea.x * imageScale
      const y = currentArea.y * imageScale
      const width = currentArea.width * imageScale
      const height = currentArea.height * imageScale

      // 绘制矩形边框
      ctx.strokeStyle = '#10b981'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.strokeRect(x, y, width, height)
      
      // 绘制半透明覆盖
      ctx.fillStyle = 'rgba(16, 185, 129, 0.1)'
      ctx.fillRect(x, y, width, height)
      
      ctx.setLineDash([])
    }
  }, [cropAreas, selectedAreaId, currentArea, imageScale])



  // 重绘画布
  useEffect(() => {
    drawCanvas()
  }, [drawCanvas])

  // 监听用户缩放比例变化
  useEffect(() => {
    const canvas = canvasRef.current
    const image = imageRef.current
    if (!canvas || !image) return

    const newScale = originalImageScale * userScale
    setImageScale(newScale)
    
    canvas.width = image.naturalWidth * newScale
    canvas.height = image.naturalHeight * newScale
    
    // 重新计算居中偏移
    const containerWidth = canvas.parentElement?.clientWidth || 800
    const offsetX = (containerWidth - canvas.width) / 2
    setImageOffset({ x: Math.max(0, offsetX), y: 0 })
    
    drawCanvas()
  }, [userScale, originalImageScale, drawCanvas])

  // 获取鼠标在画布上的位置
  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    
    const rect = canvas.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left) / imageScale,
      y: (e.clientY - rect.top) / imageScale
    }
  }

  // 检测是否点击了缩放手柄
  const getResizeHandle = (pos: { x: number, y: number }, area: CropArea): 'nw' | 'ne' | 'sw' | 'se' | null => {
    const handleSize = 8
    const x = area.x * imageScale
    const y = area.y * imageScale
    const width = area.width * imageScale
    const height = area.height * imageScale
    
    const mouseX = pos.x * imageScale
    const mouseY = pos.y * imageScale
    
    // 检查四个角的手柄
    if (Math.abs(mouseX - x) <= handleSize && Math.abs(mouseY - y) <= handleSize) return 'nw'
    if (Math.abs(mouseX - (x + width)) <= handleSize && Math.abs(mouseY - y) <= handleSize) return 'ne'
    if (Math.abs(mouseX - x) <= handleSize && Math.abs(mouseY - (y + height)) <= handleSize) return 'sw'
    if (Math.abs(mouseX - (x + width)) <= handleSize && Math.abs(mouseY - (y + height)) <= handleSize) return 'se'
    
    return null
  }

  // 鼠标按下
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e)
    
    // 检查是否点击了现有区域
    const clickedArea = cropAreas.find(area => 
      pos.x >= area.x && pos.x <= area.x + area.width &&
      pos.y >= area.y && pos.y <= area.y + area.height
    )
    
    if (clickedArea) {
      setSelectedAreaId(clickedArea.id)
      
      // 检查是否点击了缩放手柄
      const handle = getResizeHandle(pos, clickedArea)
      if (handle) {
        setIsResizing(true)
        setResizeHandle(handle)
        setResizeStartArea(clickedArea)
        setIsDragging(false)
      } else {
        // 开始拖拽移动
        setIsDragging(true)
        setIsResizing(false)
        setResizeHandle(null)
        setResizeStartArea(null)
        setDragOffset({
          x: pos.x - clickedArea.x,
          y: pos.y - clickedArea.y
        })
      }
    } else {
      // 开始创建新区域
      setIsDrawing(true)
      setSelectedAreaId(null)
      setIsDragging(false)
      setIsResizing(false)
      setResizeHandle(null)
      setResizeStartArea(null)
      setCurrentArea({
        id: `area-${Date.now()}`,
        x: pos.x,
        y: pos.y,
        width: 0,
        height: 0,
        subject: defaultSubject
      })
    }
  }

  // 鼠标移动
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e)
    const canvas = canvasRef.current
    
    // 处理鼠标样式
    if (canvas && !isDrawing && !isDragging && !isResizing) {
      const hoveredArea = cropAreas.find(area => 
        pos.x >= area.x && pos.x <= area.x + area.width &&
        pos.y >= area.y && pos.y <= area.y + area.height
      )
      
      if (hoveredArea) {
        const handle = getResizeHandle(pos, hoveredArea)
        if (handle) {
          canvas.style.cursor = 'nw-resize'
        } else {
          canvas.style.cursor = 'move'
        }
      } else {
        canvas.style.cursor = 'crosshair'
      }
    }
    
    if (isDrawing && currentArea) {
      setCurrentArea(prev => prev ? {
        ...prev,
        width: Math.abs(pos.x - prev.x!),
        height: Math.abs(pos.y - prev.y!)
      } : null)
    } else if (isDragging && selectedAreaId) {
      setCropAreas(prev => prev.map(area => 
        area.id === selectedAreaId ? {
          ...area,
          x: Math.max(0, pos.x - dragOffset.x),
          y: Math.max(0, pos.y - dragOffset.y)
        } : area
      ))
    } else if (isResizing && selectedAreaId && resizeStartArea && resizeHandle) {
      // 处理缩放
      setCropAreas(prev => prev.map(area => {
        if (area.id !== selectedAreaId) return area
        
        let newX = area.x
        let newY = area.y
        let newWidth = area.width
        let newHeight = area.height
        
        switch (resizeHandle) {
          case 'nw': // 左上角
            newWidth = Math.max(10, resizeStartArea.x + resizeStartArea.width - pos.x)
            newHeight = Math.max(10, resizeStartArea.y + resizeStartArea.height - pos.y)
            newX = resizeStartArea.x + resizeStartArea.width - newWidth
            newY = resizeStartArea.y + resizeStartArea.height - newHeight
            break
          case 'ne': // 右上角
            newWidth = Math.max(10, pos.x - resizeStartArea.x)
            newHeight = Math.max(10, resizeStartArea.y + resizeStartArea.height - pos.y)
            newX = resizeStartArea.x
            newY = resizeStartArea.y + resizeStartArea.height - newHeight
            break
          case 'sw': // 左下角
            newWidth = Math.max(10, resizeStartArea.x + resizeStartArea.width - pos.x)
            newHeight = Math.max(10, pos.y - resizeStartArea.y)
            newX = resizeStartArea.x + resizeStartArea.width - newWidth
            newY = resizeStartArea.y
            break
          case 'se': // 右下角
            newWidth = Math.max(10, pos.x - resizeStartArea.x)
            newHeight = Math.max(10, pos.y - resizeStartArea.y)
            newX = resizeStartArea.x
            newY = resizeStartArea.y
            break
        }
        
        return {
          ...area,
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight
        }
      }))
    }
  }

  // 鼠标抬起
  const handleMouseUp = () => {
    if (isDrawing && currentArea && currentArea.width! > 10 && currentArea.height! > 10) {
      setCropAreas(prev => [...prev, currentArea as CropArea])
      setSelectedAreaId(currentArea.id!)
    }
    
    setIsDrawing(false)
    setIsDragging(false)
    setIsResizing(false)
    setResizeHandle(null)
    setResizeStartArea(null)
    setCurrentArea(null)
  }



  // 删除区域
  const deleteArea = (id: string) => {
    setCropAreas(prev => prev.filter(area => area.id !== id))
    setSelectedAreaId(null)
  }

  // 缩放控制函数
  const handleZoomIn = () => {
    setUserScale(prev => Math.min(prev * 1.2, 3)) // 最大3倍缩放
  }

  const handleZoomOut = () => {
    setUserScale(prev => Math.max(prev / 1.2, 0.3)) // 最小0.3倍缩放
  }

  const handleResetZoom = () => {
    setUserScale(1)
  }

  // 更新区域科目
  const updateAreaSubject = (id: string, subject: Subject) => {
    setCropAreas(prev => prev.map(area => 
      area.id === id ? { ...area, subject } : area
    ))
  }

  // 完成剪裁
  const handleComplete = async () => {
    if (cropAreas.length === 0) return

    const canvas = canvasRef.current
    const image = imageRef.current
    if (!canvas || !image) return

    const croppedCanvases: HTMLCanvasElement[] = []

    for (const area of cropAreas) {
      const croppedCanvas = document.createElement('canvas')
      const croppedCtx = croppedCanvas.getContext('2d')
      if (!croppedCtx) continue

      croppedCanvas.width = area.width
      croppedCanvas.height = area.height

      // 从原始图片剪裁 - 使用原始坐标（不受缩放影响）
      croppedCtx.drawImage(
        image,
        area.x, area.y, area.width, area.height,
        0, 0, area.width, area.height
      )

      croppedCanvases.push(croppedCanvas)
    }

    onComplete(cropAreas, croppedCanvases)
  }

  // 重置
  const handleReset = () => {
    setCropAreas([])
    setSelectedAreaId(null)
    setCurrentArea(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">剪裁题目区域</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-1" />
            重置
          </Button>
          <Button variant="outline" size="sm" onClick={onCancel}>
            <X className="h-4 w-4 mr-1" />
            取消
          </Button>
          <Button 
            onClick={handleComplete}
            disabled={cropAreas.length === 0}
          >
            <Check className="h-4 w-4 mr-1" />
            {totalImages > 1 
              ? `完成当前图片 (${cropAreas.length} 个区域) - ${currentImageIndex + 1}/${totalImages}`
              : `完成剪裁 (${cropAreas.length} 个区域)`
            }
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 图片区域 */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">图片剪裁</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {/* 缩放控制工具栏 */}
              <div className="flex items-center justify-between mb-4 p-2 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">缩放:</span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleZoomOut}
                    disabled={userScale <= 0.3}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-sm min-w-[60px] text-center">
                    {Math.round(userScale * 100)}%
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleZoomIn}
                    disabled={userScale >= 3}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleResetZoom}
                    disabled={userScale === 1}
                  >
                    <RotateCw className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">
                  范围框会跟随图片缩放
                </div>
              </div>
              
              <div className="relative overflow-auto">
                <img
                  ref={imageRef}
                  src={imageUrl}
                  alt="待剪裁图片"
                  className="hidden"
                />
                <canvas
                  ref={canvasRef}
                  className="border border-muted cursor-crosshair"
                  style={{ marginLeft: imageOffset.x }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 控制面板 */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">剪裁区域</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {cropAreas.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  还没有创建剪裁区域
                </p>
              ) : (
                cropAreas.map((area, index) => (
                  <div 
                    key={area.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedAreaId === area.id ? 'border-primary bg-primary/5' : 'border-muted'
                    }`}
                    onClick={() => setSelectedAreaId(area.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">区域 {index + 1}</span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteArea(area.id)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-xs text-muted-foreground">
                        位置: ({Math.round(area.x)}, {Math.round(area.y)})
                        <br />
                        大小: {Math.round(area.width)} × {Math.round(area.height)}
                      </div>
                      
                      <div className="space-y-1">
                        <Label className="text-xs">科目</Label>
                        <Select
                          value={`${area.subject.studyPhaseCode}-${area.subject.subjectCode}`}
                          onValueChange={(value) => {
                            const [studyPhaseCode, subjectCode] = value.split('-')
                            const subject = subjects.find(s => 
                              s.studyPhaseCode === studyPhaseCode && s.subjectCode === subjectCode
                            )
                            if (subject) {
                              updateAreaSubject(area.id, subject)
                            }
                          }}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <div className="space-y-1">
                              <div className="px-2 py-1 text-xs font-medium text-muted-foreground">初中</div>
                              {subjects.filter(s => s.category === '初中').map((subject) => (
                                <SelectItem 
                                  key={`${subject.studyPhaseCode}-${subject.subjectCode}`}
                                  value={`${subject.studyPhaseCode}-${subject.subjectCode}`}
                                >
                                  {subject.name}
                                </SelectItem>
                              ))}
                              <Separator />
                              <div className="px-2 py-1 text-xs font-medium text-muted-foreground">高中</div>
                              {subjects.filter(s => s.category === '高中').map((subject) => (
                                <SelectItem 
                                  key={`${subject.studyPhaseCode}-${subject.subjectCode}`}
                                  value={`${subject.studyPhaseCode}-${subject.subjectCode}`}
                                >
                                  {subject.name}
                                </SelectItem>
                              ))}
                            </div>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <Badge variant="outline" className="text-xs">
                        {area.subject.category} - {area.subject.name}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">操作说明</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>• 使用缩放控制调整图片大小</p>
              <p>• 在图片上拖拽创建选择区域</p>
              <p>• 点击区域可以选中并移动</p>
              <p>• 拖拽四个角手柄可以调整区域大小</p>
              <p>• 为每个区域选择对应的科目</p>
              <p>• 可以创建多个区域分别提取不同题目</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 
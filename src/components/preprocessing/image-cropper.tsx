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
  RotateCcw
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

  // 当图片URL改变时重置剪裁区域
  useEffect(() => {
    setCropAreas([])
    setSelectedAreaId(null)
    setIsDrawing(false)
    setCurrentArea(null)
    setIsDragging(false)
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
      
      setImageScale(scale)
      
      canvas.width = image.naturalWidth * scale
      canvas.height = image.naturalHeight * scale
      
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
      drawCropArea(ctx, area, area.id === selectedAreaId)
    })
    
    // 绘制当前正在创建的区域
    if (currentArea && currentArea.x !== undefined && currentArea.y !== undefined && 
        currentArea.width !== undefined && currentArea.height !== undefined) {
      drawCropArea(ctx, currentArea as CropArea, true, true)
    }
  }, [cropAreas, selectedAreaId, currentArea])

  // 绘制剪裁区域
  const drawCropArea = (
    ctx: CanvasRenderingContext2D, 
    area: CropArea | Partial<CropArea>, 
    isSelected: boolean = false,
    isCreating: boolean = false
  ) => {
    if (!area.x || !area.y || !area.width || !area.height) return

    const x = area.x * imageScale
    const y = area.y * imageScale
    const width = area.width * imageScale
    const height = area.height * imageScale

    // 绘制矩形边框
    ctx.strokeStyle = isSelected ? '#3b82f6' : isCreating ? '#10b981' : '#6b7280'
    ctx.lineWidth = 2
    ctx.setLineDash(isCreating ? [5, 5] : [])
    ctx.strokeRect(x, y, width, height)
    
    // 绘制半透明覆盖
    if (isSelected || isCreating) {
      ctx.fillStyle = isSelected ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)'
      ctx.fillRect(x, y, width, height)
    }
    
    // 绘制调整手柄
    if (isSelected && !isCreating) {
      const handleSize = 8
      ctx.fillStyle = '#3b82f6'
      // 四个角的手柄
      ctx.fillRect(x - handleSize/2, y - handleSize/2, handleSize, handleSize)
      ctx.fillRect(x + width - handleSize/2, y - handleSize/2, handleSize, handleSize)
      ctx.fillRect(x - handleSize/2, y + height - handleSize/2, handleSize, handleSize)
      ctx.fillRect(x + width - handleSize/2, y + height - handleSize/2, handleSize, handleSize)
    }

    ctx.setLineDash([])
  }

  // 重绘画布
  useEffect(() => {
    drawCanvas()
  }, [drawCanvas])

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
      setIsDragging(true)
      setDragOffset({
        x: pos.x - clickedArea.x,
        y: pos.y - clickedArea.y
      })
    } else {
      // 开始创建新区域
      setIsDrawing(true)
      setSelectedAreaId(null)
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
    setCurrentArea(null)
  }

  // 删除区域
  const deleteArea = (id: string) => {
    setCropAreas(prev => prev.filter(area => area.id !== id))
    setSelectedAreaId(null)
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

      // 从原始图片剪裁
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
            <CardContent className="p-4">
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
              <p className="text-sm text-muted-foreground mt-2">
                在图片上拖拽创建矩形选择题目区域，点击已创建的区域可以移动位置
              </p>
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
              <p>• 在图片上拖拽创建选择区域</p>
              <p>• 点击区域可以选中并移动</p>
              <p>• 为每个区域选择对应的科目</p>
              <p>• 可以创建多个区域分别提取不同题目</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 
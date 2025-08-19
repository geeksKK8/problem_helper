"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { 
  Combine, 
  ArrowUp, 
  ArrowDown, 
  Trash2, 
  Check,
  X,
  Plus,
  Move
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

// 剪裁后的图片
interface CroppedImage {
  id: string
  canvas: HTMLCanvasElement
  subject: Subject
  originalFile: File
  cropArea: CropArea
}

// 合并组
interface MergeGroup {
  id: string
  name: string
  images: CroppedImage[]
  subject: Subject
}

interface ImageMergerProps {
  croppedImages: CroppedImage[]
  onComplete: (mergedFiles: File[]) => void
  onBack: () => void
}

export function ImageMerger({ croppedImages, onComplete, onBack }: ImageMergerProps) {
  const [mergeGroups, setMergeGroups] = useState<MergeGroup[]>([])
  const [availableImages, setAvailableImages] = useState<CroppedImage[]>(croppedImages)

  // 创建新的合并组
  const createMergeGroup = () => {
    const newGroup: MergeGroup = {
      id: `group-${Date.now()}`,
      name: `合并组 ${mergeGroups.length + 1}`,
      images: [],
      subject: croppedImages[0]?.subject || {} as Subject
    }
    setMergeGroups(prev => [...prev, newGroup])
  }

  // 添加图片到合并组
  const addImageToGroup = (groupId: string, imageId: string) => {
    const image = availableImages.find(img => img.id === imageId)
    if (!image) return

    setMergeGroups(prev => {
      const updatedGroups = prev.map(group => 
        group.id === groupId ? {
          ...group,
          images: [...group.images, image],
          subject: group.images.length === 0 ? image.subject : group.subject
        } : group
      )
      
      // 立即更新预览
      setTimeout(() => updateGroupPreview(groupId), 50)
      
      return updatedGroups
    })
    setAvailableImages(prev => prev.filter(img => img.id !== imageId))
  }

  // 从合并组移除图片
  const removeImageFromGroup = (groupId: string, imageId: string) => {
    let removedImage: CroppedImage | null = null
    
    setMergeGroups(prev => {
      const updatedGroups = prev.map(group => {
        if (group.id === groupId) {
          const image = group.images.find(img => img.id === imageId)
          if (image) {
            removedImage = image
          }
          return {
            ...group,
            images: group.images.filter(img => img.id !== imageId)
          }
        }
        return group
      })
      
      // 立即更新预览
      setTimeout(() => updateGroupPreview(groupId), 50)
      
      return updatedGroups
    })
    
    if (removedImage) {
      setAvailableImages(prev => [...prev, removedImage!])
    }
  }

  // 删除合并组
  const deleteMergeGroup = (groupId: string) => {
    const group = mergeGroups.find(g => g.id === groupId)
    if (group) {
      setAvailableImages(prev => [...prev, ...group.images])
    }
    setMergeGroups(prev => prev.filter(g => g.id !== groupId))
  }

  // 调整图片在组内的顺序
  const moveImageInGroup = (groupId: string, imageId: string, direction: 'up' | 'down') => {
    setMergeGroups(prev => {
      const updatedGroups = prev.map(group => {
        if (group.id === groupId) {
          const currentIndex = group.images.findIndex(img => img.id === imageId)
          if (currentIndex === -1) return group

          const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
          if (newIndex < 0 || newIndex >= group.images.length) return group

          const newImages = [...group.images]
          const [movedImage] = newImages.splice(currentIndex, 1)
          newImages.splice(newIndex, 0, movedImage)

          return { ...group, images: newImages }
        }
        return group
      })
      
      // 立即更新预览
      setTimeout(() => updateGroupPreview(groupId), 50)
      
      return updatedGroups
    })
  }

  // 更新合并组预览（现在使用实时预览，此函数保留用于兼容）
  const updateGroupPreview = useCallback(async (groupId: string) => {
    // 现在预览是实时生成的，不需要存储在状态中
    // 此函数保留是为了保持现有调用的兼容性
  }, [mergeGroups])

  // 垂直合并图片
  const mergeImagesVertically = async (images: CroppedImage[]): Promise<HTMLCanvasElement> => {
    if (images.length === 0) {
      return document.createElement('canvas')
    }

    // 计算合并后的尺寸
    const maxWidth = Math.max(...images.map(img => img.canvas.width))
    const totalHeight = images.reduce((sum, img) => sum + img.canvas.height, 0)

    // 创建合并canvas
    const mergedCanvas = document.createElement('canvas')
    const ctx = mergedCanvas.getContext('2d')
    if (!ctx) return mergedCanvas

    mergedCanvas.width = maxWidth
    mergedCanvas.height = totalHeight

    // 逐个绘制图片
    let currentY = 0
    for (const image of images) {
      // 计算居中位置
      const x = (maxWidth - image.canvas.width) / 2
      ctx.drawImage(image.canvas, x, currentY)
      currentY += image.canvas.height
    }

    return mergedCanvas
  }

  // 完成合并
  const handleComplete = async () => {
    const mergedFiles: File[] = []

    // 处理合并组
    for (const group of mergeGroups) {
      if (group.images.length > 1) {
        const mergedCanvas = await mergeImagesVertically(group.images)
        const blob = await new Promise<Blob>((resolve) => {
          mergedCanvas.toBlob((blob) => {
            resolve(blob!)
          }, 'image/png')
        })
        
        const file = new File([blob], `${group.name}.png`, { type: 'image/png' })
        mergedFiles.push(file)
      } else if (group.images.length === 1) {
        // 单个图片直接转换
        const canvas = group.images[0].canvas
        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((blob) => {
            resolve(blob!)
          }, 'image/png')
        })
        
        const file = new File([blob], `${group.name}.png`, { type: 'image/png' })
        mergedFiles.push(file)
      }
    }

    // 处理未分组的图片
    for (const image of availableImages) {
      const blob = await new Promise<Blob>((resolve) => {
        image.canvas.toBlob((blob) => {
          resolve(blob!)
        }, 'image/png')
      })
      
      const file = new File([blob], `cropped_${image.id}.png`, { type: 'image/png' })
      mergedFiles.push(file)
    }

    onComplete(mergedFiles)
  }

  // 跳过合并，直接使用剪裁后的图片
  const handleSkip = () => {
    const files = croppedImages.map(async (image) => {
      const blob = await new Promise<Blob>((resolve) => {
        image.canvas.toBlob((blob) => {
          resolve(blob!)
        }, 'image/png')
      })
      
      return new File([blob], `cropped_${image.id}.png`, { type: 'image/png' })
    })

    Promise.all(files).then(onComplete)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">合并图片</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onBack}>
            <X className="h-4 w-4 mr-1" />
            返回剪裁
          </Button>
          <Button variant="outline" size="sm" onClick={handleSkip}>
            跳过合并
          </Button>
          <Button onClick={handleComplete}>
            <Check className="h-4 w-4 mr-1" />
            完成合并
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 可用图片 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>可用图片 ({availableImages.length})</span>
              <Button size="sm" onClick={createMergeGroup}>
                <Plus className="h-4 w-4 mr-1" />
                创建合并组
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 min-h-[200px]">
              {availableImages.map((image, index) => (
                <div
                  key={image.id}
                  className="p-3 border rounded-lg bg-background"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 border rounded overflow-hidden flex-shrink-0">
                      <canvas
                        ref={(canvas) => {
                          if (canvas) {
                            const ctx = canvas.getContext('2d')
                            if (ctx) {
                              canvas.width = 64
                              canvas.height = 64
                              ctx.drawImage(image.canvas, 0, 0, 64, 64)
                            }
                          }
                        }}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">区域 {index + 1}</p>
                      <Badge variant="outline" className="text-xs mt-1">
                        {image.subject.category} - {image.subject.name}
                      </Badge>
                    </div>
                    
                    {/* 添加到合并组的按钮 */}
                    <div className="flex flex-col gap-1">
                      {mergeGroups.map((group) => (
                        <Button
                          key={group.id}
                          size="sm"
                          variant="outline"
                          onClick={() => addImageToGroup(group.id, image.id)}
                          className="text-xs"
                        >
                          → {group.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              
              {availableImages.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  <Move className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>所有图片都已加入合并组</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 合并组 */}
        <div className="space-y-4">
          {mergeGroups.map((group) => (
            <Card key={group.id}>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span>{group.name} ({group.images.length})</span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => deleteMergeGroup(group.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 min-h-[150px]">
                  {group.images.map((image, index) => (
                    <div
                      key={image.id}
                      className="p-2 border rounded bg-background"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-12 border rounded overflow-hidden flex-shrink-0">
                          <canvas
                            ref={(canvas) => {
                              if (canvas) {
                                const ctx = canvas.getContext('2d')
                                if (ctx) {
                                  canvas.width = 48
                                  canvas.height = 48
                                  ctx.drawImage(image.canvas, 0, 0, 48, 48)
                                }
                              }
                            }}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">#{index + 1}</p>
                        </div>
                        
                        {/* 排序按钮 */}
                        <div className="flex flex-col gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => moveImageInGroup(group.id, image.id, 'up')}
                            disabled={index === 0}
                            className="h-6 w-6 p-0"
                          >
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => moveImageInGroup(group.id, image.id, 'down')}
                            disabled={index === group.images.length - 1}
                            className="h-6 w-6 p-0"
                          >
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        {/* 移除按钮 */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeImageFromGroup(group.id, image.id)}
                          className="h-6 w-6 p-0 text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {group.images.length === 0 && (
                    <div className="text-center text-muted-foreground py-6">
                      <Combine className="h-6 w-6 mx-auto mb-1 opacity-50" />
                      <p className="text-xs">点击左侧图片的按钮添加到此组</p>
                    </div>
                  )}
                </div>
                
                {/* 预览合并后的图片 */}
                {group.images.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <Label className="text-xs text-muted-foreground">
                      {group.images.length > 1 ? '合并预览:' : '图片预览:'}
                    </Label>
                    <div className="mt-1 max-w-[200px] border rounded overflow-hidden">
                      <canvas
                        ref={(canvas) => {
                          if (canvas) {
                            const ctx = canvas.getContext('2d')
                            if (ctx && group.images.length > 0) {
                              // 实时生成预览
                              mergeImagesVertically(group.images).then(mergedCanvas => {
                                const maxWidth = 200
                                const scale = Math.min(maxWidth / mergedCanvas.width, 1)
                                canvas.width = mergedCanvas.width * scale
                                canvas.height = mergedCanvas.height * scale
                                ctx.clearRect(0, 0, canvas.width, canvas.height)
                                ctx.drawImage(mergedCanvas, 0, 0, canvas.width, canvas.height)
                              })
                            }
                          }
                        }}
                        className="w-full h-auto"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          
          {mergeGroups.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <Combine className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground mb-4">
                  还没有创建合并组
                </p>
                <Button onClick={createMergeGroup}>
                  <Plus className="h-4 w-4 mr-1" />
                  创建第一个合并组
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">操作说明</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• 创建合并组来组织需要合并的图片</p>
          <p>• 点击图片右侧的按钮将其添加到对应的合并组</p>
          <p>• 使用上下箭头调整图片在组内的排列顺序</p>
          <p>• 图片将按照从上到下的顺序进行垂直拼接</p>
          <p>• 如果不需要合并，可以直接跳过此步骤</p>
        </CardContent>
      </Card>
    </div>
  )
} 
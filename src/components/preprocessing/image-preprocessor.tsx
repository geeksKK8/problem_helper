"use client"

import { useState, useRef, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { 
  Download, 
  Upload, 
  Scissors
} from "lucide-react"
import { ImageCropper } from "./image-cropper"
import { ImageMerger } from "./image-merger-simple"

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

interface ImagePreprocessorProps {
  subjects: Subject[]
  onComplete: (processedImages: File[]) => void
  onCancel: () => void
}

export function ImagePreprocessor({ subjects, onComplete, onCancel }: ImagePreprocessorProps) {
  const [currentStep, setCurrentStep] = useState<'upload' | 'crop' | 'merge' | 'complete'>('upload')
  const [originalImages, setOriginalImages] = useState<File[]>([]) // 支持多张图片
  const [imageUrls, setImageUrls] = useState<string[]>([]) // 多张图片的URL
  const [currentImageIndex, setCurrentImageIndex] = useState(0) // 当前编辑的图片索引
  const [croppedImages, setCroppedImages] = useState<CroppedImage[]>([])
  const [selectedSubject, setSelectedSubject] = useState<Subject>(subjects[11]) // 默认高中数学
  const [mergedImages, setMergedImages] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const imageFiles = files.filter(file => file.type.startsWith('image/'))
    
    if (imageFiles.length > 0) {
      setOriginalImages(imageFiles)
      const urls = imageFiles.map(file => URL.createObjectURL(file))
      setImageUrls(urls)
      setCurrentImageIndex(0) // 从第一张图片开始
      setCurrentStep('crop')
    }
  }, [])

  const handleCropComplete = useCallback((areas: CropArea[], croppedCanvases: HTMLCanvasElement[]) => {
    const currentImage = originalImages[currentImageIndex]
    const newCroppedImages: CroppedImage[] = areas.map((area, index) => ({
      id: `${currentImageIndex}_${area.id}`, // 添加图片索引前缀
      canvas: croppedCanvases[index],
      subject: area.subject,
      originalFile: currentImage,
      cropArea: area
    }))
    
    // 将新的剪裁图片添加到现有列表中
    setCroppedImages(prev => [...prev, ...newCroppedImages])
    
    // 检查是否还有更多图片需要剪裁
    if (currentImageIndex < originalImages.length - 1) {
      setCurrentImageIndex(prev => prev + 1)
    } else {
      setCurrentStep('merge')
    }
  }, [originalImages, currentImageIndex])

  const handleMergeComplete = useCallback((mergedFiles: File[]) => {
    setMergedImages(mergedFiles)
    setCurrentStep('complete')
  }, [])

  const handleFinish = useCallback(() => {
    if (mergedImages.length > 0) {
      onComplete(mergedImages)
    } else {
      // 如果没有合并，直接使用剪裁后的图片
      const files = croppedImages.map(img => {
        return new Promise<File>((resolve) => {
          img.canvas.toBlob((blob) => {
            if (blob) {
              const file = new File([blob], `cropped_${img.id}.png`, { type: 'image/png' })
              resolve(file)
            }
          }, 'image/png')
        })
      })
      
      Promise.all(files).then(onComplete)
    }
  }, [mergedImages, croppedImages, onComplete])

  const resetToUpload = () => {
    // 清理所有图片URL
    imageUrls.forEach(url => {
      URL.revokeObjectURL(url)
    })
    setOriginalImages([])
    setImageUrls([])
    setCurrentImageIndex(0)
    setCroppedImages([])
    setMergedImages([])
    setCurrentStep('upload')
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scissors className="h-5 w-5" />
            图像预处理
          </CardTitle>
          <CardDescription>
            对图片进行剪裁和合并，提取单独的题目进行分析
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* 步骤指示器 */}
          <div className="flex items-center gap-4 mb-6">
            <div className={`flex items-center gap-2 ${currentStep === 'upload' ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === 'upload' ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}>
                1
              </div>
              <span>上传图片</span>
            </div>
            <div className="flex-1 h-px bg-muted" />
            <div className={`flex items-center gap-2 ${currentStep === 'crop' ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === 'crop' ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}>
                2
              </div>
              <span>剪裁图片</span>
            </div>
            <div className="flex-1 h-px bg-muted" />
            <div className={`flex items-center gap-2 ${currentStep === 'merge' ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === 'merge' ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}>
                3
              </div>
              <span>合并图片</span>
            </div>
            <div className="flex-1 h-px bg-muted" />
            <div className={`flex items-center gap-2 ${currentStep === 'complete' ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === 'complete' ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}>
                4
              </div>
              <span>完成</span>
            </div>
          </div>

          {/* 上传步骤 */}
          {currentStep === 'upload' && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8">
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    选择一张或多张包含题目的图片进行预处理
                  </p>
                  <Button onClick={() => fileInputRef.current?.click()}>
                    选择图片
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </div>
              </div>
              
              {/* 科目选择 */}
              <div className="max-w-md mx-auto space-y-2">
                <Label>默认科目类型</Label>
                <Select 
                  value={`${selectedSubject.studyPhaseCode}-${selectedSubject.subjectCode}`}
                  onValueChange={(value) => {
                    const [studyPhaseCode, subjectCode] = value.split('-')
                    const subject = subjects.find(s => 
                      s.studyPhaseCode === studyPhaseCode && s.subjectCode === subjectCode
                    )
                    if (subject) {
                      setSelectedSubject(subject)
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="space-y-2">
                      <div className="px-2 py-1 text-sm font-medium text-muted-foreground">初中</div>
                      {subjects.filter(s => s.category === '初中').map((subject) => (
                        <SelectItem 
                          key={`${subject.studyPhaseCode}-${subject.subjectCode}`}
                          value={`${subject.studyPhaseCode}-${subject.subjectCode}`}
                        >
                          {subject.name}
                        </SelectItem>
                      ))}
                      <Separator />
                      <div className="px-2 py-1 text-sm font-medium text-muted-foreground">高中</div>
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
                <p className="text-sm text-muted-foreground">
                  剪裁后的图片将默认使用此科目类型
                </p>
              </div>
            </div>
          )}

          {/* 剪裁步骤 */}
          {currentStep === 'crop' && originalImages.length > 0 && (
            <div className="space-y-4">
              {/* 多图片导航 */}
              {originalImages.length > 1 && (
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      图片 {currentImageIndex + 1} / {originalImages.length}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      ({originalImages[currentImageIndex].name})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setCurrentImageIndex(prev => Math.max(0, prev - 1))}
                      disabled={currentImageIndex === 0}
                    >
                      上一张
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setCurrentImageIndex(prev => Math.min(originalImages.length - 1, prev + 1))}
                      disabled={currentImageIndex === originalImages.length - 1}
                    >
                      下一张
                    </Button>
                  </div>
                </div>
              )}
              
              <ImageCropper
                imageUrl={imageUrls[currentImageIndex]}
                defaultSubject={selectedSubject}
                subjects={subjects}
                onComplete={handleCropComplete}
                onCancel={resetToUpload}
                currentImageIndex={currentImageIndex}
                totalImages={originalImages.length}
              />
            </div>
          )}

          {/* 合并步骤 */}
          {currentStep === 'merge' && (
            <ImageMerger
              croppedImages={croppedImages}
              onComplete={handleMergeComplete}
              onBack={() => setCurrentStep('crop')}
            />
          )}

          {/* 完成步骤 */}
          {currentStep === 'complete' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Download className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-medium">预处理完成！</h3>
              <p className="text-muted-foreground">
                {mergedImages.length > 0 
                  ? `已生成 ${mergedImages.length} 张处理后的图片`
                  : `已生成 ${croppedImages.length} 张剪裁后的图片`
                }
              </p>
              <div className="flex gap-4 justify-center">
                <Button onClick={handleFinish}>
                  开始分析
                </Button>
                <Button variant="outline" onClick={resetToUpload}>
                  重新预处理
                </Button>
                <Button variant="outline" onClick={onCancel}>
                  取消
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 
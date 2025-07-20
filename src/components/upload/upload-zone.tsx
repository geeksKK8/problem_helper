"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, X, FileImage } from "lucide-react"

interface UploadZoneProps {
  onFileSelect: (file: File) => void
  onUpload: (file: File) => Promise<void>
  accept?: string
  maxSize?: number
  preview?: boolean
}

export function UploadZone({
  onFileSelect,
  onUpload,
  accept = "image/*",
  maxSize = 10 * 1024 * 1024, // 10MB
  preview = true,
}: UploadZoneProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const onDrop = useCallback(
    async (acceptedFiles: File[], rejectedFiles: any[]) => {
      setError(null)
      
      if (rejectedFiles.length > 0) {
        setError("文件格式不支持或文件过大")
        return
      }

      const file = acceptedFiles[0]
      if (!file) return

      // 创建预览
      if (preview && file.type.startsWith("image/")) {
        const url = URL.createObjectURL(file)
        setPreviewUrl(url)
      }

      onFileSelect(file)
      setUploading(true)
      setProgress(0)

      try {
        // 模拟上传进度
        const interval = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 90) {
              clearInterval(interval)
              return prev
            }
            return prev + 10
          })
        }, 100)

        await onUpload(file)
        setProgress(100)
      } catch (err) {
        setError("上传失败，请重试")
      } finally {
        setUploading(false)
        setTimeout(() => setProgress(0), 1000)
      }
    },
    [onFileSelect, onUpload, preview]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept ? { [accept]: [] } : undefined,
    maxSize,
    multiple: false,
  })

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>上传题目图片</CardTitle>
          <CardDescription>
            支持PNG、JPG格式，最大10MB
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
              transition-colors duration-200
              ${isDragActive 
                ? "border-primary bg-primary/5" 
                : "border-muted-foreground/25 hover:border-primary/50"
              }
            `}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            {isDragActive ? (
              <p className="text-primary font-medium">将文件拖放到这里...</p>
            ) : (
              <div>
                <p className="text-muted-foreground mb-2">
                  拖拽文件到这里，或点击选择文件
                </p>
                <Button variant="outline" size="sm">
                  选择文件
                </Button>
              </div>
            )}
          </div>

          {uploading && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>上传中...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {error && (
            <Alert variant="destructive" className="mt-4">
              <X className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {previewUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">图片预览</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <img
                src={previewUrl}
                alt="预览"
                className="w-full h-48 object-contain rounded-lg border"
              />
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => {
                  URL.revokeObjectURL(previewUrl)
                  setPreviewUrl(null)
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 
"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"


interface ImageModalProps {
  isOpen: boolean
  onClose: () => void
  imageUrl?: string
  canvas?: HTMLCanvasElement
  title?: string
}

export function ImageModal({ isOpen, onClose, imageUrl, canvas, title }: ImageModalProps) {
  const [canvasUrl, setCanvasUrl] = React.useState<string>("")

  React.useEffect(() => {
    if (canvas) {
      const url = canvas.toDataURL()
      setCanvasUrl(url)
      return () => {
        if (url) {
          // Note: toDataURL() creates a data URL, not a blob URL, so no need to revoke
          setCanvasUrl("")
        }
      }
    }
  }, [canvas])

  const displayUrl = imageUrl || canvasUrl

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={onClose}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 max-h-[90vh] max-w-[90vw] translate-x-[-50%] translate-y-[-50%] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          <div className="relative bg-background rounded-lg shadow-lg overflow-hidden">
            {/* 标题栏 */}
            {title && (
              <div className="px-4 py-3 border-b bg-muted/50">
                <h3 className="text-lg font-medium">{title}</h3>
              </div>
            )}
            
            {/* 图片内容 */}
            <div className="relative">
              {displayUrl && (
                <img
                  src={displayUrl}
                  alt="预览图片"
                  className="max-h-[70vh] max-w-full object-contain"
                />
              )}
            </div>
            
            {/* 关闭按钮 */}
            <DialogPrimitive.Close className="absolute top-2 right-2 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
              <X className="h-6 w-6 p-1 bg-background/80 rounded-full" />
              <span className="sr-only">关闭</span>
            </DialogPrimitive.Close>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
} 
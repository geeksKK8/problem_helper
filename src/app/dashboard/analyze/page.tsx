"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BatchUploadZone } from "@/components/upload/batch-upload-zone"
import { BatchResultDisplay } from "@/components/analysis/batch-result-display"
import { ImagePreprocessor } from "@/components/preprocessing/image-preprocessor"

import { toast } from "sonner"

import type { Problem } from "@/types"

// 科目类型定义
interface Subject {
  studyPhaseCode: string
  subjectCode: string
  name: string
  category: string
}

// 科目配置
const SUBJECTS: Subject[] = [
  // 初中科目
  { studyPhaseCode: "200", subjectCode: "1", name: "语文", category: "初中" },
  { studyPhaseCode: "200", subjectCode: "2", name: "数学", category: "初中" },
  { studyPhaseCode: "200", subjectCode: "3", name: "英语", category: "初中" },
  { studyPhaseCode: "200", subjectCode: "5", name: "历史", category: "初中" },
  { studyPhaseCode: "200", subjectCode: "6", name: "地理", category: "初中" },
  { studyPhaseCode: "200", subjectCode: "7", name: "物理", category: "初中" },
  { studyPhaseCode: "200", subjectCode: "8", name: "化学", category: "初中" },
  { studyPhaseCode: "200", subjectCode: "9", name: "生物", category: "初中" },
  { studyPhaseCode: "200", subjectCode: "56", name: "道德与法治", category: "初中" },
  { studyPhaseCode: "200", subjectCode: "57", name: "科学", category: "初中" },
  // 高中科目
  { studyPhaseCode: "300", subjectCode: "1", name: "语文", category: "高中" },
  { studyPhaseCode: "300", subjectCode: "2", name: "数学", category: "高中" },
  { studyPhaseCode: "300", subjectCode: "3", name: "英语", category: "高中" },
  { studyPhaseCode: "300", subjectCode: "4", name: "政治", category: "高中" },
  { studyPhaseCode: "300", subjectCode: "5", name: "历史", category: "高中" },
  { studyPhaseCode: "300", subjectCode: "6", name: "地理", category: "高中" },
  { studyPhaseCode: "300", subjectCode: "7", name: "物理", category: "高中" },
  { studyPhaseCode: "300", subjectCode: "8", name: "化学", category: "高中" },
  { studyPhaseCode: "300", subjectCode: "9", name: "生物", category: "高中" },
]

export default function AnalyzePage() {
  const [batchResults, setBatchResults] = useState<Array<{ file: File; result: { knowledgePoint: string; problems: Problem[]; historyId?: string | null }; subject: Subject }>>([])
  const [activeTab, setActiveTab] = useState("preprocessing")
  const [preprocessedImages, setPreprocessedImages] = useState<File[]>([])






  const handleBatchComplete = (results: Array<{ file: File; result: { knowledgePoint: string; problems: Problem[]; historyId?: string | null }; subject: Subject }>) => {
    setBatchResults(results)
    toast.success(`批量分析完成！共处理 ${results.length} 个文件`)
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold">题目分析</h1>
        <p className="text-muted-foreground">
          上传题目图片，获取相关题目推荐
        </p>
      </div>

      {/* 分析模式选择 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="preprocessing">图像预处理</TabsTrigger>
          <TabsTrigger value="batch">批量分析</TabsTrigger>
        </TabsList>



        {/* 图像预处理 */}
        <TabsContent value="preprocessing" className="space-y-6">
          <ImagePreprocessor
            subjects={SUBJECTS}
            onComplete={(processedImages) => {
              // 将预处理后的图片作为批量分析的输入
              setPreprocessedImages(processedImages)
              // 切换到批量分析标签页
              setActiveTab("batch")
              toast.success(`图像预处理完成！已生成 ${processedImages.length} 张图片，请继续进行批量分析`)
            }}
            onCancel={() => {
              console.log('取消预处理')
            }}
          />
        </TabsContent>

        {/* 批量分析 */}
        <TabsContent value="batch" className="space-y-6">
          <BatchUploadZone
            onBatchComplete={handleBatchComplete}
            accept="image/*"
            maxSize={10 * 1024 * 1024}
            maxFiles={10}
            subjects={SUBJECTS}
            preloadedFiles={preprocessedImages}
          />
        </TabsContent>
      </Tabs>



      {/* 批量分析结果 */}
      {batchResults.length > 0 && (
        <BatchResultDisplay
          results={batchResults}
          onClear={() => setBatchResults([])}
          onExport={() => {
            // TODO: 实现导出功能
            console.log('导出批量分析结果')
          }}
        />
      )}
    </div>
  )
} 
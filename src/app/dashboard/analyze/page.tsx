"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BatchUploadZone } from "@/components/upload/batch-upload-zone"
import { BatchResultDisplay } from "@/components/analysis/batch-result-display"
import { ImagePreprocessor } from "@/components/preprocessing/image-preprocessor"
import { CopilotSidebar } from "@copilotkit/react-ui"
import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core"
import { apiClient } from "@/lib/api"
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
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentProblemContext, setCurrentProblemContext] = useState<{
    imagePath?: string
    knowledgePoint?: string
    subject?: Subject
    solutionSteps?: Array<{
      step: number
      title: string
      content: string
      formula?: string
    }>
  }>({})

  // 让 AI 知道当前正在处理的题目上下文
  useCopilotReadable({
    description: "当前题目分析的上下文信息",
    value: currentProblemContext
  })

  // 注册生成解答的 action
  useCopilotAction({
    name: "generateSolution",
    description: "为指定的题目生成详细的解题过程",
    parameters: [
      {
        name: "imagePath",
        type: "string",
        description: "题目图片的路径",
        required: true
      },
      {
        name: "subject",
        type: "object",
        description: "题目所属科目",
        required: false
      }
    ],
    handler: async ({ imagePath, subject }) => {
      try {
        // 调用 API 生成解答
        const response = await fetch('/api/analysis/generate-solution', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ imagePath, subject }),
        })

        if (!response.ok) {
          throw new Error('解答生成失败')
        }

        const data = await response.json()
        
        if (data.success && data.data?.solutionSteps) {
          const steps = data.data.solutionSteps
          
          // 构造格式化的解答文本
          let solutionText = "## 📝 解题过程\n\n"
          
          if (data.data.knowledgePoint) {
            solutionText += `**知识点**: ${data.data.knowledgePoint}\n\n`
          }
          
          steps.forEach((step: { step: number; title: string; content: string; formula?: string }) => {
            solutionText += `### 步骤 ${step.step}: ${step.title}\n\n`
            solutionText += `${step.content}\n\n`
            
            if (step.formula) {
              solutionText += `**公式**: \`${step.formula}\`\n\n`
            }
          })
          
          return solutionText
        }
        
        return "解答生成完成，但未能提取到有效内容。"
      } catch (error) {
        console.error('生成解答失败:', error)
        return "抱歉，生成解答时遇到了问题。请稍后再试。"
      }
    }
  })



  const handleBatchComplete = (results: Array<{ file: File; result: { knowledgePoint: string; problems: Problem[]; historyId?: string | null }; subject: Subject }>) => {
    setBatchResults(results)
    toast.success(`批量分析完成！共处理 ${results.length} 个文件`)
  }

  // 处理生成解答请求
  const handleGenerateSolution = async (file: File, knowledgePoint: string, subject: Subject) => {
    try {
      // 显示加载提示
      toast.loading("正在上传图片...", { id: "generate-solution" })
      
      // 先上传图片
      const uploadResult = await apiClient.uploadImage(file)
      if (!uploadResult.success || !uploadResult.data?.id) {
        throw new Error('图片上传失败')
      }
      
      toast.loading("正在生成解答...", { id: "generate-solution" })
      
      // 设置当前题目上下文
      setCurrentProblemContext({
        imagePath: uploadResult.data.id, 
        knowledgePoint,
        subject
      })
      
      // 调用生成解答 API
      const response = await fetch('/api/analysis/generate-solution', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          imagePath: uploadResult.data.id, 
          subject 
        }),
      })

      if (!response.ok) {
        throw new Error('解答生成失败')
      }

      const data = await response.json()
      
      // 打开 sidebar 并显示结果
      setSidebarOpen(true)
      
      if (data.success && data.data?.solutionSteps) {
        toast.success("解答已生成！请在侧边栏查看详细内容", { id: "generate-solution" })
        
        // 存储生成的解答，用于 CopilotKit 上下文
        setCurrentProblemContext(prev => ({
          ...prev,
          solutionSteps: data.data.solutionSteps
        }))
      } else {
        toast.error("解答生成完成，但未能提取到有效内容", { id: "generate-solution" })
      }
      
    } catch (error) {
      console.error('生成解答失败:', error)
      toast.error("生成解答失败，请重试", { id: "generate-solution" })
    }
  }

  // 构建 sidebar 的初始消息
  const getSidebarInitialMessage = () => {
    if (!currentProblemContext.solutionSteps || currentProblemContext.solutionSteps.length === 0) {
      return "你好！我可以帮你解答题目相关的问题。请点击题目旁边的'生成解答'按钮开始。"
    }

    let message = `## 📝 解题过程\n\n`
    
    if (currentProblemContext.knowledgePoint) {
      message += `**知识点**: ${currentProblemContext.knowledgePoint}\n\n`
    }
    
    currentProblemContext.solutionSteps.forEach((step) => {
      message += `### 步骤 ${step.step}: ${step.title}\n\n`
      message += `${step.content}\n\n`
      
      if (step.formula) {
        message += `**公式**: \`${step.formula}\`\n\n`
      }
      
      message += `---\n\n`
    })
    
    message += `\n\n你可以继续提问，我会帮你解释任何不清楚的地方！`
    
    return message
  }

  return (
    <CopilotSidebar
      key={currentProblemContext.imagePath || 'default'}
      defaultOpen={sidebarOpen}
      instructions={`你是一个专业的教育助手，专门帮助学生解答题目。

${currentProblemContext.knowledgePoint ? `当前题目信息：
- 知识点: ${currentProblemContext.knowledgePoint}
- 科目: ${currentProblemContext.subject ? `${currentProblemContext.subject.category} - ${currentProblemContext.subject.name}` : '未知'}
` : ''}

请根据学生的问题提供：
1. 详细的解题思路和步骤
2. 相关知识点的清晰解释
3. 解题技巧和注意事项
4. 举一反三的练习建议

使用清晰、友好、鼓励的语言，帮助学生理解和掌握解题方法。`}
      labels={{
        title: "解题助手",
        initial: getSidebarInitialMessage(),
        placeholder: "有什么不明白的地方吗？尽管问我..."
      }}
      clickOutsideToClose={false}
    >
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
          onGenerateSolution={handleGenerateSolution}
        />
      )}
    </div>
    </CopilotSidebar>
  )
} 
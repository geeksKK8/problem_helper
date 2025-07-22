import { GoogleGenAI, Type } from '@google/genai'
import * as fs from 'node:fs'
import fetch from 'node-fetch'

// ==============================================================================
//  类型定义
// ==============================================================================

interface KnowledgeTreeNode {
  id: string
  title: string
  isLeaf?: boolean
  children?: KnowledgeTreeNode[]
}

interface KnowledgeTreeResponse {
  data: KnowledgeTreeNode[]
}

interface ProblemItem {
  questionId: string
  questionArticle?: string
}

interface ProblemQueryResponse {
  data: {
    list: ProblemItem[]
  }
}

interface AnalysisResult {
  knowledgePoint: string
  problems: Array<{
    id: string
    title: string
    content: string
    difficulty: 'easy' | 'medium' | 'hard'
    tags: string[]
    similarity: number
    estimatedTime: number
    source: string
  }>
  analysisId: string
  status: 'completed' | 'failed'
}

// ==============================================================================
//  配置和工具函数
// ==============================================================================

function configureApiKey(): string {
  const apiKey = process.env.GOOGLE_API_KEY
  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY 环境变量未设置')
  }
  return apiKey
}

function cleanHtml(rawHtml: string): string {
  if (!rawHtml) return ''
  // 保留HTML格式和数学公式，只清理不必要的空白
  return rawHtml.replace(/&nbsp;/g, ' ').trim()
}

function extractProblemContent(htmlContent: string): string {
  if (!htmlContent) return ''
  
  // 移除题目编号（如 "5．" 开头的部分）
  let content = htmlContent.replace(/^\d+[．.、]\s*/, '')
  
  // 移除选项部分（A、B、C、D开头的选项）
  content = content.replace(/[A-D][．.、]\s*[^A-D]*$/gm, '')
  
  // 清理多余的空白
  content = content.replace(/&nbsp;/g, ' ').trim()
  
  return content
}

// ==============================================================================
//  知识点树相关函数
// ==============================================================================

export async function fetchKnowledgeTree(studyPhase = "300", subject = "2"): Promise<KnowledgeTreeResponse> {
  const url = "https://qms.stzy.com/matrix/zw-zzw/api/v1/zzw/tree/kpoint"
  const headers = {
    'Accept': 'application/json, text/plain, */*',
    'Content-Type': 'application/json',
    'Host': 'qms.stzy.com',
    'Origin': 'https://zj.stzy.com',
    'Referer': 'https://zj.stzy.com/',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
    'token': 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJuaWNrTmFtZSI6IjE5OCoqKio1NzIyIiwiaWQiOiI1OTk1ODEwMjgxMDYzNzUxNjgiLCJleHAiOjE3NTI1MzUwOTAsInR5cGUiOiIxIiwiaWF0IjoxNzUyNTM1MDg5LCJqdGkiOiIxMmI3YzZjODUyZTk0OTFjYjY1YWZiMjk1Yjc2ZjhjYyIsImF1dGhvcml0aWVzIjpbXSwidXNlcm5hbWUiOiJzdHdfNTk5NTgxMDI4MTA2Mzc1MTY4In0.enBCCkVKFatlPUwC9-QIIVn_a6oOprnWHlZ8qL_zcu8BRfHwMuH5tOkySj4CE1FhLFNHT-6uBzPFABXfkoDIIRRCwoZv-RVNvCkf1F0-NuzrxeKlfnet4XT8GK4QKUe03j0pRgyS2GS2u8_57MhgOSBD9NLLZ91VfZ2mGLOGgLY'
  }
  const payload = { studyPhaseCode: studyPhase, subjectCode: subject }
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload)
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json() as KnowledgeTreeResponse
  } catch (error) {
    console.error('获取知识点树失败:', error)
    throw error
  }
}

export function processKnowledgeTree(jsonData: KnowledgeTreeResponse): [string[], Record<string, string>] {
  const llmChoicesList: string[] = []
  const knowledgePointMap: Record<string, string> = {}
  
  function flattenRecursive(nodes: KnowledgeTreeNode[], pathTitles: string[]): void {
    for (const node of nodes) {
      const currentTitle = node.title
      if (!currentTitle) continue
      
      if (node.isLeaf === true) {
        const fullPathTitle = pathTitles.concat([currentTitle]).join(" -> ")
        llmChoicesList.push(fullPathTitle)
        knowledgePointMap[fullPathTitle] = node.id
      }
      
      if (node.children) {
        const newPath = pathTitles.concat([currentTitle])
        flattenRecursive(node.children, newPath)
      }
    }
  }
  
  const rootNodes = jsonData.data || []
  flattenRecursive(rootNodes, [])
  return [llmChoicesList, knowledgePointMap]
}

// ==============================================================================
//  题目查询函数
// ==============================================================================

export async function queryStzyApi(knowledgePointId: string): Promise<ProblemQueryResponse> {
  const url = "https://qms.stzy.com/matrix/zw-search/api/v1/homeEs/question/keyPointQuery"
  const headers = {
    'Accept': 'application/json, text/plain, */*',
    'Content-Type': 'application/json',
    'Host': 'qms.stzy.com',
    'Origin': 'https://zj.stzy.com',
    'Referer': 'https://zj.stzy.com/',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
    'token': 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJuaWNrTmFtZSI6IjE5OCoqKio1NzIyIiwiaWQiOiI1OTk1ODEwMjgxMDYzNzUxNjgiLCJleHAiOjE3NTI1MzUwOTAsInR5cGUiOiIxIiwiaWF0IjoxNzUyNTM1MDg5LCJqdGkiOiIxMmI3YzZjODUyZTk0OTFjYjY1YWZiMjk1Yjc2ZjhjYyIsImF1dGhvcml0aWVzIjpbXSwidXNlcm5hbWUiOiJzdHdfNTk5NTgxMDI4MTA2Mzc1MTY4In0.enBCCkVKFatlPUwC9-QIIVn_a6oOprnWHlZ8qL_zcu8BRfHwMuH5tOkySj4CE1FhLFNHT-6uBzPFABXfkoDIIRRCwoZv-RVNvCkf1F0-NuzrxeKlfnet4XT8GK4QKUe03j0pRgyS2GS2u8_57MhgOSBD9NLLZ91VfZ2mGLOGgLY'
  }
  const payload = {
    onlyCheckUrlAndMethod: true,
    pageNum: 1,
    pageSize: 10,
    params: {
      studyPhaseCode: "300",
      subjectCode: "2",
      searchType: 2,
      sort: 0,
      yearCode: "",
      gradeCode: "",
      provinceCode: "",
      cityCode: "",
      areaCode: "",
      organizationCode: "",
      termCode: "",
      keyWord: "",
      filterQuestionFlag: false,
      searchScope: 0,
      treeIds: [knowledgePointId]
    }
  }
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload)
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json() as ProblemQueryResponse
  } catch (error) {
    console.error('题目查询失败:', error)
    throw error
  }
}

// ==============================================================================
//  AI分析函数
// ==============================================================================

export async function getKnowledgePointFromLLM(imagePath: string, knowledgePointChoices: string[]): Promise<string | null> {
  try {
    const apiKey = configureApiKey()
    const ai = new GoogleGenAI({ apiKey })
    
    const selectTool = {
      name: "select_knowledge_point",
      description: "根据数学问题，选择一个最相关的知识点",
      parameters: {
        type: Type.OBJECT,
        properties: {
          knowledge_point_path: {
            type: Type.STRING,
            description: "问题的核心知识点路径",
            enum: knowledgePointChoices
          }
        },
        required: ["knowledge_point_path"]
      }
    }

    const tools = [{ functionDeclarations: [selectTool] }]
    const config = { tools: tools }

    const imageBytes = fs.readFileSync(imagePath)
    const base64Image = imageBytes.toString('base64')
    
    const prompt = "请仔细理解图中的数学问题，然后调用`select_knowledge_point`工具，选择和该问题最相关的一个知识点路径。"
    
    const contents = [
      {
        inlineData: {
          mimeType: "image/png",
          data: base64Image,
        },
      },
      { text: prompt }
    ]
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
      config: config,
    })
    
    if (response.functionCalls && response.functionCalls.length > 0) {
      const functionCall = response.functionCalls[0]
      if (functionCall.name === "select_knowledge_point" && functionCall.args) {
        const selectedPath = functionCall.args.knowledge_point_path as string
        return selectedPath
      }
    }
    
    return null

  } catch (error) {
    console.error('AI分析失败:', error)
    throw error
  }
}

export async function rankProblemsWithLLM(imagePath: string, problemList: ProblemItem[]): Promise<string[]> {
  try {
    if (!problemList || problemList.length < 3) {
      return problemList.map((p: ProblemItem) => p.questionId)
    }

    const candidateIds = problemList.map((p: ProblemItem) => p.questionId)
    let formattedProblems = ""
    for (const problem of problemList) {
      const problemId = problem.questionId || 'N/A'
      // 保留HTML格式，只清理基本空白
      const problemContent = cleanHtml(problem.questionArticle || '')
      formattedProblems += `题目ID: ${problemId}\n题目内容: ${problemContent}\n---\n`
    }
    
    const selectTop3Tool = {
      name: "select_top_three_problems",
      description: "从一个候选题目列表中，根据图片中的原始问题，选择出最相似的三个题目的ID。",
      parameters: {
        type: Type.OBJECT,
        properties: {
          top_three_ids: {
            type: Type.ARRAY,
            description: "包含三个最相关题目ID的列表",
            items: {
              type: Type.STRING,
              enum: candidateIds
            }
          }
        },
        required: ["top_three_ids"]
      }
    }
    
    const apiKey = configureApiKey()
    const ai = new GoogleGenAI({ apiKey })
    const tools = [{ functionDeclarations: [selectTop3Tool] }]
    const config = { tools: tools }

    const imageBytes = fs.readFileSync(imagePath)
    const base64Image = imageBytes.toString('base64')
    
    const prompt = `
    这是我的原始问题图片。下面是一个从题库中找到的、与之可能相关的题目列表。

    请你仔细比对图片中的问题和列表中的每一个问题，然后调用\`select_top_three_problems\`工具，返回列表中与图片问题**相关性最高、最相似**的**三个**题目的ID。

    候选题目列表如下:
    ---
    ${formattedProblems}
    `
    
    const contents = [
      {
        inlineData: {
          mimeType: "image/png",
          data: base64Image,
        },
      },
      { text: prompt }
    ]
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
      config: config,
    })
    
    if (response.functionCalls && response.functionCalls.length > 0) {
      const functionCall = response.functionCalls[0]
      if (functionCall.name === "select_top_three_problems" && functionCall.args) {
        const topIds = functionCall.args.top_three_ids as string[]
        if (Array.isArray(topIds) && topIds.length === 3) {
          return topIds
        }
      }
    }
    
    return candidateIds

  } catch (error) {
    console.error('AI精选失败:', error)
    return problemList.map((p: ProblemItem) => p.questionId)
  }
}

// ==============================================================================
//  主分析函数
// ==============================================================================

export async function analyzeImage(imagePath: string): Promise<AnalysisResult> {
  try {
    // 1. 获取知识点树
    const knowledgeTreeData = await fetchKnowledgeTree()
    const [choicesForLLM, idLookupMap] = processKnowledgeTree(knowledgeTreeData)
    
    if (!choicesForLLM || choicesForLLM.length === 0) {
      throw new Error('未能从知识点树中提取任何有效的叶子节点')
    }

    // 2. 使用AI分析图片，选择知识点
    const selectedKnowledgePath = await getKnowledgePointFromLLM(imagePath, choicesForLLM)
    
    if (!selectedKnowledgePath) {
      throw new Error('AI未能识别出有效的知识点')
    }

    // 3. 根据知识点查询题目
    const targetId = idLookupMap[selectedKnowledgePath]
    if (!targetId) {
      throw new Error(`在映射字典中找不到路径 '${selectedKnowledgePath}' 对应的ID`)
    }

    const initialResults = await queryStzyApi(targetId)
    
    if (!initialResults || !initialResults.data || !initialResults.data.list) {
      throw new Error('未能获取初步题目列表')
    }

    const initialProblemList = initialResults.data.list

    // 4. AI精选题目
    const top3ProblemIds = await rankProblemsWithLLM(imagePath, initialProblemList)
    
    // 5. 过滤出最终题目
    const finalProblems = initialProblemList.filter((p: ProblemItem) => 
      top3ProblemIds.includes(p.questionId)
    )

    // 6. 转换为前端需要的格式，保留HTML格式并去除标题
    const problems = finalProblems.map((problem: ProblemItem) => ({
      id: problem.questionId,
      title: extractProblemContent(problem.questionArticle || '').substring(0, 50) + '...',
      content: extractProblemContent(problem.questionArticle || ''), // 去除标题，保留题目正文
      difficulty: 'medium' as const, // 可以根据实际情况调整
      tags: [selectedKnowledgePath.split(' -> ').pop() || ''],
      similarity: Math.floor(Math.random() * 20) + 80, // 模拟相似度
      estimatedTime: Math.floor(Math.random() * 10) + 10,
      source: '题库'
    }))

    return {
      knowledgePoint: selectedKnowledgePath,
      problems,
      analysisId: `analysis_${Date.now()}`,
      status: 'completed'
    }

  } catch (error) {
    console.error('分析失败:', error)
    throw error
  }
} 
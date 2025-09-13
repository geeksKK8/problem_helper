import { GoogleGenAI, Type } from '@google/genai'
import * as fs from 'node:fs'
import fetch from 'node-fetch'
import cosineSimilarity from 'compute-cosine-similarity'
import {HttpsProxyAgent} from "https-proxy-agent";

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

interface SolutionStep {
  step: number
  title: string
  content: string
  formula?: string
}

interface AnalysisResult {
  knowledgePoint: string
  solution: SolutionStep[]
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

// 科目类型定义
interface Subject {
  studyPhaseCode: string
  subjectCode: string
  name: string
  category: string
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

export async function queryStzyApi(knowledgePointId: string, studyPhase = "300", subject = "2"): Promise<ProblemQueryResponse> {
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
      studyPhaseCode: studyPhase,
      subjectCode: subject,
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
//  Embedding相关函数
// ==============================================================================

export async function getEmbeddings(texts: string[]): Promise<number[][]> {
  const startTime = Date.now()
  console.log(`    🔤 开始获取embedding，文本数量: ${texts.length}`)
  
  try {
    const apiKey = configureApiKey()
    const ai = new GoogleGenAI({ apiKey })
    
    const response = await ai.models.embedContent({
      model: 'gemini-embedding-001',
      contents: texts
    })
    
    if (!response.embeddings) {
      throw new Error('未获取到embedding结果')
    }
    
    const result = response.embeddings.map(e => e.values || []).filter(values => values.length > 0)
    const totalTime = Date.now() - startTime
    console.log(`    ✅ embedding获取完成，耗时: ${totalTime}ms，返回 ${result.length} 个向量`)
    
    return result
  } catch (error) {
    const totalTime = Date.now() - startTime
    console.error(`    ❌ 获取embedding失败，耗时: ${totalTime}ms`)
    console.error('获取embedding失败:', error)
    throw error
  }
}

export async function rankProblemsWithEmbedding(
  originalProblemText: string, 
  problemList: ProblemItem[]
): Promise<Array<{id: string, similarity: number}>> {
  const startTime = Date.now()
  console.log('  🧠 开始基于embedding进行相似度比较...')
  
  try {
    if (!problemList || problemList.length < 3) {
      const totalTime = Date.now() - startTime
      console.log(`  ✅ 候选题目不足3个，直接返回，耗时: ${totalTime}ms`)
      return problemList.map((p: ProblemItem) => ({ id: p.questionId, similarity: 0.85 }))
    }

    // 准备文本列表：原始题目 + 候选题目
    const texts = [originalProblemText]
    const candidateIds = problemList.map((p: ProblemItem) => p.questionId)
    
    for (const problem of problemList) {
      const problemContent = cleanHtml(problem.questionArticle || '')
      texts.push(problemContent)
    }
    
    // 获取所有文本的embedding
    const embeddings = await getEmbeddings(texts)
    
    if (embeddings.length !== texts.length) {
      throw new Error('Embedding数量与文本数量不匹配')
    }
    
    // 计算原始题目与每个候选题目的相似度
    const originalEmbedding = embeddings[0]
    const similarities: Array<{id: string, similarity: number}> = []
    
    for (let i = 1; i < embeddings.length; i++) {
      const similarity = cosineSimilarity(originalEmbedding, embeddings[i])
      if (similarity !== null) {
        similarities.push({
          id: candidateIds[i - 1],
          similarity: similarity
        })
      }
    }
    
    // 按相似度降序排序
    similarities.sort((a, b) => b.similarity - a.similarity)
    
    // 返回前3个最相似的题目ID和相似度
    const top3Results = similarities.slice(0, 3)
    
    const totalTime = Date.now() - startTime
    console.log(`  ✅ 相似度比较完成，耗时: ${totalTime}ms`)
    console.log('  📊 相似度排序结果:', similarities.map(item => ({
      id: item.id,
      similarity: item.similarity.toFixed(4)
    })))
    
    return top3Results

  } catch (error) {
    const totalTime = Date.now() - startTime
    console.error(`  ❌ 基于embedding的题目排序失败，耗时: ${totalTime}ms`)
    console.error('基于embedding的题目排序失败:', error)
    // 降级到返回前3个题目
    return problemList.slice(0, 3).map((p: ProblemItem) => ({ id: p.questionId, similarity: 0.85 }))
  }
}

// ==============================================================================
//  AI分析函数
// ==============================================================================

export async function getKnowledgePointFromText(problemText: string, knowledgePointChoices: string[], subject?: Subject): Promise<string | null> {
  const startTime = Date.now()
  console.log('  🎯 开始基于文本选择知识点...')
  
  try {
    const apiKey = configureApiKey()
    const ai = new GoogleGenAI({ apiKey })
    
    const selectTool = {
      name: "select_knowledge_point",
      description: "根据题目文本，选择一个最相关的知识点",
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
    
    // 根据科目生成专门的prompt
    const getSubjectSpecificPrompt = (subject?: Subject): string => {
      const basePrompt = `请仔细分析以下题目文本，然后调用\`select_knowledge_point\`工具，选择和该题目最相关的一个知识点路径。

题目文本：
${problemText}`
      
      if (!subject) {
        return basePrompt
      }

      const subjectSpecificGuidance: Record<string, string> = {
        "数学": "请分析题目中涉及的数学概念、公式和解题方法，选择最核心的数学知识点。",
        "物理": "请分析题目中涉及的物理现象、定律和原理，选择最相关的物理知识点。",
        "化学": "请分析题目中涉及的化学反应、化学原理和化学概念，选择最相关的化学知识点。",
        "语文": "请分析文本的内容、体裁、修辞手法和文学特征，选择最相关的语文知识点。",
        "英语": "请分析题目的语法结构、词汇用法和语言技能要求，选择最相关的英语知识点。",
        "历史": "请分析题目涉及的历史时期、历史事件和历史人物，选择最相关的历史知识点。",
        "地理": "请分析题目涉及的地理要素、地理现象和空间关系，选择最相关的地理知识点。",
        "政治": "请分析题目涉及的政治理论、制度特点和社会问题，选择最相关的政治知识点。",
        "生物": "请分析题目涉及的生物结构、生理过程和生物原理，选择最相关的生物知识点。",
        "道德与法治": "请分析题目涉及的法律知识、道德原则和社会责任，选择最相关的知识点。",
        "科学": "请分析题目涉及的科学现象、科学原理和实验方法，选择最相关的科学知识点。"
      }

      const guidance = subjectSpecificGuidance[subject.name] || basePrompt
      
      return `${basePrompt}\n\n当前科目：${subject.category}${subject.name}\n${guidance}`
    }
    
    const prompt = getSubjectSpecificPrompt(subject)
    
    const contents = [
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
        const totalTime = Date.now() - startTime
        console.log(`  ✅ 知识点选择完成，耗时: ${totalTime}ms，选择: ${selectedPath}`)
        return selectedPath
      }
    }
    
    const totalTime = Date.now() - startTime
    console.log(`  ⚠️ 知识点选择未返回结果，耗时: ${totalTime}ms`)
    return null

  } catch (error) {
    const totalTime = Date.now() - startTime
    console.error(`  ❌ 知识点选择失败，耗时: ${totalTime}ms`)
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

export async function extractProblemTextAndGenerateSolution(imagePath: string, subject?: Subject): Promise<{problemText: string, solutionSteps: SolutionStep[]}> {
  const startTime = Date.now()
  console.log('  📝 开始提取题目文本并生成解题过程...')
  
  try {
    const apiKey = configureApiKey()
    const ai = new GoogleGenAI({ apiKey })

    const imageBytes = fs.readFileSync(imagePath)
    const base64Image = imageBytes.toString('base64')
    
    // 根据科目生成专门的prompt
    const getSubjectSpecificPrompt = (subject?: Subject): string => {
      const basePrompt = `请仔细分析图片中的题目，完成以下两个任务：

任务1：提取题目文本
请提取出完整的题目文本内容，只返回题目文本，不要添加任何解释。

任务2：生成解题过程
请生成详细的解题过程，要求：
1. 分析题目要求和已知条件
2. 确定解题方法和思路
3. 提供清晰的步骤标题
4. 给出详细的解题说明
5. 如果涉及重要公式，请用LaTeX格式表示（用$符号包围）
6. 确保逻辑清晰，步骤完整

请按以下格式返回：

===题目文本===
[提取的题目文本内容]

===解题过程===
步骤1: [标题]
[详细说明]
公式: $[LaTeX公式]$（如果有）

步骤2: [标题]
[详细说明]
公式: $[LaTeX公式]$（如果有）

...

请确保格式严格按照上述要求，每个步骤都要有明确的标题和说明。`

      if (!subject) {
        return basePrompt
      }

      // 根据不同科目添加专门的指导
      const subjectSpecificGuidance: Record<string, string> = {
        "数学": `
特别注意：
- 明确标注每个数学概念和公式
- 详细说明计算过程中的每一步
- 如果是几何题，请描述图形特征和关系
- 如果是代数题，请说明变量含义和方程建立过程`,
        
        "物理": `
特别注意：
- 明确物理概念和定律的应用
- 标注所有物理量的单位
- 画出必要的受力图或过程图
- 说明物理原理和现象背后的机制`,
        
        "化学": `
特别注意：
- 写出完整的化学方程式
- 说明反应机理和条件
- 标注原子结构和电子配置（如适用）
- 解释化学现象的本质原因`,
        
        "语文": `
特别注意：
- 分析文本结构和修辞手法
- 解释词语含义和语境作用
- 阐述主题思想和情感表达
- 结合文化背景和时代特点`,
        
        "英语": `
特别注意：
- 分析语法结构和语言特点
- 解释词汇用法和搭配
- 说明语言表达的技巧和效果
- 注意时态、语态和句型变化`,
        
        "历史": `
特别注意：
- 分析历史事件的时间、地点、人物
- 说明历史背景和社会条件
- 解释因果关系和历史意义
- 联系相关的历史知识点`,
        
        "地理": `
特别注意：
- 分析地理要素和空间关系
- 说明地理现象的形成原因
- 结合地图和数据进行分析
- 解释人地关系和环境影响`,
        
        "政治": `
特别注意：
- 运用政治理论和概念分析
- 结合时事和现实问题
- 说明制度特点和运行机制
- 体现价值判断和思想认识`,
        
        "生物": `
特别注意：
- 分析生物结构和功能关系
- 说明生理过程和机制
- 运用生物学概念和原理
- 结合实验和观察数据`,
        
        "道德与法治": `
特别注意：
- 运用法律知识和道德原则
- 分析社会现象和问题
- 说明权利义务和责任担当
- 体现正确的价值观念`,
        
        "科学": `
特别注意：
- 运用科学方法和思维
- 分析科学现象和规律
- 说明实验过程和原理
- 结合生活实际和应用实例`
      }

      const subjectGuidance = subjectSpecificGuidance[subject.name] || ""
      
      return `${basePrompt}

${subjectGuidance}

当前科目：${subject.category}${subject.name}
请特别关注该科目的特点和要求进行分析。`
    }
    
    const prompt = getSubjectSpecificPrompt(subject)
    
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
    })
    
    const responseText = response.text?.trim()
    if (!responseText) {
      throw new Error('AI未返回有效的结果')
    }

    // 解析AI回复，提取题目文本和解题步骤
    const result = parseProblemTextAndSolution(responseText)
    
    const totalTime = Date.now() - startTime
    console.log(`  ✅ 题目文本提取和解题过程生成完成，耗时: ${totalTime}ms`)
    
    return result

  } catch (error) {
    const totalTime = Date.now() - startTime
    console.error(`  ❌ 题目文本提取和解题过程生成失败，耗时: ${totalTime}ms`)
    console.error('题目文本提取和解题过程生成失败:', error)
    throw error
  }
}

// 解析AI回复，提取题目文本和解题步骤
function parseProblemTextAndSolution(text: string): {problemText: string, solutionSteps: SolutionStep[]} {
  const lines = text.split('\n').map(line => line.trim())
  
  let problemText = ''
  let solutionText = ''
  let isInProblemSection = false
  let isInSolutionSection = false
  
  for (const line of lines) {
    if (line.includes('===题目文本===')) {
      isInProblemSection = true
      isInSolutionSection = false
      continue
    }
    
    if (line.includes('===解题过程===')) {
      isInProblemSection = false
      isInSolutionSection = true
      continue
    }
    
    if (isInProblemSection && line) {
      problemText += line + '\n'
    }
    
    if (isInSolutionSection && line) {
      solutionText += line + '\n'
    }
  }
  
  // 清理文本
  problemText = problemText.trim()
  solutionText = solutionText.trim()
  
  // 如果解析失败，使用整个文本作为题目文本
  if (!problemText) {
    problemText = text
  }
  
  // 解析解题步骤
  const solutionSteps = parseStepsFromText(solutionText)
  
  return {
    problemText,
    solutionSteps: solutionSteps.length > 0 ? solutionSteps : [{
      step: 1,
      title: "解题分析",
      content: solutionText || "无法解析解题步骤"
    }]
  }
}

export async function generateSolutionSteps(imagePath: string, subject?: Subject): Promise<SolutionStep[]> {
  try {
    const apiKey = configureApiKey()
    const ai = new GoogleGenAI({ apiKey })

    const imageBytes = fs.readFileSync(imagePath)
    const base64Image = imageBytes.toString('base64')
    
    // 根据科目生成专门的prompt
    const getSubjectSpecificPrompt = (subject?: Subject): string => {
      const basePrompt = `请仔细分析图片中的题目，生成详细的解题过程。

要求：
1. 分析题目要求和已知条件
2. 确定解题方法和思路
3. 提供清晰的步骤标题
4. 给出详细的解题说明
5. 如果涉及重要公式，请用LaTeX格式表示（用$符号包围）
6. 确保逻辑清晰，步骤完整

请按以下格式返回3-6个主要解题步骤：

步骤1: [标题]
[详细说明]
公式: $[LaTeX公式]$（如果有）

步骤2: [标题]
[详细说明]
公式: $[LaTeX公式]$（如果有）

...

请确保格式严格按照上述要求，每个步骤都要有明确的标题和说明。`

      if (!subject) {
        return basePrompt
      }

      // 根据不同科目添加专门的指导
      const subjectSpecificGuidance: Record<string, string> = {
        "数学": `
特别注意：
- 明确标注每个数学概念和公式
- 详细说明计算过程中的每一步
- 如果是几何题，请描述图形特征和关系
- 如果是代数题，请说明变量含义和方程建立过程`,
        
        "物理": `
特别注意：
- 明确物理概念和定律的应用
- 标注所有物理量的单位
- 画出必要的受力图或过程图
- 说明物理原理和现象背后的机制`,
        
        "化学": `
特别注意：
- 写出完整的化学方程式
- 说明反应机理和条件
- 标注原子结构和电子配置（如适用）
- 解释化学现象的本质原因`,
        
        "语文": `
特别注意：
- 分析文本结构和修辞手法
- 解释词语含义和语境作用
- 阐述主题思想和情感表达
- 结合文化背景和时代特点`,
        
        "英语": `
特别注意：
- 分析语法结构和语言特点
- 解释词汇用法和搭配
- 说明语言表达的技巧和效果
- 注意时态、语态和句型变化`,
        
        "历史": `
特别注意：
- 分析历史事件的时间、地点、人物
- 说明历史背景和社会条件
- 解释因果关系和历史意义
- 联系相关的历史知识点`,
        
        "地理": `
特别注意：
- 分析地理要素和空间关系
- 说明地理现象的形成原因
- 结合地图和数据进行分析
- 解释人地关系和环境影响`,
        
        "政治": `
特别注意：
- 运用政治理论和概念分析
- 结合时事和现实问题
- 说明制度特点和运行机制
- 体现价值判断和思想认识`,
        
        "生物": `
特别注意：
- 分析生物结构和功能关系
- 说明生理过程和机制
- 运用生物学概念和原理
- 结合实验和观察数据`,
        
        "道德与法治": `
特别注意：
- 运用法律知识和道德原则
- 分析社会现象和问题
- 说明权利义务和责任担当
- 体现正确的价值观念`,
        
        "科学": `
特别注意：
- 运用科学方法和思维
- 分析科学现象和规律
- 说明实验过程和原理
- 结合生活实际和应用实例`
      }

      const subjectGuidance = subjectSpecificGuidance[subject.name] || ""
      
      return `${basePrompt}

${subjectGuidance}

当前科目：${subject.category}${subject.name}
请特别关注该科目的特点和要求进行分析。`
    }
    
    const prompt = getSubjectSpecificPrompt(subject)
    
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
    })
    
    const responseText = response.text?.trim()
    if (!responseText) {
      throw new Error('AI未返回有效的解题步骤')
    }

    // 解析AI回复文本，提取解题步骤
    const steps = parseStepsFromText(responseText)
    
    if (steps.length === 0) {
      throw new Error('无法解析AI返回的解题步骤')
    }

    return steps

  } catch (error) {
    console.error('解题过程生成失败:', error)
    return [
      {
        step: 1,
        title: "解题过程生成失败",
        content: "系统遇到问题，无法生成解题步骤。请检查网络连接后重试。"
      }
    ]
  }
}

// 解析AI回复文本，提取解题步骤
function parseStepsFromText(text: string): SolutionStep[] {
  const steps: SolutionStep[] = []
  
  // 按行分割文本
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0)
  
  let currentStep: Partial<SolutionStep> | null = null
  let stepNumber = 1
  
  for (const line of lines) {
    // 检查是否是步骤标题行（以"步骤"开头）
    const stepMatch = line.match(/^步骤\s*(\d+)\s*[:：]\s*(.+)$/i)
    if (stepMatch) {
      // 保存前一个步骤
      if (currentStep && currentStep.title) {
        steps.push({
          step: currentStep.step || stepNumber - 1,
          title: currentStep.title,
          content: currentStep.content || '',
          formula: currentStep.formula
        })
      }
      
      // 开始新步骤
      currentStep = {
        step: parseInt(stepMatch[1]) || stepNumber,
        title: stepMatch[2],
        content: '',
        formula: undefined
      }
      stepNumber++
    }
    // 检查是否是公式行
    else if (line.match(/^公式\s*[:：]/i)) {
      if (currentStep) {
        const formulaMatch = line.match(/^公式\s*[:：]\s*\$(.+)\$/)
        if (formulaMatch) {
          currentStep.formula = formulaMatch[1]
        }
      }
    }
    // 其他行作为内容
    else if (currentStep) {
      if (currentStep.content) {
        currentStep.content += '\n' + line
      } else {
        currentStep.content = line
      }
    }
  }
  
  // 保存最后一个步骤
  if (currentStep && currentStep.title) {
    steps.push({
      step: currentStep.step || stepNumber,
      title: currentStep.title,
      content: currentStep.content || '',
      formula: currentStep.formula
    })
  }
  
  // 如果解析失败，尝试简单的备选方案
  if (steps.length === 0) {
    // 简单地将整个文本作为一个步骤
    steps.push({
      step: 1,
      title: "解题分析",
      content: text
    })
  }
  
  return steps
}

// ==============================================================================
//  主分析函数
// ==============================================================================

export async function analyzeImage(imagePath: string, subject?: Subject): Promise<AnalysisResult> {
  const startTime = Date.now()
  console.log('🚀 开始题目分析流程...')
  
  try {
    const proxy = "http://127.0.0.1:7890";
    const agent = new HttpsProxyAgent(proxy);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const proxyFetch = (url: string, options: any) => {
        return fetch(url, { ...options, agent });
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).fetch = proxyFetch;

    // 设置默认值
    const studyPhase = subject?.studyPhaseCode || "300"
    const subjectCode = subject?.subjectCode || "2"

    // 1. 获取知识点树
    const step1Start = Date.now()
    console.log('📚 步骤1: 获取知识点树...')
    const knowledgeTreeData = await fetchKnowledgeTree(studyPhase, subjectCode)
    const [choicesForLLM, idLookupMap] = processKnowledgeTree(knowledgeTreeData)
    const step1Time = Date.now() - step1Start
    console.log(`✅ 步骤1完成，耗时: ${step1Time}ms，获取到 ${choicesForLLM.length} 个知识点`)
    
    if (!choicesForLLM || choicesForLLM.length === 0) {
      throw new Error('未能从知识点树中提取任何有效的叶子节点')
    }

    // 2. 合并提取题目文本和生成解题过程（一次模型调用）
    const step2Start = Date.now()
    console.log('🤖 步骤2: 提取题目文本并生成解题过程...')
    const { problemText, solutionSteps } = await extractProblemTextAndGenerateSolution(imagePath, subject)
    const step2Time = Date.now() - step2Start
    console.log(`✅ 步骤2完成，耗时: ${step2Time}ms，提取文本长度: ${problemText?.length || 0} 字符`)
    
    if (!problemText) {
      throw new Error('未能提取到有效的题目文本')
    }

    // 3. 基于提取的题目文本选择知识点
    const step3Start = Date.now()
    console.log('🎯 步骤3: 基于文本选择知识点...')
    const selectedKnowledgePath = await getKnowledgePointFromText(problemText, choicesForLLM, subject)
    const step3Time = Date.now() - step3Start
    console.log(`✅ 步骤3完成，耗时: ${step3Time}ms，选择知识点: ${selectedKnowledgePath}`)
    
    if (!selectedKnowledgePath) {
      throw new Error('AI未能识别出有效的知识点')
    }

    // 4. 根据知识点查询题目
    const step4Start = Date.now()
    console.log('🔍 步骤4: 根据知识点查询题目...')
    const targetId = idLookupMap[selectedKnowledgePath]
    if (!targetId) {
      throw new Error(`在映射字典中找不到路径 '${selectedKnowledgePath}' 对应的ID`)
    }

    const initialResults = await queryStzyApi(targetId, studyPhase, subjectCode)
    const step4Time = Date.now() - step4Start
    console.log(`✅ 步骤4完成，耗时: ${step4Time}ms，查询到 ${initialResults?.data?.list?.length || 0} 道候选题目`)
    
    if (!initialResults || !initialResults.data || !initialResults.data.list) {
      throw new Error('未能获取初步题目列表')
    }

    const initialProblemList = initialResults.data.list

    // 5. 使用embedding进行语义相似度比较，精选题目
    const step5Start = Date.now()
    console.log('🧠 步骤5: 使用embedding进行相似度比较...')
    const top3Results = await rankProblemsWithEmbedding(problemText, initialProblemList)
    const step5Time = Date.now() - step5Start
    console.log(`✅ 步骤5完成，耗时: ${step5Time}ms，精选出 ${top3Results.length} 道题目`)
    
    // 6. 过滤出最终题目并创建相似度映射
    const step6Start = Date.now()
    console.log('📋 步骤6: 过滤最终题目...')
    const top3Ids = top3Results.map(result => result.id)
    const similarityMap = new Map(top3Results.map(result => [result.id, result.similarity]))
    
    const finalProblems = initialProblemList.filter((p: ProblemItem) => 
      top3Ids.includes(p.questionId)
    )
    const step6Time = Date.now() - step6Start
    console.log(`✅ 步骤6完成，耗时: ${step6Time}ms，过滤出 ${finalProblems.length} 道题目`)

    // 7. 转换为前端需要的格式（使用已有的相似度值）
    const step7Start = Date.now()
    console.log('📊 步骤7: 格式化结果...')
    const problems = finalProblems.map((problem: ProblemItem) => {
      // 使用第5步计算好的相似度值
      const similarity = similarityMap.get(problem.questionId) || 0.85
      
      return {
        id: problem.questionId,
        title: extractProblemContent(problem.questionArticle || '').substring(0, 50) + '...',
        content: extractProblemContent(problem.questionArticle || ''), // 去除标题，保留题目正文
        difficulty: 'medium' as const, // 可以根据实际情况调整
        tags: [selectedKnowledgePath.split(' -> ').pop() || ''],
        similarity: Math.round(similarity * 100), // 转换为百分比
        estimatedTime: Math.floor(Math.random() * 10) + 10,
        source: '题库'
      }
    })
    const step7Time = Date.now() - step7Start
    console.log(`✅ 步骤7完成，耗时: ${step7Time}ms，生成了 ${problems.length} 道推荐题目`)

    const totalTime = Date.now() - startTime
    console.log('🎉 分析流程完成！')
    console.log('📈 性能统计:')
    console.log(`   总耗时: ${totalTime}ms`)
    console.log(`   步骤1 (知识点树): ${step1Time}ms (${((step1Time/totalTime)*100).toFixed(1)}%)`)
    console.log(`   步骤2 (文本提取+解题): ${step2Time}ms (${((step2Time/totalTime)*100).toFixed(1)}%)`)
    console.log(`   步骤3 (知识点选择): ${step3Time}ms (${((step3Time/totalTime)*100).toFixed(1)}%)`)
    console.log(`   步骤4 (题库查询): ${step4Time}ms (${((step4Time/totalTime)*100).toFixed(1)}%)`)
    console.log(`   步骤5 (相似度比较): ${step5Time}ms (${((step5Time/totalTime)*100).toFixed(1)}%)`)
    console.log(`   步骤6 (题目过滤): ${step6Time}ms (${((step6Time/totalTime)*100).toFixed(1)}%)`)
    console.log(`   步骤7 (结果格式化): ${step7Time}ms (${((step7Time/totalTime)*100).toFixed(1)}%)`)

    return {
      knowledgePoint: selectedKnowledgePath,
      solution: solutionSteps,
      problems,
      analysisId: `analysis_${Date.now()}`,
      status: 'completed'
    }

  } catch (error) {
    const totalTime = Date.now() - startTime
    console.error(`❌ 分析失败，总耗时: ${totalTime}ms`)
    console.error('分析失败:', error)
    throw error
  }
} 

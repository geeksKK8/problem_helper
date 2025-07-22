import { NextResponse } from 'next/server'
import { fetchKnowledgeTree, processKnowledgeTree } from '@/lib/ai'

export async function GET() {
  try {
    const knowledgeTreeData = await fetchKnowledgeTree()
    const [choicesForLLM] = processKnowledgeTree(knowledgeTreeData)
    
    // 转换为前端需要的格式
    const knowledgePoints = choicesForLLM.map((path, index) => ({
      id: `kp_${index}`,
      path,
      title: path.split(' -> ').pop() || '',
      isLeaf: true
    }))

    return NextResponse.json({
      success: true,
      data: knowledgePoints
    })

  } catch (error) {
    console.error('获取知识点失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '获取知识点失败' 
      },
      { status: 500 }
    )
  }
} 
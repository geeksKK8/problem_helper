# 相似度计算逻辑分析

## 📊 当前相似度计算流程

### 1. **AI 题目生成阶段**
**文件**: `src/lib/ai.ts` (第559行)

```typescript
// 7. 转换为前端需要的格式，保留HTML格式并去除标题
const problems = finalProblems.map((problem: ProblemItem) => ({
  id: problem.questionId,
  title: extractProblemContent(problem.questionArticle || '').substring(0, 50) + '...',
  content: extractProblemContent(problem.questionArticle || ''), 
  difficulty: 'medium' as const,
  tags: [selectedKnowledgePath.split(' -> ').pop() || ''],
  similarity: Math.floor(Math.random() * 20) + 80, // 模拟相似度 80-99
  estimatedTime: Math.floor(Math.random() * 10) + 10,
  source: '题库'
}))
```

**说明**: 目前相似度是通过随机数生成的模拟值，范围是80-99（整数）。这并不是真正的相似度算法。

### 2. **平均相似度计算**
**文件**: `src/lib/api.ts` (第310-311行)

```typescript
// 计算平均相似度和题目数量
const avgSimilarity = data.problems.length > 0 
  ? data.problems.reduce((sum, p) => sum + p.similarity, 0) / data.problems.length 
  : 0
```

**说明**: 计算推荐题目的平均相似度，结果保存到数据库的 `avg_similarity` 字段。

### 3. **数据库存储格式**
**文件**: `POCKETBASE_HISTORY_SCHEMA.md`

- **个别题目相似度**: 存储在 `problems` JSON 字段中，格式如 `"similarity": 85`（整数）
- **平均相似度**: 存储在 `avg_similarity` 字段，格式如 `0.85`（小数）

### 4. **前端显示逻辑 (当前-错误)**
**文件**: `src/app/dashboard/history/page.tsx` (第130-131行)

```typescript
// 格式化相似度
const formatSimilarity = (similarity: number) => {
  return `${(similarity * 100).toFixed(1)}%`  // ❌ 错误：乘以100
}
```

**问题**: 
- 对于 `avg_similarity = 85`，显示为 `8500.0%` ❌
- 应该显示为 `85%` ✅

## 🔍 相似度算法分析

### 当前实现（模拟）
```typescript
similarity: Math.floor(Math.random() * 20) + 80  // 80-99随机整数
```

### 实际应该的算法逻辑
1. **题目内容分析**: 使用NLP技术分析题目文本内容
2. **知识点匹配**: 基于知识点树的层级匹配
3. **AI排序**: 使用 `rankProblemsWithLLM` 进行智能排序
4. **相似度评分**: 根据排序位置和内容匹配度给出分数

### 改进建议
1. **替换随机数**: 基于 `rankProblemsWithLLM` 的排序结果计算真实相似度
2. **算法优化**: 结合文本相似度、知识点匹配度、题目类型等因素
3. **动态调整**: 根据用户反馈调整相似度算法

## 📈 数据流向图

```
原始题目图片 
    ↓
AI知识点识别 → 题库查询 → 初始题目列表
    ↓
rankProblemsWithLLM → Top3题目筛选
    ↓
相似度计算 (当前: 随机80-99) → 题目数组
    ↓
平均相似度计算 → 数据库存储
    ↓
前端显示 (需修复: 不要乘100)
```

## 🔧 需要修复的问题

1. **相似度显示错误**: 数据库中已存储百分比整数，前端不应该再乘100
2. **模拟算法**: 当前使用随机数，需要实现真实的相似度计算
3. **一致性问题**: 个别题目和平均相似度的存储格式不一致

## 📋 修复计划

1. ✅ **立即修复**: 前端显示逻辑，直接添加%号
2. 🔄 **中期优化**: 基于AI排序结果计算真实相似度
3. 🚀 **长期改进**: 实现机器学习相似度算法 
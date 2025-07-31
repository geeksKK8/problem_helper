# PocketBase 历史记录表结构

## analysis_history 表

用于存储用户的题目分析历史记录。

### 字段定义

| 字段名 | 类型 | 必填 | 描述 | 示例 |
|--------|------|------|------|------|
| id | text | ✓ | 主键ID（自动生成） | `hist_abc123` |
| user | relation | ✓ | 用户ID（关联users表） | `user_xyz789` |
| image_url | text | ✓ | 上传的题目图片URL | `/uploads/image_123.jpg` |
| original_image_name | text | ✓ | 原始图片文件名 | `math_problem.jpg` |
| knowledge_point | text | ✓ | AI识别的知识点 | `高中数学 -> 函数 -> 二次函数` |
| solution | json | | 解题步骤数组 | `[{"step":1,"title":"分析题意","content":"..."}]` |
| problems | json | ✓ | 推荐的相似题目数组 | `[{"id":"prob_1","title":"...","similarity":0.95}]` |
| status | select | ✓ | 分析状态 | `completed` / `processing` / `failed` |
| avg_similarity | number | | 平均相似度 | `0.92` |
| problem_count | number | ✓ | 推荐题目数量 | `5` |
| created | datetime | ✓ | 创建时间（自动） | `2024-01-01T00:00:00.000Z` |
| updated | datetime | ✓ | 更新时间（自动） | `2024-01-01T00:00:00.000Z` |

### 字段规则

#### status 字段选项
- `processing` - 正在分析中
- `completed` - 分析完成
- `failed` - 分析失败

#### solution JSON 结构
```json
[
  {
    "step": 1,
    "title": "分析题意",
    "content": "根据题目描述，这是一个二次函数问题...",
    "formula": "f(x) = ax² + bx + c"
  },
  {
    "step": 2,
    "title": "建立方程",
    "content": "根据给定条件建立方程组...",
    "formula": "f(1) = 0, f(3) = 0, f(0) = 3"
  }
]
```

#### problems JSON 结构
```json
[
  {
    "id": "prob_123",
    "title": "二次函数图像与性质",
    "content": "已知二次函数f(x)=ax²+bx+c...",
    "difficulty": "medium",
    "tags": ["二次函数", "图像", "性质"],
    "similarity": 0.95,
    "estimatedTime": 15,
    "source": "高考真题"
  }
]
```

### 索引

建议创建以下索引以提高查询性能：

1. **用户索引**: `user` 字段
2. **状态索引**: `status` 字段  
3. **时间索引**: `created` 字段（降序）
4. **复合索引**: `user + created`（用户历史记录按时间排序）

### API 字段映射

PocketBase 字段 → 前端接口字段：

- `id` → `id`
- `user` → `userId` 
- `image_url` → `imageUrl`
- `original_image_name` → `originalImageName`
- `knowledge_point` → `knowledgePoint`
- `solution` → `solution`
- `problems` → `problems`
- `status` → `status`
- `avg_similarity` → `avgSimilarity`
- `problem_count` → `problemCount`
- `created` → `createdAt`
- `updated` → `updatedAt`

### 查询示例

#### 获取用户历史记录（分页）
```javascript
await pb.collection('analysis_history').getList(1, 10, {
  filter: 'user = "user_xyz789"',
  sort: '-created',
});
```

#### 按状态筛选
```javascript
await pb.collection('analysis_history').getList(1, 10, {
  filter: 'user = "user_xyz789" && status = "completed"',
  sort: '-created',
});
```

#### 按知识点搜索
```javascript
await pb.collection('analysis_history').getList(1, 10, {
  filter: 'user = "user_xyz789" && knowledge_point ~ "二次函数"',
  sort: '-created',
});
```

### 权限设置

- **listRule**: `user = @request.auth.id` （用户只能查看自己的记录）
- **viewRule**: `user = @request.auth.id` （用户只能查看自己的记录详情）
- **createRule**: `user = @request.auth.id` （用户只能创建自己的记录）
- **updateRule**: `user = @request.auth.id` （用户只能更新自己的记录）
- **deleteRule**: `user = @request.auth.id` （用户只能删除自己的记录） 
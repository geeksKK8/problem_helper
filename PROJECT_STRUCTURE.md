# AI助手项目结构说明

## 项目重组说明

### 问题原因
之前存在两个src目录的原因：
1. **根目录的src/**: 在创建Next.js项目时意外创建，包含了我们编写的组件和页面文件
2. **ai-helper-website/src/**: Next.js项目创建时自动生成的，包含了shadcn/ui组件和基础文件

这造成了文件重复和混乱。

### 解决方案
已将项目重新组织为单一的项目结构，所有文件现在都在根目录下。

## 当前项目结构

```
problem_helper/
├── .git/                      # Git版本控制
├── .next/                     # Next.js构建缓存
├── node_modules/              # 项目依赖
├── public/                    # 静态资源
├── src/                       # 源代码目录
│   ├── app/                   # Next.js App Router页面
│   │   ├── (auth)/           # 认证相关页面
│   │   │   └── login/        # 登录页面
│   │   ├── (dashboard)/      # 仪表板相关页面
│   │   │   ├── dashboard/    # 仪表板主页
│   │   │   ├── analyze/      # 题目分析页面
│   │   │   ├── history/      # 历史记录页面
│   │   │   └── profile/      # 个人资料页面
│   │   ├── demo/             # 演示页面
│   │   ├── layout.tsx        # 根布局
│   │   └── page.tsx          # 首页
│   ├── components/           # 组件目录
│   │   ├── ui/              # shadcn/ui组件
│   │   ├── auth/            # 认证组件
│   │   ├── upload/          # 上传组件
│   │   ├── analysis/        # 分析组件
│   │   ├── problems/        # 题目组件
│   │   ├── history/         # 历史组件
│   │   ├── layout/          # 布局组件
│   │   └── common/          # 通用组件
│   ├── lib/                 # 工具库
│   │   ├── utils.ts         # 工具函数
│   │   ├── store.ts         # 状态管理
│   │   └── api.ts           # API客户端
│   └── types/               # 类型定义
│       └── index.ts         # 基础类型
├── ai_helper.js             # 核心AI功能模块
├── main.py                  # Python版本参考
├── example.js               # JavaScript示例
├── example2.js              # JavaScript示例
├── demo.js                  # 演示脚本
├── test.js                  # 测试脚本
├── math_problem.png         # 测试图片
├── package.json             # 项目配置
├── package-lock.json        # 依赖锁定文件
├── bun.lock                 # Bun锁定文件
├── tsconfig.json            # TypeScript配置
├── next.config.ts           # Next.js配置
├── tailwind.config.ts       # Tailwind配置
├── components.json          # shadcn/ui配置
├── eslint.config.mjs        # ESLint配置
├── postcss.config.mjs       # PostCSS配置
├── .gitignore               # Git忽略文件
├── next-env.d.ts           # Next.js类型定义
├── README.md                # 项目说明
├── PROJECT_SUMMARY.md       # 项目总结
├── PROJECT_SETUP.md         # 项目设置指南
├── WEBSITE_DESIGN.md        # 网站设计文档
├── COMPONENT_EXAMPLES.md    # 组件示例
└── IMPLEMENTATION_SUMMARY.md # 实现总结
```

## 文件分类说明

### 核心功能文件
- `ai_helper.js`: 核心AI功能模块，实现题目分析功能
- `main.py`: Python版本参考实现
- `example.js`, `example2.js`: JavaScript示例代码
- `demo.js`, `test.js`: 演示和测试脚本

### 前端网站文件
- `src/`: Next.js前端应用
- `package.json`: 项目依赖配置
- 各种配置文件: TypeScript, Next.js, Tailwind等

### 文档文件
- `README.md`: 项目主要说明
- `PROJECT_SUMMARY.md`: 详细项目总结
- `PROJECT_SETUP.md`: 项目设置指南
- `WEBSITE_DESIGN.md`: 网站设计文档
- `COMPONENT_EXAMPLES.md`: 组件实现示例
- `IMPLEMENTATION_SUMMARY.md`: 实现总结

## 开发指南

### 运行前端网站
```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

### 运行AI功能模块
```bash
# 运行JavaScript版本
node ai_helper.js

# 运行Python版本
python main.py
```

### 访问网站
- 首页: http://localhost:3000
- 演示页面: http://localhost:3000/demo
- 登录页面: http://localhost:3000/login

## 项目特点

1. **统一结构**: 所有文件都在根目录下，结构清晰
2. **功能完整**: 包含AI功能模块和前端网站
3. **文档齐全**: 提供详细的设计和实现文档
4. **示例丰富**: 包含Python和JavaScript两个版本的实现
5. **现代化技术**: 使用Next.js 14和shadcn/ui

## 注意事项

1. 确保安装了Node.js 18+和npm
2. 配置Google AI API密钥才能使用AI功能
3. 前端网站需要配置环境变量
4. 建议使用VS Code进行开发，支持TypeScript和React

这个重新组织的项目结构更加清晰和易于维护。 
# English Learning Platform - 真实语料英语学习平台

基于真实 YouTube vlog 语料的英语学习平台，通过影子跟读和听写练习提高英语口语和听力能力。

## ✨ 功能特性

- 📹 **200+ YouTube vlog 真实语料**
  - 覆盖生活、日常、住房、健身、旅游、人文、美妆等实用主题
  - 90% 来自英语核心圈（英美加澳新）的母语博主
  
- 🎯 **动态字幕系统**
  - 单句暂停和单句循环
  - 手工截取对齐的完整语义群
  - 支持双语、英语、中文、IPA 字幕显示
  
- 📝 **听写模式**
  - 边听边记录
  - 搭配单句暂停/循环功能
  
- 💡 **智能知识点标注**
  - 单词、短语、短语动词、搭配、口语句式、话语标记
  - 中英释义、中英例句、IPA 音标
  - 考级标签、用法说明、备注
  
- 🔊 **发音功能**
  - 单词英美标准发音
  - IPA 音标显示

## 🛠 技术栈

- **前端框架**: Next.js 14 (App Router) + TypeScript
- **样式**: TailwindCSS + CSS Variables
- **数据库**: PostgreSQL + Prisma ORM
- **视频播放**: React Player
- **状态管理**: Zustand
- **UI 组件**: Lucide React Icons

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/Tezcay/english-learning-platform.git
cd english-learning-platform
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量（可选）

```bash
cp .env.example .env
```

### 4. 启动开发服务器

```bash
npm run dev
```

打开浏览器访问 [http://localhost:3000](http://localhost:3000)

## 📚 学习方法

### 口语练习 - 影子跟读法

1. **无字幕观看**：熟悉整体语境和语速
2. **调整倍速**：0.5-0.8x，听懂多少说出来多少
3. **打开字幕**：结合地道表达和单词理解片段
4. **单句暂停模式**：每句播放完后凭记忆复述
5. **重复练习**：直到听到这句话可以脱口而出
6. **原速挑战**：关闭字幕，原速跟读，模仿语速、发音、语调
7. **坚持练习**：每天一个片段，20-30分钟

### 听力练习 - 听写模式

1. **无字幕播放**：熟悉整体语境
2. **听写模式**：单句暂停，写下听到的内容
3. **循环播放**：没听清的部分重复听
4. **对比字幕**：记录没听出来的词
5. **针对性练习**：对困难部分多听几遍

## 📁 项目结构

```
english-learning-platform/
├── prisma/
│   └── schema.prisma          # 数据库模型定义
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── layout.tsx         # 根布局
│   │   ├── page.tsx           # 首页（课程列表）
│   │   ├── globals.css        # 全局样式
│   │   └── lesson/
│   │       └── [id]/
│   │           └── page.tsx   # 课程学习页面
│   ├── components/
│   │   └── CourseCard.tsx     # 课程卡片组件
│   ├── lib/
│   │   ├── prisma.ts          # Prisma 客户端
│   │   └── utils.ts           # 工具函数
│   ├── store/
│   │   └── usePlayerStore.ts  # 播放器状态管理
│   └── types/
│       └── index.ts           # TypeScript 类型定义
├── .env.example               # 环境变量示例
├── package.json
├── tsconfig.json
└── tailwind.config.ts
```

## 🗄 数据库模型

- **Lesson**（课程）：课程信息、YouTube ID、博主、难度、标签
- **Subtitle**（字幕）：时间戳、中英文本、IPA 音标
- **KnowledgePoint**（知识点）：类型、释义、例句、发音
- **User**（用户）：用户信息和学习进度

## 🎯 开发路线图

### ✅ 第一阶段（已完成）
- [x] 项目初始化
- [x] 数据库设计
- [x] 基础页面和组件
- [x] 课程列表展示

### 🚧 第二阶段（计划中）
- [ ] 视频播放器组件
- [ ] 动态字幕系统
- [ ] 播放控制（暂停、循环、倍速）

### 📋 第三阶段（计划中）
- [ ] 知识点标注和展示
- [ ] 听写模式
- [ ] 学习进度追踪

## 💻 可用脚本

```bash
npm run dev      # 启动开发服务器
npm run build    # 构建生产版本
npm run start    # 启动生产服务器
npm run lint     # 运行 ESLint
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 License

MIT

---

**⭐ 如果这个项目对你有帮助，请给个 Star！**

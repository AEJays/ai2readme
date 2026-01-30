<h1 align="center">ai2readme</h1>

<p align="center">AI 智能生成项目文档，一键搞定 🚀</p>


<p align="center">
  <img alt="Github top language" src="https://img.shields.io/github/languages/top/AEJays/ai2readme?color=56BEB8">
  <img alt="Github language count" src="https://img.shields.io/github/languages/count/AEJays/ai2readme?color=56BEB8">
  <img alt="Repository size" src="https://img.shields.io/github/repo-size/AEJays/ai2readme?color=56BEB8">
  <img alt="License" src="https://img.shields.io/github/license/AEJays/ai2readme?color=56EB8">
  <img alt="Github issues" src="https://img.shields.io/github/issues/AEJays/ai2readme?color=56BEB8" />
  <img alt="Github forks" src="https://img.shields.io/github/forks/AEJays/ai2readme?color=56BEB8" />
  <img alt="Github stars" src="https://img.shields.io/github/stars/AEJays/ai2readme?color=56BEB8" />
</p>
<p align="center">
  <span>中文</span> &#xa0; | &#xa0; 
  <a href="README_EN.md">English</a>
</p>

## 项目简介

本项目旨在帮助整合项目内容并自动生成 Markdown 文档。

## 安装方法

环境要求
*   Node.js (v16+)

安装依赖
```bash
npm install
```

配置环境变量
在项目根目录创建 `.env` 文件，并设置以下变量：

*   `AI_PROVIDER`: AI 服务提供商，支持 `zhipu`（智谱）或 `ollama`（本地）
*   `ZHIPU_API_KEY`: 智谱 AI API 密钥（使用智谱时必填）
*   `ZHIPU_BASE_URL`: 智谱 API 基础地址
*   `ZHIPU_MODEL`: 智谱使用的模型名称
*   `OLLAMA_BASE_URL`: Ollama API 基础地址
*   `OLLAMA_MODEL`: Ollama 使用的模型名称
*   `GENERATE_ENGLISH`: 是否生成英文版（可选，默认为 true）

基础命令
```bash
# 生成 README 文档
ai2readme generate [targetDir]

# 翻译 README 为英文
ai2readme translate [targetDir]

# 润色 README
ai2readme refine [targetDir]
```

## 使用指南

运行前准备
确保已按照[安装方法](#安装方法)完成依赖安装与环境变量配置。

高级用法

```bash
# 指定主入口文件进行分析
ai2readme generate ./my-project src/index.js

# 指定自定义配置文件
ai2readme generate ./my-project --config ./config.js
```

运行示例

```bash
$ ai2readme generate ./demo-project

🔍 正在分析项目: /path/to/demo-project
📁 忽略模式: node_modules/*, .git/, dist/, .env, ...
📦 模型: glm-4.6v-flash
📚 正在收集关键代码片段（最多 5 个文件）...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ README 生成成功，已保存至 .ai2readme/demo-project/README.md
```

```bash
$ ai2readme translate ./demo-project

🔍 正在分析项目: /path/to/demo-project
📚 正在收集关键代码片段（最多 5 个文件）...
✅ 成功生成英文翻译: .ai2readme/demo-project/README_EN.md
```

## 工作原理

1.  **GitHub 信息获取**：主要通过 `git remote -v` 获取，需配置 `origin` 且仓库为开源。
2.  **模块分析**：各模块使用不同提示词进行 AI 分析，支持自定义替换提示词。
3.  **配置与主文件**：默认读取 `package.json` 的 `main`/`name` 字段；支持 `--config` 模式指定配置文件。
4.  **模型支持**：基于 GLM-4.6v-flash 模型开发，如需切换模型（如 Ollama），请自行测试。

## 特性

| 特性 | 说明 |
| :--- | :--- |
| 多语言支持 | 支持 JavaScript、TypeScript、Python、Go、Rust、Java、Vue 等多种编程语言 |
| AI 驱动 | 集成智谱 AI 和 Ollama 本地模型，自动生成和润色文档 |
| 结构化输出 | 自动生成包含项目名称、简介、安装、用法、技术栈等标准章节的 README |
| 双语支持 | 支持一键生成英文版 README 翻译 |
| 智能润色 | 提供智能去重与格式修复功能，优化文档质量 |
| 灵活配置 | 支持自定义忽略目录、代码扩展名及最大分析文件数 |

## 技术栈

**核心依赖**

本项目依赖以下核心库以实现功能：

| 包名 | 版本 | 用途说明 |
| :--- | :--- | :--- |
| `openai` | ^6.16.0 | 处理与 OpenAI 的 API 交互，调用大语言模型 |
| `dotenv` | ^17.2.3 | 从 `.env` 文件加载环境变量，配置敏感信息 |
| `fs-extra` | ^11.3.3 | 扩展 Node.js 原生文件系统模块，提供更便捷的文件读写操作 |
| `ignore` | ^7.0.5 | 基于规则过滤文件与目录，支持 `.gitignore` 语法 |

## 项目结构

```text
ai2readme/
├── .env.example
├── .gitignore
├── LICENSE
├── config.js
├── index.js
├── package.json
├── prompts/
│   ├── en.js
│   └── zh.js
├── readme-resources/
│   ├── image/
│   │   └── alipay.jpg
│   └── video/
│       ├── generate.mp4
│       └── translate.mp4
├── utils/
│   ├── ai.js
│   ├── file.js
│   └── logger.js
└── writer.js
```

## 注意事项

⚠️ **环境配置与依赖**

*   必须创建 `.env` 文件并在其中配置环境变量。
*   如果使用默认的智谱 AI 后端，必须设置 `ZHIPU_API_KEY`，否则程序会报错退出。
*   `AI_PROVIDER` 环境变量必须设置为 `"zhipu"` 或 `"ollama"`，否则无法启动。
*   需要安装 `openai` 和 `dotenv` 库作为运行依赖。

⚠️ **命令执行顺序**

*   `translate`（翻译）和 `refine`（润色）命令依赖于 `generate`（生成）命令先运行。
*   如果目标目录下未生成 `README.md`，这两个命令会报错并提示“请先运行 generate 命令生成”。

⚠️ **代码分析范围限制**

*   分析过程限制为最多分析 5 个文件。
*   单个文件的代码行数限制为 100 行。
*   以下文件和目录会被自动忽略：`node_modules`, `.git`, `dist`, `build`, `.idea`, `.vscode`, `__pycache__`, `.env`, `*.log`, `coverage`, `log/`。

⚠️ **支持的代码扩展名**

*   仅支持分析以下扩展名的文件：`.js`, `.ts`, `.jsx`, `.tsx`, `.vue`, `.py`, `.go`, `.rs`, `.java`

## 更新日志

### v1.0 新增功能

✅ 项目结构自动分析

✅ 代码片段提取（支持限制文件数和单文件行数/支持确认获取代码）

✅ 自动生成 README

✅ README 翻译功能

✅ 全局命令交互

✅ 本地ollama模型支持

✅ 智谱AI云端支持

✅ 是否自动获取 .gitignore 文件进行自动过滤

✅ 生成输出文件夹指定

✅ 章节配置

✅ github库检测

### v1.1 优化功能

✅ 增加润色功能

## 未来版本规划

1.  增加到 npm 包管理中 方便全局安装 增加自定义配置控制管理

2.  增加 readme 简单编辑后直接整合重新生成（AI 解析重点 重新生成 保留重点 重新组织文字 包括重新生成结构树）

3.  增加 changelog 生成

4.  AI 规范式提交方式

5.  单独结构树重新生成

6.  更多类型文档支持（swagger-ui 文档结合并对应翻译，前端组件库文档自动编写等）

## 支持作者

如果你觉得我的项目对你有帮助，帮忙点个 star 吧！如果有巨大帮助，可以请我喝杯咖啡 ☕, 谢谢！

<img src="readme-resources/image/alipay.jpg" width="200" alt="支付宝二维码" />
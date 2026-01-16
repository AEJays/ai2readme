<h1 align="center">ai2readme</h1>

<p align="center">智能生成项目文档，提升开发效率 🚀</p>


<p align="center">
  <img alt="Github top language" src="https://img.shields.io/github/languages/top/AEJays/ai2readme?color=56BEB8">
  <img alt="Github language count" src="https://img.shields.io/github/languages/count/AEJays/ai2readme?color=56BEB8">
  <img alt="Repository size" src="https://img.shields.io/github/repo-size/AEJays/ai2readme?color=56BEB8">
  <img alt="License" src="https://img.shields.io/github/license/AEJays/ai2readme?color=56BEB8">
  <img alt="Github issues" src="https://img.shields.io/github/issues/AEJays/ai2readme?color=56BEB8" />
  <img alt="Github forks" src="https://img.shields.io/github/forks/AEJays/ai2readme?color=56BEB8" />
  <img alt="Github stars" src="https://img.shields.io/github/stars/AEJays/ai2readme?color=56BEB8" />
</p>
<p align="center">
  <span>中文</span> &#xa0; | &#xa0; 
  <a href="README_EN.md">English</a>
</p>

## 项目简介

该项目可以帮你把项目内容做整合，并生成markdown

### 项目部分获取原理

1. github库获取方式：主要是通过 git remote -v 进行获取，然后进行实现的，上方的几个github logo 需要你有设定git remote 的 origin 才可以获取到，且你的仓库必须是开源仓库

2. README 不同的模块分析用了不同的提示词进行AI分析，现在使用的模块经过较多的测试，你也可以替换成你自己比较适用的提示词，根据自己的模块，也可以自己添加模块

3. ai2readme generate 里的主文件，我这边默认使用 package.json 的 main 字段做了处理 一般来说 其他类型的代码可能没有 package.json 所以我这边做了可配置 js 项目可能会舒服一点使用  然后名字也是默认获取的 package.json 的 name 字段 除非说你项目没有 那么则会获取你文件夹的名称 --config 模式 大部分是给后端用的 前端也可以用 你只要指定配置文件即可（需要的时候 他会读取你的配置文件给到大模型）

4. 我这边所有的开发都是基于 glm-4.6v-flash 生成的，如果你替换的话，或者使用ollama本地模型，请自行测试

## 作者有话说

这个 README 文档基本 60% 都是由 ai2readme 生成的，本人只修改了一小部分，功能列表我会列在最下方，如果你觉得这个项目不错，请给个 star，如果你觉得这个项目特别好，对你帮助很大，想要请我喝杯咖啡，在最后方有我的支付宝二维码，谢谢！

为了方便修改，一般建议 clone 下来再全局安装，暂时不支持 npm 打包，后续可能会支持

## 操作视频

生成视频如下

<video src="./readme-resources/video/generate.mp4">生成操作视频</video>

[生成视频打开](./readme-resources/video/generate.mp4)

翻译视频如下

<video src="./readme-resources/video/translate.mp4">翻译操作视频</video>

[翻译视频打开](./readme-resources/video/translate.mp4)

## 获取方法
```bash
git clone https://github.com/AEJays/ai2readme.git
```

## 安装方法

1. 安装依赖
```bash
npm install -g .
```

2. 启动项目（运行命令）
```bash
# 生成项目 README 文档（默认命令）
ai2readme generate <targetDir> [mainFile]
# 翻译已生成的 README 为英文
ai2readme translate <targetDir>
# 显示帮助信息
ai2readme help

```

## 如何使用

### 如何运行

#### 准备环境
1. **配置环境变量（可选，仅使用智谱AI时）**  
  复制 '.env.example' 文件并重命名为 '.env'，并添加 API 密钥：
  .env.example 内容如下:
  ```env
  # 选择AI后端，可选zhipu或ollama
  AI_PROVIDER=zhipu
  # 智谱AI的API密钥(自己前往 https://open.bigmodel.cn/ 获取)
  ZHIPU_API_KEY=<Your ZHIPU AI API Key>
  # 智谱AI提供的模型名称，当前免费模型推荐
  ZHIPU_MODEL=glm-4.6v-flash # 现在智谱AI免费比较好的模型（已测验可用）
  # ollama服务的base URL，默认本地端口11434
  OLLAMA_BASE_URL=http://localhost:11434
  # ollama使用的本地模型名称
  OLLAMA_MODEL=<YourModel>
  ```

2. **运行命令**  
   使用 `ai2readme` 命令，支持以下子命令：
   - `generate`：生成项目 README
   - `translate`：翻译已生成的 README 为英文
   - `help`：显示帮助信息

#### 启动命令示例
- **默认生成当前目录的 README**：  
  ```bash
  ai2readme generate
  ```
- **指定目标目录和主文件**：  
  ```bash
  ai2readme generate ./my-project src/index.js
  ```
- **翻译已生成的 README 读取中文 README => 英文 README 只读取 ./my-project/README.md**：  
  ```bash
  ai2readme translate ./my-project
  ```

#### 交互示例
1. **显示帮助信息**：  
   ```bash
   ai2readme
   ```
   输出：  
   ```
   Usage: ai2readme <command> [arguments] [options]
   Commands:
     generate              生成项目 README 文档 (默认命令)
     translate             翻译已生成的 README 为英文
     help, --help, -h      显示帮助信息
   Arguments:
     [targetDir]           目标项目路径 (默认: 当前目录)
     [mainFile]            项目主入口文件名 (可选，用于分析核心逻辑，因为有些逻辑需要分析所有代码才能确定)
   Options:
     --config <file>       指定配置文件路径（可选，一般用于确定某个项目的配置有哪些）
   Examples:
     ai2readme
     ai2readme generate ./my-project src/index.js
     ai2readme translate ./my-project
     ai2readme help
     ai2readme --help
   ```

2. **运行生成命令后的输出**：  
   ```bash
   ai2readme generate ./my-project
   ```
   输出：  
   ```
   🔍 正在分析项目: /path/to/my-project
   📁 忽略模式: ['node_modules/*', '.git/', 'dist/', 'build/', '.idea/', '.vscode/', '__pycache__', '.env', '*.log', 'coverage', 'log/']
   ⚙️  指定配置文件: null
   📚 正在收集关键代码片段（最多 5 个文件）...
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ✅ 成功生成 README.md 于 .ai2readme/my-project/

## 特性

| 特性 | 说明 |
| --- | --- |
| 多AI后端支持 | 支持智谱AI云端（zhipu）和Ollama本地模型作为AI服务提供商 |
| 项目结构自动分析 | 自动扫描项目目录，生成文件结构信息 |
| 关键代码片段提取 | 提取项目核心代码片段（限制文件数和单文件行数） |
| 自动生成README | 基于AI分析项目信息，自动生成专业的中文README文档 |
| README翻译功能 | 支持将生成的README文档翻译为英文版本 |
| 命令行交互 | 提供generate（生成）、translate（翻译）、help（帮助）等命令行操作 |
| 灵活配置选项 | 可通过配置文件自定义忽略模式、代码文件类型、输出目录等 |
| 健壮的错误处理 | 包含错误日志记录和程序退出机制 |

## 技术栈

### 依赖说明
以下是项目使用的 Node.js 依赖，按功能分类整理：

- **工具库**
  - `dotenv (^17.2.3)`: 加载环境变量，方便管理配置
  - `fs-extra (^11.3.3)`: 扩展 Node.js 文件系统操作，支持更丰富的文件操作
  - `ignore (^7.0.5)`: 提供文件/目录忽略规则，常用于构建流程中排除特定文件
  - `openai (^6.16.0)`: OpenAI API 客户端，用于调用 OpenAI 服务（如模型调用、API 交互）

## 项目结构

```text
分析项目生成Markdown/
├── .env.example
├── .gitignore
├── config.js
├── index.js
├── package.json
├── prompts/
│   ├── en.js
│   └── zh.js
├── utils/
│   ├── ai.js
│   ├── file.js
│   └── logger.js
└── writer.js

```

## 注意事项

⚠️ 使用 Zhipu AI 服务时，必须在项目根目录的 `.env` 文件中设置 `ZHIPU_API_KEY`，否则程序无法启动并报错。
⚠️ AI 服务提供商（`AI_PROVIDER`）必须配置为 `"zhipu"` 或 `"ollama"`，否则程序会终止并提示错误。
⚠️ 目标项目路径需包含有效代码文件（非忽略模式），否则会提示“未发现有效文件”并退出。
⚠️ 代码分析限制：单文件最大行数为 100 行，最多分析 5 个文件。
⚠️ 翻译功能需先通过 `generate` 命令生成中文 README.md，否则翻译命令会报错。
⚠️ 如果要增加章节 请对应在 zh.js 里添加可用的提示词

## 功能列表

1.0 版本新增功能：

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

## 我的支付宝

<img src="readme-resources/image/alipay.jpg" width="200" alt="支付宝二维码" />
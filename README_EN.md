<h1 align="center">ai2readme</h1>

<p align="center">AI-powered documentation generation, one-click 🚀</p>


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
  <a href="README.md">中文</a> &#xa0; | &#xa0; 
  <span>English</span>
</p>

## Project Introduction

This project aims to help integrate project content and automatically generate Markdown documentation.

## Installation

### Environment Requirements
*   Node.js (v16+)

### Install Dependencies
```bash
npm install
```

### Configure Environment Variables
Create a `.env` file in the project root directory and set the following variables:

*   `AI_PROVIDER`: AI service provider, supports `zhipu` (Zhipu) or `ollama` (local)
*   `ZHIPU_API_KEY`: Zhipu AI API key (required when using Zhipu)
*   `ZHIPU_BASE_URL`: Zhipu API base URL
*   `ZHIPU_MODEL`: Model name used by Zhipu
*   `OLLAMA_BASE_URL`: Ollama API base URL
*   `OLLAMA_MODEL`: Model name used by Ollama
*   `GENERATE_ENGLISH`: Whether to generate an English version (optional, default is true)

### Basic Commands
```bash
# Generate README documentation
ai2readme generate 

# Translate README to English
ai2readme translate 

# Polish README
ai2readme refine 
```

## Usage Guide

### Preparation Before Running
Ensure dependencies are installed and environment variables are configured following the (#安装方法) section.

### Advanced Usage

```bash
# Specify the main entry file for analysis
ai2readme generate ./my-project src/index.js

# Specify a custom configuration file
ai2readme generate ./my-project --config ./config.js
```

### Running Examples

```bash
$ ai2readme generate ./demo-project

🔍 Analyzing project: /path/to/demo-project
📁 Ignore patterns: node_modules/*, .git/, dist/, .env, 
📦 Model: glm-4.6v-flash
📚 Collecting key code snippets (max 5 files)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ README generated successfully, saved to .ai2readme/demo-project/README.md
```

```bash
$ ai2readme translate ./demo-project

🔍 Analyzing project: /path/to/demo-project
📚 Collecting key code snippets (max 5 files)
✅ English translation generated successfully: .ai2readme/demo-project/README_EN.md
```

## How It Works

1.  **GitHub Information Retrieval**: Primarily obtained via `git remote -v`, requires `origin` to be configured and the repository to be open source.
2.  **Module Analysis**: Modules are analyzed by AI using different prompts; custom prompt replacement is supported.
3.  **Configuration and Main File**: By default, reads the `main`/`name` fields from `package.json`; supports `--config` mode to specify a configuration file.
4.  **Model Support**: Developed based on the GLM-4.6v-flash model. If you need to switch models (e.g., Ollama), please test it yourself.

## Features

| Features | Description |
| :--- | :--- |
| Multi-language Support | Supports multiple programming languages such as JavaScript, TypeScript, Python, Go, Rust, Java, Vue, etc. |
| AI-driven | Integrates Zhipu AI and Ollama local models to automatically generate and polish documentation |
| Structured Output | Automatically generates a README with standard sections including Project Name, Introduction, Installation, Usage, Tech Stack, etc. |
| Bilingual Support | Supports one-click generation of an English version README translation |
| Smart Polishing | Provides intelligent deduplication and format repair functions to optimize documentation quality |
| Flexible Configuration | Supports custom ignore directories, code extensions, and maximum number of files to analyze |

## Tech Stack

**Core Dependencies**

This project relies on the following core libraries to function:

| Package | Version | Purpose |
| :--- | :--- | :--- |
| `openai` | ^6.16.0 | Handles API interaction with OpenAI, calling large language models |
| `dotenv` | ^17.2.3 | Loads environment variables from `.env` file, configures sensitive information |
| `fs-extra` | ^11.3.3 | Extends Node.js native file system module, providing more convenient file read/write operations |
| `ignore` | ^7.0.5 | Filters files and directories based on rules, supports `.gitignore` syntax |

## Project Structure

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

## Notes

⚠️ **Environment Configuration and Dependencies**

*   You must create a `.env` file and configure environment variables within it.
*   If using the default Zhipu AI backend, `ZHIPU_API_KEY` must be set; otherwise, the program will exit with an error.
*   The `AI_PROVIDER` environment variable must be set to `"zhipu"` or `"ollama"`; otherwise, it cannot start.
*   You need to install `openai` and `dotenv` libraries as runtime dependencies.

⚠️ **Command Execution Order**

*   The `translate` (Translation) and `refine` (Polishing) commands depend on the `generate` (Generation) command running first.
*   If `README.md` is not generated in the target directory, these two commands will error out with a prompt saying "Please run the generate command first."

⚠️ **Code Analysis Scope Limitations**

*   The analysis process is limited to a maximum of 5 files.
*   The code line limit for a single file is 100 lines.
*   The following files and directories will be automatically ignored: `node_modules`, `.git`, `dist`, `build`, `.idea`, `.vscode`, `__pycache__`, `.env`, `*.log`, `coverage`, `log/`.

⚠️ **Supported Code Extensions**

*   Only supports analyzing files with the following extensions: `.js`, `.ts`, `.jsx`, `.tsx`, `.vue`, `.py`, `.go`, `.rs`, `.java`

## Changelog

### v1.0 New Features

✅ Automatic project structure analysis

✅ Code snippet extraction (supports limiting file count and single-file lines / supports confirmation to get code)

✅ Automatic README generation

✅ README translation feature

✅ Global command interaction

✅ Local Ollama model support

✅ Zhipu AI cloud support

✅ Whether to automatically fetch `.gitignore` file for automatic filtering

✅ Specifying the output folder for generation

✅ Section configuration

✅ GitHub repository detection

### v1.1 Optimized Features

✅ Added polishing functionality

## Future Roadmap

1.  Add to npm package management for easy global installation and add custom configuration control management
2.  Add the ability to integrate and regenerate READMEs after simple editing (AI parses key points, regenerates, preserves key points, reorganizes text including regenerating the structure tree)
3.  Add changelog generation
4.  AI rule-based commit method
5.  Regenerate structure tree separately
6.  Support for more document types (integration and translation of swagger-ui documentation, automatic writing of frontend component library documentation, etc.)

## Support the Author

If you find my project helpful, please give it a star! If it's been a huge help, you can buy me a coffee ☕, thanks!

<img src="readme-resources/image/alipay.jpg" width="200" alt="支付宝二维码" />
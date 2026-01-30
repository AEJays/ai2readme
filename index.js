#!/usr/bin/env node
// index.js
import fs from 'fs-extra';
import path from 'path';
import { CONFIG } from './config.js';
import { getProjectStructure, getCodeContext } from './utils/file.js';
import { generateReadme, translateToEnglish, refineReadme } from './writer.js';
import { logError } from './utils/logger.js';
const
/** 
* @author AEdge
* @description 显示帮助信息
* @returns void
* */
showHelp = () => {
  console.log(`
Usage: ai2readme <command> [arguments] [options]

Commands:
  generate              生成项目 README 文档 (默认命令)
  translate             翻译已生成的 README 为英文
  refine                智能润色与去重 README (保留 Header 结构)
  help, --help, -h      显示帮助信息

Arguments:
  [targetDir]           目标项目路径 (默认: 当前目录)
  [mainFile]            项目主入口文件名 (可选，用于分析核心逻辑)

Options:
  --config <file>       指定配置文件路径

Examples:

  # 指定目录和主文件生成 README
  ai2readme generate ./my-project src/index.js

  # 指定目录和主文件生成 README 并指定配置文件
  ai2readme generate ./my-project src/index.js --config ./config.js

  # 翻译 README
  ai2readme translate ./my-project

  # 润色 README - 更改后进行润色
  ai2readme refine ./my-project

  # 显示帮助
  ai2readme help
  ai2readme --help
  `);
};
const rawArgs = process.argv.slice(2);
let command = '';
let targetDir = process.cwd();
let mainFile = null;
let configFile = null;
if (rawArgs.includes('--help') || rawArgs.includes('-h')) {
  showHelp();
  process.exit(0);
}
if (rawArgs.length > 0 && ['generate', 'translate', 'help', 'refine'].includes(rawArgs[0])) {
  command = rawArgs[0];
  rawArgs.shift();
}
const positionalArgs = [];
for (let i = 0; i < rawArgs.length; i++) {
  const arg = rawArgs[i];
  if (arg === '--config') {
    if (i + 1 < rawArgs.length) {
      configFile = rawArgs[i + 1];
      i++;
    }
  } else if (!arg.startsWith('-')) {
    positionalArgs.push(arg);
  }
}
if (positionalArgs.length > 0) {
  targetDir = positionalArgs[0];
}
if (positionalArgs.length > 1) {
  mainFile = positionalArgs[1];
}
CONFIG.projectRoot = path.resolve(targetDir);
/** 
* @author AEdge
* @description 主程序入口，解析命令行参数并执行相应操作
* @returns void
* */
async function main() {
  if (command === 'help') {
    showHelp();
    return;
  }
  console.log(`🔍 正在分析项目: ${CONFIG.projectRoot}`);
  console.log(`📁 忽略模式: ${CONFIG.ignorePatterns.join(', ')}`);
  if (configFile) {
    console.log(`⚙️  指定配置文件: ${configFile}`);
  }
  const structure = getProjectStructure(CONFIG.projectRoot);
  if (!structure.trim() && command !== 'refine') {
    // 只有非 refine 命令才警告空文件
    console.log('⚠️ 未发现有效文件，请检查路径或 ignorePatterns 配置。');
    return;
  }
  
  console.log(`\n📚 正在收集关键代码片段（最多 ${CONFIG.maxCodeFiles} 个文件）...`);
  const codeContext = await getCodeContext(mainFile, configFile);
  switch (command) {
    case 'generate':
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      await generateReadme(structure, codeContext);
      break;
    case 'translate':
      await translateReadme(false);
      break;
    case 'refine':
      await refineReadmeCommand();
      break;
    default:
      console.log('❌ 未知命令。请使用 --help 查看帮助。');
      process.exit(1);
  }
}
/** 
* @author AEdge
* @description 翻译README文件为英文
* @returns void
* */
async function translateReadme(useOutputFolder = true) {
  const executionDir = process.cwd();
  const projectName = path.basename(CONFIG.projectRoot);
  let outputDir
  if (useOutputFolder) {
    outputDir = path.join(executionDir, CONFIG.outputFolderName, projectName);
  }else{
    outputDir = executionDir
  }
  const zhPath = path.join(outputDir, 'README.md');
  if (!fs.existsSync(zhPath)) {
    console.error('❌ 未找到中文 README.md，请先运行 generate 命令生成。');
    console.error(`   期望路径: ${zhPath}`);
    return;
  }
  const zhContent = await fs.readFile(zhPath, 'utf8');
  const enContent = await translateToEnglish(zhContent, CONFIG.projectRoot);
  const enPath = path.join(outputDir, 'README_EN.md');
  await fs.writeFile(enPath, enContent, 'utf8');
  console.log(`✅ 成功生成英文翻译: ${enPath}`);
}
/** 
* @author AEdge
* @description 润色README文件（去重、修复代码块等）
* @returns void
* */
async function refineReadmeCommand(useOutputFolder = false) {
  const executionDir = process.cwd();
  const projectName = path.basename(CONFIG.projectRoot);
  // 默认读取输出文件夹里的 README
  let outputDir
  if (useOutputFolder) {
    outputDir = path.join(executionDir, CONFIG.outputFolderName, projectName);
  }else{
    outputDir = executionDir
  }
  const zhPath = path.join(outputDir, 'README.md');
  
  if (!fs.existsSync(zhPath)) {
    console.error('❌ 未找到中文 README.md，请先运行 generate 命令生成。');
    console.error(`   期望路径: ${zhPath}`);
    return;
  }
  // 备份原始文件（方便用户替换）
  fs.copyFileSync(zhPath, zhPath + '.bak');
  // 调用 writer.js 中的润色函数
  await refineReadme(zhPath);
}
main().catch(async error => {
  console.error('💥 主程序发生未处理错误:', error);
  await logError(error, '主程序错误');
  process.exit(1);
});
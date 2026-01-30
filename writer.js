import fs from 'fs-extra';
import path from 'path';
import { CONFIG } from './config.js';
import { callAI } from './utils/ai.js';
import { getProjectMetadata, getDependenciesContent, getGitRemoteInfo, generateGitHubBadges, generateLanguageLinks, generateLanguageLinksForEn } from './utils/file.js';
import { logProjectAnalysis, logReadmeGeneration, logError } from './utils/logger.js';
import { getTranslateReadmePrompt, getTranslateTaglinePrompt, TRANSLATE_README_SYSTEM, TRANSLATE_TAGLINE_SYSTEM } from './prompts/en.js';
/** 
* @author AEdge
* @description 清理项目结构，移除.git/和node_modules相关行
* @param {any} structure - 原始项目结构字符串
* @returns string
* */
function cleanStructure(structure) {
  if (!structure) return '';
  return structure.split('\n').filter(line => !line.includes('.git/') && !line.includes('node_modules')).join('\n');
}
/** 
* @author AEdge
* @description 移除敏感信息（当前实现是直接返回文本，可能后续有处理）
* @param {any} text - 待处理文本
* @returns string
* */
function redactSensitiveInfo(text) {
  return text;
}
/** 
* @author AEdge
* @description 根据章节键获取中文提示词
* @param {any} sectionKey - 章节键
* @param {any} structure - 项目结构
* @param {any} codeContext - 代码上下文
* @returns Promise<string>
* */
async function getZhSectionPrompt(sectionKey, structure, codeContext) {
  const {
    getSectionPrompt
  } = await import('./prompts/zh.js');
  return getSectionPrompt(sectionKey, structure, codeContext);
}
/** 
* @author AEdge
* @description 清理AI生成的内容，移除Markdown代码块包裹
* @param {any} content - AI生成的内容
* @param {any} key - 章节键
* @returns string
* */
function cleanAIContent(content, key) {
  if (!content) return '';
  let cleaned = content.trim();
  if (cleaned.startsWith('```')) {
    const firstEnd = cleaned.indexOf('\n');
    if (firstEnd !== -1) {
      cleaned = cleaned.substring(firstEnd + 1);
    }
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  const codeBlockMatches = cleaned.match(/^```[a-z]*$/gm);
  if (codeBlockMatches && codeBlockMatches.length % 2 !== 0) {
    console.log(`  🔧 检测到未闭合的代码块，自动补全...`);
    cleaned += '\n```';
  }
  return cleaned.trim();
}
/** 
* @author AEdge
* @description 从内容中移除GitHub徽章和语言切换链接
* @param {any} content - 待清理的文本内容
* @returns string
* */
function removeBadgesAndLanguageLinks(content) {
  let cleaned = content.replace(/<p align="center">\s*[\s\S]*?src="https:\/\/img\.shields\.io[\s\S]*?<\/p>/g, '');
  cleaned = cleaned.replace(/<p align="center">\s*[\s\S]*?中文[\s\S]*?English[\s\S]*?<\/p>\s*/gi, '');
  cleaned = cleaned.replace(/<p align="center">\s*[\s\S]*?English[\s\S]*?中文[\s\S]*?<\/p>\s*/gi, '');
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();
  return cleaned;
}
/** 
* @author AEdge
* @description 将中文README翻译为英文
* @param {any} zhContent - 中文内容
* @param {any} projectRoot - 项目根目录路径
* @returns Promise<string>
* */
export async function translateToEnglish(zhContent, projectRoot) {
  console.log('🌍 正在将中文 README 翻译为英文...');
  const gitInfo = getGitRemoteInfo(projectRoot);
  const enHeaderContent = generateGitHubBadges(gitInfo) + generateLanguageLinksForEn('README.md', 'README_EN.md');
  const h1Match = zhContent.match(/<h1 align="center">.+?<\/h1>/);
  let zhTagline = null;
  if (h1Match) {
    const afterH1 = zhContent.substring(zhContent.indexOf(h1Match[0]) + h1Match[0].length);
    const taglineMatch = afterH1.match(/^[\s\n]*?<p align="center">(.+?)<\/p>/);
    if (taglineMatch) {
      zhTagline = taglineMatch[1];
      console.log(`  📌 提取到中文 Tagline: ${zhTagline}`);
    }
  }
  let zhContentForTranslation = removeBadgesAndLanguageLinks(zhContent);
  if (h1Match) {
    const insertPosition = zhContentForTranslation.indexOf(h1Match[0]) + h1Match[0].length;
    const afterH1 = zhContentForTranslation.substring(insertPosition);
    const taglineMatch = afterH1.match(/^[\s\n]*?<p align="center">.+?<\/p>/);
    if (taglineMatch) {
      const insertAfterTagline = insertPosition + taglineMatch[0].length;
      zhContentForTranslation = zhContentForTranslation.slice(0, insertPosition) + zhContentForTranslation.slice(insertAfterTagline);
    }
  }
  const translatePrompt = getTranslateReadmePrompt(zhContentForTranslation);
  const enContent = await callAI(translatePrompt, TRANSLATE_README_SYSTEM);
  let cleanedEnContent = enContent.trim();
  if (cleanedEnContent.startsWith('```markdown')) {
    const firstEnd = cleanedEnContent.indexOf('\n');
    if (firstEnd !== -1) {
      cleanedEnContent = cleanedEnContent.substring(firstEnd + 1);
    }
  } else if (cleanedEnContent.startsWith('```')) {
    const firstEnd = cleanedEnContent.indexOf('\n');
    if (firstEnd !== -1) {
      cleanedEnContent = cleanedEnContent.substring(firstEnd + 1);
    }
  }
  if (cleanedEnContent.endsWith('```')) {
    cleanedEnContent = cleanedEnContent.substring(0, cleanedEnContent.length - 3);
  }
  cleanedEnContent = cleanedEnContent.replace(/\.\.\.+/g, '').replace(/\[.*?\]/g, '').replace(/\n{3,}/g, '\n\n').trim();
  let enTagline = '';
  if (zhTagline) {
    const taglinePrompt = getTranslateTaglinePrompt(zhTagline);
    enTagline = await callAI(taglinePrompt, TRANSLATE_TAGLINE_SYSTEM);
    console.log(`  📌 翻译后的英文 Tagline: ${enTagline}`);
  }
  const h1MatchEn = cleanedEnContent.match(/<h1 align="center">.+?<\/h1>/);
  if (h1MatchEn) {
    const insertPosition = cleanedEnContent.indexOf(h1MatchEn[0]) + h1MatchEn[0].length;
    const afterH1 = cleanedEnContent.substring(insertPosition);
    const taglineMatch = afterH1.match(/^[\s\n]*?<p align="center">.*?<\/p>/);
    if (taglineMatch) {
      const insertAfterTagline = insertPosition + taglineMatch[0].length;
      cleanedEnContent = cleanedEnContent.slice(0, insertPosition) + `\n\n<p align="center">${enTagline}</p>\n\n` + enHeaderContent + cleanedEnContent.slice(insertAfterTagline);
      console.log('  📌 替换 Tagline 并插入 Badges 和语言链接');
    } else {
      cleanedEnContent = cleanedEnContent.slice(0, insertPosition) + `\n\n<p align="center">${enTagline}</p>\n\n` + enHeaderContent + cleanedEnContent.slice(insertPosition);
      console.log('  📌 插入 Tagline、Badges 和语言链接');
    }
  }
  return cleanedEnContent;
}
/** 
* @author AEdge
* @description 生成项目README文件，支持中文和英文
* @param {any} structure - 项目结构
* @param {any} codeContext - 代码上下文
* @returns Promise<void>
* */
export async function generateReadme(structure, codeContext) {
  const projectRoot = CONFIG.projectRoot;
  const executionDir = process.cwd();
  const meta = getProjectMetadata(projectRoot);
  const projectName = meta.name || path.basename(projectRoot);
  const rawDependencies = getDependenciesContent(projectRoot);
  if (rawDependencies) {
    console.log('✅ 已读取项目依赖信息');
  }
  const gitInfo = getGitRemoteInfo(projectRoot);
  structure = cleanStructure(structure);
  const outputDir = path.join(executionDir, CONFIG.outputFolderName, projectName);
  await fs.ensureDir(outputDir);
  console.log(`📂 输出目录: ${outputDir}`);
  console.log('📝 正在生成中文 README.md...');
  console.log('📦 项目名称: ' + projectName);
  if (meta.description) console.log('📝 项目简介: ' + meta.description);
  console.log('📄 代码上下文长度: ' + codeContext.length + ' 字符');
  console.log('🌳 项目结构长度: ' + structure.length + ' 字符');
  const mainFileMatch = codeContext.match(/主入口:\s*(.+?)\n/);
  if (mainFileMatch) {
    console.log('📌 主入口文件: ' + mainFileMatch[1]);
  }
  const headerContent = generateGitHubBadges(gitInfo) + generateLanguageLinks('README.md', 'README_EN.md');
  await logProjectAnalysis(structure, codeContext, rawDependencies);
  let zhContent = '';
  for (const section of CONFIG.readmeSections) {
    console.log('  → 生成章节: ' + section.title);
    if (section.key === 'name') {
      const {
        getSectionPrompt
      } = await import('./prompts/zh.js');
      const prompt = getSectionPrompt('name', structure, codeContext, '', meta);
      const tagline = await callAI(prompt, (await import('./prompts/zh.js')).SYSTEM_PROMPT);
      zhContent += `<h1 align="center">${projectName}</h1>\n\n`;
      zhContent += `<p align="center">${tagline.trim()}</p>\n\n`;
      zhContent += headerContent + '\n\n';
    } else if (section.key === 'intro') {
      if (meta.description) {
        zhContent += '## ' + section.title + '\n\n' + meta.description + '\n\n';
      } else {
        const prompt = await getZhSectionPrompt(section.key, structure, codeContext);
        const rawContent = await callAI(prompt, (await import('./prompts/zh.js')).SYSTEM_PROMPT);
        const content = cleanAIContent(rawContent, section.key);
        zhContent += '## ' + section.title + '\n\n' + content + '\n\n';
      }
    } else if (section.key === 'structure') {
      zhContent += '## ' + section.title + '\n\n```text\n' + structure + '\n```\n\n';
    } else if (section.key === 'dependencies') {
      const {
        getSectionPrompt
      } = await import('./prompts/zh.js');
      const prompt = getSectionPrompt('dependencies', structure, codeContext, rawDependencies);
      const rawContent = await callAI(prompt, (await import('./prompts/zh.js')).SYSTEM_PROMPT);
      const content = cleanAIContent(rawContent, section.key);
      if (content) {
        zhContent += '## ' + section.title + '\n\n' + content + '\n\n';
      } else {
        console.warn('  ⚠️ 章节 "' + section.title + '" 生成内容为空，跳过');
      }
    } else {
      const prompt = await getZhSectionPrompt(section.key, structure, codeContext);
      const rawContent = await callAI(prompt, (await import('./prompts/zh.js')).SYSTEM_PROMPT);
      const content = cleanAIContent(rawContent, section.key);
      if (content) {
        zhContent += '## ' + section.title + '\n\n' + content + '\n\n';
      } else {
        console.warn('  ⚠️ 章节 "' + section.title + '" 生成内容为空，跳过');
      }
    }
  }
  zhContent = zhContent.trim();
  const zhPath = path.join(outputDir, 'README.md');
  await fs.writeFile(zhPath, zhContent, 'utf8');
  console.log(`✅ 成功生成: ${zhPath}`);
  console.log('📊 生成内容长度: ' + zhContent.length + ' 字符');
  await logReadmeGeneration(zhContent, '中文', zhContent.length);
  // 重新润色
  await refineReadme(zhPath);
  console.log("✅ 重新润色完成")
  // 重新读取一下内容
  if (CONFIG.generateEnglish) {
    try {
      // 获取润色后的内容给到英文翻译
      let finalzhContent = await fs.readFile(zhPath, 'utf8');
      const enContent = await translateToEnglish(finalzhContent, projectRoot);
      const enPath = path.join(outputDir, 'README_EN.md');
      await fs.writeFile(enPath, enContent, 'utf8');
      console.log(`✅ 成功生成英文翻译: ${enPath}`);
      await logReadmeGeneration(enContent, '英文', enContent.length);
    } catch (error) {
      console.error('💥 翻译失败:', error);
      await logError(error, '翻译 README 为英文');
    }
  }
}

/** 
* @author AEdge
* @description 读取已生成的 README，进行 AI 润色去重（保持子标题结构不变）
* @param {string} readmePath - README 文件路径
* @returns Promise<void>
*/
export async function refineReadme(readmePath) {
  console.log('🔧 正在读取并优化 README 内容（去重与润色）...');
  
  try {
    // 1. 读取文件
    const content = await fs.readFile(readmePath, 'utf8');
    
    // 2. 动态导入 Prompt 函数
    const { getRefineReadmePrompt } = await import('./prompts/zh.js');
    const { SYSTEM_PROMPT } = await import('./prompts/zh.js');
    
    // 3. 构建 Prompt 并调用 AI
    const prompt = getRefineReadmePrompt(content);
    
    // 4. 获取优化后的内容
    let refinedContent = await callAI(prompt, SYSTEM_PROMPT);
    
    // 简单清理：如果 AI 把结果包在 \`\`\`markdown 里，去掉外壳
    refinedContent = refinedContent.trim();
    if (refinedContent.startsWith('```markdown')) {
      refinedContent = refinedContent.replace(/^```markdown\n/, '').replace(/\n```$/, '');
    } else if (refinedContent.startsWith('```')) {
      refinedContent = refinedContent.replace(/^```\n/, '').replace(/\n```$/, '');
    }
    
    // === 【新增】5. 强制检查并补全代码块 ===
    refinedContent = ensureCodeBlocksClosed(refinedContent);
    // ========================================
    
    // 6. 写回文件
    await fs.writeFile(readmePath, refinedContent, 'utf8');
    console.log('✅ README 优化完成，已更新文件');
    
  } catch (error) {
    console.error('💥 README 优化失败:', error);
  }
}
/**
 * @author AEdge
 * @description 强制检查并补全未闭合的 Markdown 代码块
 * @param {string} text - 待检查文本
 * @returns string
 */
function ensureCodeBlocksClosed(text) {
  const lines = text.split('\n');
  let inCodeBlock = false;
  
  // 遍历每一行，检查代码块开关状态
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    // 检查行是否为代码块标记 (``` 或 ```language)
    if (line.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
    }
  }
  // 如果结束时仍然处于代码块内部，说明未闭合，强制补全
  if (inCodeBlock) {
    console.log('  🔧 检测到未闭合的代码块，自动补全 ```');
    // 去除末尾可能的空白，然后加换行和闭合标记
    return text.trimEnd() + '\n```';
  }
  
  return text;
}
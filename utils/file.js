import fs from 'fs-extra';
import path from 'path';
import { CONFIG } from '../config.js';
import { execSync } from 'child_process';
import { logInfo } from './logger.js';
/** 
* @author AEdge
* @description 获取项目元数据（名称、简介）
* @param {string} dir - 项目根目录路径
* @returns Object
* */
export function getProjectMetadata(dir) {
  const meta = {
    name: null,
    description: null
  };
  const pkgPath = path.join(dir, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = fs.readJsonSync(pkgPath);
      meta.name = pkg.name;
      meta.description = pkg.description;
    } catch (e) {
      console.warn('读取 package.json 失败', e);
    }
  }
  const tomlPath = path.join(dir, 'pyproject.toml');
  if (!meta.name && fs.existsSync(tomlPath)) {
    try {
      const content = fs.readFileSync(tomlPath, 'utf8');
      const nameMatch = content.match(/name\s*=\s*["']([^"']+)["']/);
      const descMatch = content.match(/description\s*=\s*["']([^"']+)["']/);
      if (nameMatch) meta.name = nameMatch[1];
      if (descMatch) meta.description = descMatch[1];
    } catch (e) {
      console.warn('读取 pyproject.toml 失败', e);
    }
  }
  if (!meta.name) {
    meta.name = path.basename(dir);
  }
  return meta;
}
/** 
* @author AEdge
* @description 读取并解析 .gitignore 文件
* @param {string} projectRoot - 项目根目录路径
* @returns Array
* */
function parseGitignore(projectRoot) {
  const gitignorePath = path.join(projectRoot, '.gitignore');
  if (!fs.existsSync(gitignorePath)) {
    return [];
  }
  try {
    const content = fs.readFileSync(gitignorePath, 'utf-8');
    return content.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('#'));
  } catch (e) {
    console.warn('⚠️ 读取 .gitignore 失败:', e.message);
    return [];
  }
}
/** 
* @author AEdge
* @description 检查单个规则是否匹配文件/目录
* @param {string} rule - .gitignore 规则
* @param {string} name - 文件或目录名称
* @param {boolean} isDirectory - 是否为目录
* @returns boolean
* */
function ruleMatches(rule, name, isDirectory) {
  if (rule.endsWith('/')) {
    const dirName = rule.slice(0, -1);
    if (isDirectory && name === dirName) return true;
    if (name.startsWith(dirName + '/')) return true;
    return false;
  }
  if (rule.includes('*')) {
    const regexPattern = '^' + rule.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$';
    const regex = new RegExp(regexPattern, 'i');
    return regex.test(name);
  }
  if (!rule.includes('/')) {
    const baseName = name.split('/').pop();
    return baseName === rule;
  }
  return name === rule || name.startsWith(rule + '/');
}
/** 
* @author AEdge
* @description 检查文件/目录是否应该被忽略
* @param {string} name - 文件/目录名称或相对路径
* @param {boolean} isDirectory - 是否是目录
* @param {string[]} rules - 忽略规则列表
* @returns boolean
* */
function isIgnored(name, isDirectory, rules) {
  if (!rules || rules.length === 0) return false;
  const normalizedPath = name.split(path.sep).join('/');
  let ignored = false;
  for (const rule of rules) {
    if (!rule) continue;
    if (rule.startsWith('!')) {
      const negationRule = rule.substring(1).trim();
      if (ruleMatches(negationRule, normalizedPath, isDirectory)) {
        ignored = false;
      }
    } else {
      if (ruleMatches(rule, normalizedPath, isDirectory)) {
        ignored = true;
      }
    }
  }
  return ignored;
}
/** 
* @author AEdge
* @description 检查文件是否应该被忽略
* @param {string} filePath - 文件路径
* @returns boolean
* */
export function shouldIgnore(filePath) {
  const relativePath = path.relative(CONFIG.projectRoot, filePath);
  const normalizedPath = relativePath.split(path.sep).join('/');
  return CONFIG.ignorePatterns.some(pattern => {
    const normalizedPattern = pattern.replace(/\\/g, '/');
    if (normalizedPattern.includes('*')) {
      const filename = path.basename(filePath);
      const regexStr = normalizedPattern.replace(/\./g, '\\.').replace(/\*/g, '.*');
      const regex = new RegExp(`^${regexStr}$`);
      return regex.test(filename);
    }
    if (normalizedPattern.includes('/*')) {
      const parts = normalizedPattern.split('/*');
      const dirPart = parts[0];
      return normalizedPath.startsWith(dirPart + '/') && normalizedPath !== dirPart;
    }
    return normalizedPath === normalizedPattern || normalizedPath.startsWith(normalizedPattern + '/');
  });
}
/** 
* @author AEdge
* @description 递归获取所有文件 (已支持 .gitignore)
* @param {string} dir - 当前目录
* @param {string[]} fileList - 累计文件列表
* @param {string[] | null} rules - 忽略规则列表
* @returns string[]
* */
export function getAllFiles(dir, fileList = [], rules = null) {
  if (fileList.length === 0 && rules === null) {
    const gitignoreRules = parseGitignore(dir);
    rules = [...new Set([...CONFIG.ignorePatterns, ...gitignoreRules])];
  }
  try {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      const relativePath = path.relative(CONFIG.projectRoot, fullPath);
      const normalizedPath = relativePath.split(path.sep).join('/');
      const isDirectory = stat.isDirectory();
      if (isIgnored(normalizedPath, isDirectory, rules)) {
        continue;
      }
      if (isDirectory) {
        getAllFiles(fullPath, fileList, rules);
      } else {
        logInfo(fullPath + "未被过滤");
        fileList.push(fullPath);
      }
    }
  } catch (err) {
    console.warn(`无法读取目录: ${dir}`);
  }
  return fileList;
}
/** 
* @author AEdge
* @description 生成项目结构 (支持 .gitignore)
* @param {string} dir - 项目根目录路径
* @param {string} prefix - 前缀字符串
* @param {string[]} ignoreRules - 忽略规则列表
* @returns string
* */
export function getProjectStructure(dir, prefix = '', ignoreRules = []) {
  if (ignoreRules.length === 0) {
    const gitignoreRules = parseGitignore(dir);
    const configRules = CONFIG.ignorePatterns || [];
    ignoreRules = [...new Set([...configRules, ...gitignoreRules])];
  }
  let tree = '';
  if (prefix === '') {
    tree += `${path.basename(dir)}/\n`;
  }
  try {
    const files = fs.readdirSync(dir);
    const visible = files.filter(f => {
      const fullPath = path.join(dir, f);
      const stat = fs.statSync(fullPath);
      const isDir = stat.isDirectory();
      if (isIgnored(f, isDir, ignoreRules)) {
        return false;
      }
      const relativePath = path.relative(CONFIG.projectRoot, fullPath);
      const normalizedPath = relativePath.split(path.sep).join('/');
      if (isIgnored(normalizedPath, isDir, ignoreRules)) {
        return false;
      }
      if (f.includes('.gitkeep')) console.log(`🎉 .gitkeep 通过了所有检查，准备加入目录树！`);
      return true;
    }).sort();
    if (visible.length === 0 && prefix === '') {
      tree += `${prefix}└── （空目录或所有文件被忽略）\n`;
      return tree;
    }
    for (let i = 0; i < visible.length; i++) {
      const file = visible[i];
      const fullPath = path.join(dir, file);
      const isLast = i === visible.length - 1;
      const connector = isLast ? '└── ' : '├── ';
      const stat = fs.statSync(fullPath);
      tree += `${prefix}${connector}${file}${stat.isDirectory() ? '/' : ''}\n`;
      if (stat.isDirectory()) {
        const newPrefix = prefix + (isLast ? '    ' : '│   ');
        tree += getProjectStructure(fullPath, newPrefix, ignoreRules);
      }
    }
  } catch (err) {
    console.warn(`无法读取目录内容: ${dir}`);
  }
  return tree;
}
/** 
* @author AEdge
* @description 读取主入口文件内容
* @param {string} dir - 项目根目录路径
* @returns Object | null
* */
export async function getMainFileContent(dir) {
  const pkgPath = path.join(dir, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = fs.readJsonSync(pkgPath);
      const mainFile = pkg.main || 'index.js';
      const mainPath = path.join(dir, mainFile);
      if (fs.existsSync(mainPath)) {
        try {
          const content = await fs.readFile(mainPath, 'utf8');
          return {
            path: mainPath,
            content: content,
            name: path.basename(mainPath)
          };
        } catch (e) {
          console.warn(`无法读取主入口文件: ${mainPath}`);
        }
      }
    } catch (e) {
      console.warn('读取 package.json 失败', e);
    }
  }
  return null;
}
/** 
* @author AEdge
* @description 代码上下文分析
* @param {string} mainFilePath - 主入口文件路径
* @param {string} configFilePath - 配置文件路径
* @returns string
* */
export async function getCodeContext(mainFilePath = null, configFilePath = null) {
  const allFiles = getAllFiles(CONFIG.projectRoot);
  let codeFiles = allFiles.filter(f => CONFIG.codeExtensions.includes(path.extname(f)) && !f.endsWith('.d.ts'));
  if (codeFiles.length === 0) {
    return '（未发现代码文件）';
  }
  let mainFile = null;
  if (mainFilePath) {
    mainFile = codeFiles.find(f => path.basename(f) === path.basename(mainFilePath));
  } else {
    const mainInfo = await getMainFileContent(CONFIG.projectRoot);
    if (mainInfo) {
      mainFile = codeFiles.find(f => f === mainInfo.path);
    }
  }
  let mainEntryName = '未知';
  if (mainFile) {
    mainEntryName = path.basename(mainFile);
    codeFiles.unshift(mainFile);
    let uniqueFiles = [...new Set(codeFiles)];
    codeFiles = uniqueFiles;
  }
  const priorityPatterns = ['main', 'index', 'app', 'run', 'start', 'config', 'setting', 'tool', 'util', 'helper'];
  codeFiles.sort((a, b) => {
    const aBase = path.basename(a).toLowerCase();
    const bBase = path.basename(b).toLowerCase();
    let aScore = 0;
    let bScore = 0;
    priorityPatterns.forEach((p, idx) => {
      if (aBase.includes(p)) aScore = priorityPatterns.length - idx;
      if (bBase.includes(p)) bScore = priorityPatterns.length - idx;
    });
    return bScore - aScore || a.localeCompare(b);
  });
  const selectedFiles = codeFiles.slice(0, CONFIG.maxCodeFiles);
  let context = `项目代码分析（共 ${codeFiles.length} 个文件）\n`;
  if (mainEntryName === '未知' && selectedFiles.length > 0) {
    mainEntryName = path.basename(selectedFiles[0]);
  }
  const externalDeps = new Set();
  const internalModules = new Set();
  if (configFilePath) {
    let resolvedConfigPath = path.resolve(process.cwd(), configFilePath);
    if (!fs.existsSync(resolvedConfigPath)) {
      resolvedConfigPath = path.resolve(CONFIG.projectRoot, configFilePath);
    }
    if (fs.existsSync(resolvedConfigPath)) {
      try {
        const configContent = await fs.readFile(resolvedConfigPath, 'utf8');
        const relConfigPath = path.relative(CONFIG.projectRoot, resolvedConfigPath);
        context += `\n【指定配置文件】: ${relConfigPath}\n`;
        const configLines = configContent.split('\n');
        context += `   代码片段:\n   ${configLines.join('\n   ')}\n`;
      } catch (err) {
        console.warn(`⚠️ 无法读取指定配置文件: ${resolvedConfigPath}`, err.message);
        context += `\n【指定配置文件】: 读取失败\n`;
      }
    } else {
      console.warn(`⚠️ 指定的配置文件不存在: ${configFilePath}`);
      context += `\n【指定配置文件】: 文件不存在\n`;
    }
  }
  for (const file of selectedFiles) {
    try {
      const content = await fs.readFile(file, 'utf8');
      const lines = content.split('\n');
      const relPath = path.relative(CONFIG.projectRoot, file);
      const isMainEntry = mainFile && file === mainFile;
      const parseLimit = isMainEntry ? lines.length : Math.min(50, lines.length);
      let imports = [];
      let functions = [];
      let classes = [];
      for (let i = 0; i < parseLimit; i++) {
        const trimmed = lines[i].trim();
        if (trimmed.startsWith('import ') || trimmed.startsWith('from ')) {
          imports.push(trimmed);
        }
        if (trimmed.startsWith('def ') || trimmed.startsWith('function ')) {
          functions.push(trimmed);
        }
        if (trimmed.startsWith('class ')) {
          classes.push(trimmed);
        }
      }
      imports.forEach(imp => {
        const match = imp.match(/(?:import|from)\s+(\w+)/);
        if (match && !['os', 'sys', 'path', 'json', 'io', 'time', 're', 'math'].includes(match[1])) {
          externalDeps.add(match[1]);
        }
      });
      imports.forEach(imp => {
        if (imp.includes('.') || imp.includes('./')) {
          const mod = imp.match(/(\w+\.py|\w+\.js|\w+\.ts)/);
          if (mod) internalModules.add(mod[1]);
        }
      });
      const importLimit = isMainEntry ? 20 : 5;
      const funcLimit = isMainEntry ? 20 : 3;
      const fileTitle = `文件: ${relPath} (${lines.length} 行)${isMainEntry ? ' [主入口]' : ''}`;
      context += `\n${fileTitle}\n`;
      if (imports.length > 0) {
        context += `   导入: ${imports.slice(0, importLimit).join(', ')}${imports.length > importLimit ? '...' : ''}\n`;
      }
      if (functions.length > 0) {
        context += `   函数: ${functions.slice(0, funcLimit).join(', ')}${functions.length > funcLimit ? '...' : ''}\n`;
      }
      if (classes.length > 0) {
        context += `   类: ${classes.join(', ')}\n`;
      }
      let snippetLines;
      if (isMainEntry) {
        snippetLines = lines;
      } else {
        snippetLines = lines.slice(0, 20);
      }
      const validSnippetLines = snippetLines.filter(l => l.trim() && !l.trim().startsWith('#'));
      if (validSnippetLines.length > 0) {
        context += `   代码片段:\n   ${validSnippetLines.join('\n   ')}\n`;
      }
    } catch (err) {
      console.warn(`无法读取文件: ${file}`);
    }
  }
  context += `\n项目摘要:\n`;
  context += `   主入口: ${mainEntryName}\n`;
  if (externalDeps.size > 0) {
    context += `   外部依赖: ${Array.from(externalDeps).join(', ')}\n`;
  }
  if (internalModules.size > 0) {
    context += `   内部模块: ${Array.from(internalModules).join(', ')}\n`;
  }
  return context;
}
/** 
* @author AEdge
* @description 智能读取项目依赖文件
* @param {string} dir - 项目根目录路径
* @returns string | null
* */
export function getDependenciesContent(dir) {
  let result = '';
  const pkgPath = path.join(dir, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = fs.readJsonSync(pkgPath);
      result += '### Node.js 依赖 (package.json)\n\n';
      const deps = {
        ...pkg.dependencies,
        ...pkg.devDependencies
      };
      if (Object.keys(deps).length > 0) {
        for (const [name, version] of Object.entries(deps)) {
          result += `- ${name}:${version}\n`;
        }
      } else {
        result += '（无依赖）\n';
      }
      return result;
    } catch (e) {
      console.warn('读取 package.json 失败', e);
    }
  }
  const reqPath = path.join(dir, 'requirements.txt');
  if (fs.existsSync(reqPath)) {
    try {
      const txt = fs.readFileSync(reqPath, 'utf8');
      const lines = txt.split('\n').filter(l => l.trim() && !l.trim().startsWith('#'));
      result += '### Python 依赖\n\n';
      if (lines.length > 0) {
        lines.forEach(line => {
          result += `- ${line.trim()}\n`;
        });
      } else {
        result += '（无依赖）\n';
      }
      return result;
    } catch (e) {
      console.warn('读取 requirements.txt 失败', e);
    }
  }
  const goModPath = path.join(dir, 'go.mod');
  if (fs.existsSync(goModPath)) {
    try {
      const txt = fs.readFileSync(goModPath, 'utf8');
      const reqs = txt.split('\n').filter(l => l.trim().startsWith('require'));
      result += '### Go 依赖\n\n';
      if (reqs.length > 0) {
        reqs.forEach(line => {
          const cleanLine = line.replace('require', '').trim();
          result += `- ${cleanLine}\n`;
        });
      } else {
        result += '（未找到具体依赖）\n';
      }
      return result;
    } catch (e) {
      console.warn('读取 go.mod 失败', e);
    }
  }
  const pomPath = path.join(dir, 'pom.xml');
  if (fs.existsSync(pomPath)) {
    try {
      const txt = fs.readFileSync(pomPath, 'utf8');
      const matches = txt.match(/<dependency>[\s\S]*?<\/dependency>/g) || [];
      result += '### Java 依赖\n\n';
      if (matches.length > 0) {
        matches.forEach(dep => {
          const groupIdMatch = dep.match(/<groupId>(.+?)<\/groupId>/);
          const artifactIdMatch = dep.match(/<artifactId>(.+?)<\/artifactId>/);
          if (groupIdMatch && artifactIdMatch) {
            result += `- ${groupIdMatch[1]}:${artifactIdMatch[1]}\n`;
          }
        });
      } else {
        result += '（未找到依赖）\n';
      }
      return result;
    } catch (e) {
      console.warn('读取 pom.xml 失败', e);
    }
  }
  return null;
}
/** 
* @author AEdge
* @description 读取 git remote 信息
* @param {string} targetDir - 目标项目根目录路径
* @returns Object | null
* */
export function getGitRemoteInfo(targetDir = process.cwd()) {
  try {
    const remotes = execSync('git remote -v', {
      encoding: 'utf8',
      cwd: targetDir
    });
    if (!remotes || !remotes.trim()) {
      return null;
    }
    const githubMatches = remotes.matchAll(/(\S+)\s+(https?:\/\/github\.com\/|git@github\.com:)([^/]+)\/([^\s]+?)(?:\.git)?\s/g);
    for (const match of githubMatches) {
      const [, remoteName,, owner, repo] = match;
      console.log(`✅ ${owner}/${repo} 已检测到 github 库 [https://github.com/${owner}/${repo}]`);
      return {
        owner,
        repo,
        url: `https://github.com/${owner}/${repo}`
      };
    }
    return null;
  } catch (e) {
    return null;
  }
}
/** 
* @author AEdge
* @description 生成 GitHub Badges
* @param {Object} gitInfo - GitHub 信息对象
* @returns string
* */
export function generateGitHubBadges(gitInfo) {
  if (!gitInfo) return '';
  const {
    owner,
    repo
  } = gitInfo;
  const color = '56BEB8';
  return `
<p align="center">
  <img alt="Github top language" src="https://img.shields.io/github/languages/top/${owner}/${repo}?color=${color}">
  <img alt="Github language count" src="https://img.shields.io/github/languages/count/${owner}/${repo}?color=${color}">
  <img alt="Repository size" src="https://img.shields.io/github/repo-size/${owner}/${repo}?color=${color}">
  <img alt="License" src="https://img.shields.io/github/license/${owner}/${repo}?color=${color}">
  <img alt="Github issues" src="https://img.shields.io/github/issues/${owner}/${repo}?color=${color}" />
  <img alt="Github forks" src="https://img.shields.io/github/forks/${owner}/${repo}?color=${color}" />
  <img alt="Github stars" src="https://img.shields.io/github/stars/${owner}/${repo}?color=${color}" />
</p>`;
}
/** 
* @author AEdge
* @description 生成语言链接
* @param {string} zhFilename - 中文文件名
* @param {string} enFilename - 英文文件名
* @returns string
* */
export function generateLanguageLinks(zhFilename = 'README.md', enFilename = 'README_EN.md') {
  return `
<p align="center">
  <span>中文</span> &#xa0; | &#xa0; 
  <a href="${enFilename}">English</a>
</p>`;
}
/** 
* @author AEdge
* @description 生成英文语言链接
* @param {string} zhFilename - 中文文件名
* @param {string} enFilename - 英文文件名
* @returns string
* */
export function generateLanguageLinksForEn(zhFilename = 'README.md', enFilename = 'README_EN.md') {
  return `
<p align="center">
  <a href="${zhFilename}">中文</a> &#xa0; | &#xa0; 
  <span>English</span>
</p>`;
}
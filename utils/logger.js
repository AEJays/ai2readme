import fs from 'fs-extra';
import path from 'path';
import { CONFIG } from '../config.js';
const LOG_DIR = path.join(process.cwd(), 'log');
/** 
* @author AEdge
* @description 确保日志目录存在
* @returns void
* */
async function ensureLogDir() {
  await fs.ensureDir(LOG_DIR);
}
/** 
* @author AEdge
* @description 获取当前日期的日志文件路径
* @returns string
* */
function getLogFilePath() {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  return path.join(LOG_DIR, `${dateStr}.log`);
}
/** 
* @author AEdge
* @description 写入日志
* @param {string} content - 日志内容
* @param {string} type - 日志类型 (INFO, PROMPT, RESPONSE, ERROR)
* @returns void
* */
async function writeLog(content, type = 'INFO') {
  await ensureLogDir();
  const logPath = getLogFilePath();
  const now = new Date();
  const timestamp = now.toISOString().replace('T', ' ').substring(0, 19);
  const separator = '═'.repeat(80);
  const logEntry = `\n${separator}\n[${timestamp}] [${type}]\n${separator}\n${content}\n`;
  try {
    await fs.appendFile(logPath, logEntry, 'utf8');
  } catch (error) {
    console.error('写入日志失败:', error);
  }
}
/** 
* @author AEdge
* @description 记录项目分析信息
* @param {string} structure - 项目结构
* @param {string} codeContext - 代码上下文
* @param {string} dependencies - 依赖信息
* @returns void
* */
export async function logProjectAnalysis(structure, codeContext, dependencies = null) {
  let content = `项目分析结果\n`;
  content += `\n${'─'.repeat(80)}\n`;
  content += `项目根目录: ${CONFIG.projectRoot}\n`;
  content += `分析时间: ${new Date().toLocaleString()}\n`;
  content += `\n${'─'.repeat(80)}\n`;
  content += `【项目结构】\n`;
  content += structure;
  content += `\n\n${'─'.repeat(80)}\n`;
  content += `【代码上下文】\n`;
  content += codeContext;
  if (dependencies) {
    content += `\n\n${'─'.repeat(80)}\n`;
    content += `【项目依赖】\n`;
    content += dependencies;
  }
  await writeLog(content, 'PROJECT_ANALYSIS');
}
/** 
* @author AEdge
* @description 记录 AI 交互（请求和响应）
* @param {string} prompt - 发送给 AI 的提示词
* @param {string} response - AI 的响应
* @param {string} section - 章节/操作名称
* @returns void
* */
export async function logAIInteraction(prompt, response, section = 'AI_INTERACTION') {
  let content = `【章节】${section}\n`;
  content += `\n${'─'.repeat(80)}\n`;
  content += `【发送给 AI 的提示词】\n`;
  content += prompt;
  content += `\n\n${'─'.repeat(80)}\n`;
  content += `【AI 的响应】\n`;
  content += response;
  await writeLog(content, section);
}
/** 
* @author AEdge
* @description 记录生成的 README 内容
* @param {string} content - README 内容
* @param {string} type - 类型 (中文/英文)
* @param {number} length - 内容长度
* @returns void
* */
export async function logReadmeGeneration(content, type = '中文', length = 0) {
  let logContent = `【生成的 ${type} README】\n`;
  logContent += `内容长度: ${length} 字符\n`;
  logContent += `生成时间: ${new Date().toLocaleString()}\n`;
  logContent += `\n${'─'.repeat(80)}\n`;
  logContent += content;
  await writeLog(logContent, `README_${type.toUpperCase()}`);
}
/** 
* @author AEdge
* @description 记录错误信息
* @param {Error|string} error - 错误对象或消息
* @param {string} context - 错误上下文
* @returns void
* */
export async function logError(error, context = '') {
  let content = `错误上下文: ${context}\n`;
  content += `错误信息: ${error instanceof Error ? error.message : error}\n`;
  if (error instanceof Error && error.stack) {
    content += `\n错误堆栈:\n${error.stack}\n`;
  }
  await writeLog(content, 'ERROR');
}
/** 
* @author AEdge
* @description 记录一般信息
* @param {string} message - 日志消息
* @returns void
* */
export async function logInfo(message) {
  await writeLog(message, 'INFO');
}
export default {
  logProjectAnalysis,
  logAIInteraction,
  logReadmeGeneration,
  logError,
  logInfo
};
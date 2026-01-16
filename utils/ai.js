import OpenAI from 'openai';
import { logAIInteraction, logError } from './logger.js';
/** 
* @author AEdge
* @description 统一调用AI后端（支持Zhipu/Ollama）
* @param {string} prompt - 用户提示
* @param {string} systemMessage - 系统角色提示
* @param {number} retries - 重试次数
* @returns Promise<string>
* */
export async function callAI(prompt, systemMessage = '', retries = 3) {
  const {
    CONFIG
  } = await import('../config.js');
  let client;
  let model;
  if (CONFIG.ai.provider === 'zhipu') {
    client = new OpenAI({
      apiKey: CONFIG.ai.zhipu.apiKey,
      baseURL: CONFIG.ai.zhipu.baseURL
    });
    model = CONFIG.ai.zhipu.model;
  } else if (CONFIG.ai.provider === 'ollama') {
    client = new OpenAI({
      baseURL: `${CONFIG.ai.ollama.baseURL}/v1`,
      apiKey: 'ollama'
    });
    model = CONFIG.ai.ollama.model;
  } else {
    throw new Error(`不支持的 AI 提供商: ${CONFIG.ai.provider}`);
  }
  for (let i = 0; i < retries; i++) {
    try {
      const completion = await client.chat.completions.create({
        model: model,
        messages: [{
          role: 'system',
          content: systemMessage
        }, {
          role: 'user',
          content: prompt
        }],
        temperature: 0.6,
        timeout: 120_000
      });
      await logAIInteraction(`【系统提示】\n${systemMessage}\n\n【用户提示】\n${prompt}`, completion.choices?.[0]?.message?.content?.trim() || '', 'AI_REQUEST');
      return completion.choices?.[0]?.message?.content?.trim() || '';
    } catch (error) {
      console.warn(`⚠️ AI 调用失败 (尝试 ${i + 1}/${retries}):`, error.message || error);
      await logError(error.message || error, 'AI 调用失败');
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
}
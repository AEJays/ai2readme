import dotenv from 'dotenv';
import path from 'path';
dotenv.config();
const AI_PROVIDER = process.env.AI_PROVIDER || 'zhipu';
export const CONFIG = {
  // 项目根目录路径
  projectRoot: process.argv[2] ? path.resolve(process.argv[2]) : process.cwd(),
  // 忽略的文件/目录模式列表
  ignorePatterns: ['node_modules/*', '.git/', 'dist/', 'build/', '.idea/', '.vscode/', '__pycache__', '.env', '*.log', 'coverage', 'log/'],
  // 允许分析的代码文件扩展名列表
  codeExtensions: ['.js', '.ts', '.jsx', '.tsx', '.vue', '.py', '.go', '.rs', '.java'],
  // 单文件最大代码行数
  maxCodeLines: 100,
  // 最大分析文件数
  maxCodeFiles: 5,
  // 生成的输出文件夹名称
  outputFolderName: '.ai2readme',
  // README生成章节配置数组
  readmeSections: [{
    key: 'name',
    title: '项目名称'
  }, {
    key: 'intro',
    title: '项目简介'
  }, {
    key: 'install',
    title: '安装方法'
  }, {
    key: 'usage',
    title: '如何使用'
  }, {
    key: 'features',
    title: '特性'
  }, {
    key: 'dependencies',
    title: '技术栈'
  }, {
    key: 'structure',
    title: '项目结构'
  }, {
    key: 'notes',
    title: '注意事项'
  }],
  // 是否生成英文版
  generateEnglish: process.env.GENERATE_ENGLISH || true,
  // AI后端配置对象
  ai: {
    // AI服务提供商
    provider: AI_PROVIDER,
    // 智谱AI配置对象
    zhipu: {
      // 智谱AI API密钥
      apiKey: process.env.ZHIPU_API_KEY,
      // Ollama API基础URL
      baseURL: process.env.ZHIPU_API_BASE || 'https://open.bigmodel.cn/api/paas/v4/',
      // Ollama模型名称
      model: process.env.ZHIPU_MODEL || 'glm-4.6v-flash'
    },
    // Ollama配置对象
    ollama: {
      // Ollama API基础URL
      baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
      // Ollama模型名称
      model: process.env.OLLAMA_MODEL || 'qwen2:7b'
    }
  }
};
const {
  // AI后端配置对象
  ai
} = CONFIG;
if (ai.provider === 'zhipu') {
  if (!ai.zhipu.apiKey) {
    console.error('❌ 错误: 使用 Zhipu 时请在 .env 中设置 ZHIPU_API_KEY');
    process.exit(1);
  }
} else if (ai.provider !== 'ollama') {
  console.error(`❌ AI_PROVIDER 必须是 "zhipu" 或 "ollama"，当前值: "${ai.provider}"`);
  process.exit(1);
}
console.log(`🤖 AI 后端: ${ai.provider === 'zhipu' ? '智谱云端' : 'Ollama 本地'}`);
console.log(`📦 模型: ${ai.provider === 'zhipu' ? ai.zhipu.model : ai.ollama.model}`);
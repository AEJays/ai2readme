export const TRANSLATE_README_SYSTEM = `You are a professional technical translator specializing in open-source documentation. Translate the given Chinese README into fluent, accurate English while preserving all formatting, technical meaning, and HTML tags. Do not add any explanations or placeholders. Do not include any code block markers (like \`\`\`markdown or \`\`\`) in your output.`;
export const TRANSLATE_TAGLINE_SYSTEM = `You are a professional technical writer. Translate the given Chinese tagline into concise, professional English that fits open-source project style. Keep the emoji. Do not add any explanations or prefixes. Output only the translated tagline.`;
/** 
* @author AEdge
* @description 获取翻译 README 的用户提示词
* @param {string} zhContent - 需要翻译的中文内容
* @returns string
* */
export function getTranslateReadmePrompt(zhContent) {
  return `请将以下完整的中文 README 文档**精准翻译为专业、地道的英文**，要求：
- 保留所有 Markdown 格式（标题、列表、代码块、emoji）
- **保留 HTML 标签（如 <h1 align="center">）**
- 技术术语准确（如"工具调用" → "tool calling"）
- 语气符合开源项目风格（简洁、用户友好）
- **不要翻译代码块中的内容**
- 不要添加任何解释、前缀或后缀
- **不要输出 markdown 代码块标记（如 \`\`\`markdown 或 \`\`\`），直接输出翻译后的纯 Markdown 文本**
- 输出完整的英文 README 内容

【中文 README】
\`\`\`markdown
${zhContent}
\`\`\``;
}
/** 
* @author AEdge
* @description 获取翻译 Tagline 的用户提示词
* @param {string} zhTagline - 中文 Tagline
* @returns string
* */
export function getTranslateTaglinePrompt(zhTagline) {
  return `请将以下项目简介翻译为英文，要求简洁、专业、符合开源项目风格，保持 emoji 和 正常的路径：

${zhTagline}`;
}
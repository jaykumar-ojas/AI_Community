// utils/codeBlockParser.js
// Utility functions for extracting and handling code blocks from markdown

/**
 * Extracts all code blocks from markdown text
 * @param {string} text - The markdown text to parse
 * @returns {Array} Array of code block objects with language, code, and position info
 */
export const extractCodeBlocks = (text) => {
  if (!text) return [];
  
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const blocks = [];
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    blocks.push({
      language: match[1] || 'text',
      code: match[2].trim(),
      fullMatch: match[0],
      index: match.index
    });
  }

  return blocks;
};

/**
 * Replaces code blocks with placeholders for separate rendering
 * @param {string} text - The markdown text
 * @returns {string} Text with code blocks replaced by placeholders
 */
export const replaceCodeBlocksWithPlaceholder = (text) => {
  if (!text) return '';
  
  return text.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code, offset) => {
    return `<div class="code-block-placeholder" data-language="${lang || 'text'}" data-index="${offset}"></div>`;
  });
};

/**
 * Check if a language supports code execution
 * @param {string} language - Programming language name
 * @returns {boolean}
 */
export const isExecutableLanguage = (language) => {
  const executable = [
    'python', 'py',
    'javascript', 'js',
    'java',
    'cpp', 'c++', 'c',
    'go',
    'rust', 'rs',
    'php',
    'ruby', 'rb',
    'typescript', 'ts',
    'csharp', 'cs',
    'swift',
    'kotlin',
    'scala'
  ];
  return executable.includes(language?.toLowerCase());
};

/**
 * Check if a language has web preview capabilities
 * @param {string} language - Programming language name
 * @returns {boolean}
 */
export const hasWebPreview = (language) => {
  const webLangs = ['html', 'xml', 'svg'];
  return webLangs.includes(language?.toLowerCase());
};

/**
 * Check if code block should display a preview tab
 * @param {string} language - Programming language name
 * @returns {boolean}
 */
export const shouldShowPreview = (language) => {
  return isExecutableLanguage(language) || hasWebPreview(language);
};

/**
 * Get file extension for a language
 * @param {string} language - Programming language name
 * @returns {string} File extension
 */
export const getFileExtension = (language) => {
  const extensions = {
    python: 'py',
    javascript: 'js',
    typescript: 'ts',
    java: 'java',
    cpp: 'cpp',
    c: 'c',
    go: 'go',
    rust: 'rs',
    php: 'php',
    ruby: 'rb',
    html: 'html',
    css: 'css',
    xml: 'xml',
    json: 'json',
    yaml: 'yml',
    markdown: 'md',
    bash: 'sh',
    shell: 'sh',
    sql: 'sql',
    csharp: 'cs',
    swift: 'swift',
    kotlin: 'kt',
    scala: 'scala'
  };
  
  return extensions[language?.toLowerCase()] || language?.toLowerCase() || 'txt';
};

/**
 * Parse markdown and split into text and code sections
 * @param {string} text - Markdown text
 * @returns {Array} Array of text and code sections
 */
export const parseMarkdownSections = (text) => {
  if (!text) return [];
  
  const sections = [];
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    // Add text before code block
    if (match.index > lastIndex) {
      sections.push({
        type: 'text',
        content: text.substring(lastIndex, match.index)
      });
    }

    // Add code block
    sections.push({
      type: 'code',
      language: match[1] || 'text',
      content: match[2].trim()
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    sections.push({
      type: 'text',
      content: text.substring(lastIndex)
    });
  }

  return sections;
};

/**
 * Count code blocks in text
 * @param {string} text - Text to analyze
 * @returns {number} Number of code blocks found
 */
export const countCodeBlocks = (text) => {
  if (!text) return 0;
  const matches = text.match(/```(\w+)?\n[\s\S]*?```/g);
  return matches ? matches.length : 0;
};

/**
 * Check if text contains any code blocks
 * @param {string} text - Text to check
 * @returns {boolean}
 */
export const hasCodeBlocks = (text) => {
  if (!text) return false;
  return /```(\w+)?\n[\s\S]*?```/.test(text);
};

/**
 * Extract inline code snippets (single backticks)
 * @param {string} text - Text to parse
 * @returns {Array} Array of inline code snippets
 */
export const extractInlineCode = (text) => {
  if (!text) return [];
  
  const inlineCodeRegex = /`([^`]+)`/g;
  const snippets = [];
  let match;

  while ((match = inlineCodeRegex.exec(text)) !== null) {
    snippets.push({
      code: match[1],
      index: match.index
    });
  }

  return snippets;
};
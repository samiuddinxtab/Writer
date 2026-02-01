/**
 * Simple content renderer that converts plain text with markdown-like syntax to HTML
 * Supports basic formatting for Urdu content rendering
 */

/**
 * Renders plain text content with simple markdown-like syntax to HTML
 * @param content - Plain text content with markdown-like syntax
 * @returns HTML string with proper Urdu content structure
 */
export function renderPlainText(content: string): string {
  if (!content || typeof content !== 'string') {
    return '';
  }

  // Split content into lines
  const lines = content.split('\n');
  const htmlLines: string[] = [];
  let currentList: string[] = [];
  let currentBlockquote: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (!line) {
      // Empty line - close any open structures
      if (currentList.length > 0) {
        htmlLines.push(`<ul>\n${currentList.map(item => `  <li>${escapeHtml(item)}</li>`).join('\n')}\n</ul>`);
        currentList = [];
      }
      if (currentBlockquote.length > 0) {
        htmlLines.push(`<blockquote>\n${currentBlockquote.map(item => `  <p>${escapeHtml(item)}</p>`).join('\n')}\n</blockquote>`);
        currentBlockquote = [];
      }
      continue;
    }
    
    if (line.startsWith('> ')) {
      // Blockquote - close any open list first
      if (currentList.length > 0) {
        htmlLines.push(`<ul>\n${currentList.map(item => `  <li>${escapeHtml(item)}</li>`).join('\n')}\n</ul>`);
        currentList = [];
      }
      currentBlockquote.push(line.substring(2));
    } else if (line.startsWith('- ')) {
      // List item - close any open blockquote first
      if (currentBlockquote.length > 0) {
        htmlLines.push(`<blockquote>\n${currentBlockquote.map(item => `  <p>${escapeHtml(item)}</p>`).join('\n')}\n</blockquote>`);
        currentBlockquote = [];
      }
      currentList.push(line.substring(2));
    } else if (line.startsWith('# ')) {
      // Heading - close any open structures first
      if (currentList.length > 0) {
        htmlLines.push(`<ul>\n${currentList.map(item => `  <li>${escapeHtml(item)}</li>`).join('\n')}\n</ul>`);
        currentList = [];
      }
      if (currentBlockquote.length > 0) {
        htmlLines.push(`<blockquote>\n${currentBlockquote.map(item => `  <p>${escapeHtml(item)}</p>`).join('\n')}\n</blockquote>`);
        currentBlockquote = [];
      }
      htmlLines.push(`<h2>${escapeHtml(line.substring(2))}</h2>`);
    } else {
      // Regular paragraph - close any open structures first
      if (currentList.length > 0) {
        htmlLines.push(`<ul>\n${currentList.map(item => `  <li>${escapeHtml(item)}</li>`).join('\n')}\n</ul>`);
        currentList = [];
      }
      if (currentBlockquote.length > 0) {
        htmlLines.push(`<blockquote>\n${currentBlockquote.map(item => `  <p>${escapeHtml(item)}</p>`).join('\n')}\n</blockquote>`);
        currentBlockquote = [];
      }
      htmlLines.push(`<p>${escapeHtml(line)}</p>`);
    }
  }
  
  // Close any remaining open structures
  if (currentList.length > 0) {
    htmlLines.push(`<ul>\n${currentList.map(item => `  <li>${escapeHtml(item)}</li>`).join('\n')}\n</ul>`);
  }
  if (currentBlockquote.length > 0) {
    htmlLines.push(`<blockquote>\n${currentBlockquote.map(item => `  <p>${escapeHtml(item)}</p>`).join('\n')}\n</blockquote>`);
  }
  
  return htmlLines.join('\n');
}

/**
 * Simple HTML escape function to prevent XSS
 * @param text - Text to escape
 * @returns Escaped HTML string
 */
function escapeHtml(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Sanitizes HTML content by removing potentially dangerous elements
 * @param html - HTML string to sanitize
 * @returns Sanitized HTML string
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }
  
  // Remove script tags and their content
  html = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  
  // Remove javascript: URLs
  html = html.replace(/javascript:/gi, '');
  
  // Remove on* event handlers
  html = html.replace(/\son\w+="[^"]*"/gi, '');
  html = html.replace(/\son\w+='[^']*'/gi, '');
  html = html.replace(/\son\w+=\w+/gi, '');
  
  return html;
}

/**
 * Main function that renders and sanitizes content
 * @param content - Plain text content with markdown-like syntax
 * @returns Clean, safe HTML string
 */
export function renderContent(content: string): string {
  const rendered = renderPlainText(content);
  return sanitizeHtml(rendered);
}
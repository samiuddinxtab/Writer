/**
 * Paste handler for the admin editor
 * Intercepts paste events, sanitizes content, and inserts at cursor position
 */

export interface PasteResult {
  success: boolean;
  message?: string;
  hasImages: boolean;
}

function getPlainText(clipboard: DataTransfer): string {
  const plainText = clipboard.getData('text/plain');
  if (plainText) {
    return plainText;
  }
  const html = clipboard.getData('text/html');
  if (html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    return doc.body.textContent ?? '';
  }
  return '';
}

function containsImages(clipboard: DataTransfer): boolean {
  const html = clipboard.getData('text/html');
  if (html) {
    return /<img/i.test(html);
  }
  for (let i = 0; i < clipboard.items.length; i++) {
    if (clipboard.items[i].type.startsWith('image/')) {
      return true;
    }
  }
  return false;
}

function normalizeUnicode(text: string): string {
  return text.normalize('NFKC');
}

function stripControlCharacters(text: string): string {
  return text.replace(/[\u200E\u200F\u202A-\u202E]/g, '');
}

function collapseBlankLines(text: string): string {
  return text.replace(/\n{3,}/g, '\n\n');
}

export function processPastedText(text: string): string {
  let processed = text;
  processed = normalizeUnicode(processed);
  processed = stripControlCharacters(processed);
  processed = collapseBlankLines(processed);
  return processed.trim();
}

export function insertAtCursor(textarea: HTMLTextAreaElement, text: string): void {
  const start = textarea.selectionStart ?? 0;
  const end = textarea.selectionEnd ?? 0;
  const currentValue = textarea.value;
  const before = currentValue.substring(0, start);
  const after = currentValue.substring(end);
  textarea.value = before + text + after;
  const newCursorPos = start + text.length;
  textarea.selectionStart = newCursorPos;
  textarea.selectionEnd = newCursorPos;
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
}

export function handlePaste(event: ClipboardEvent, textarea: HTMLTextAreaElement): PasteResult {
  const clipboard = event.clipboardData;
  if (!clipboard) {
    return { success: false, hasImages: false };
  }
  event.preventDefault();
  const hasImages = containsImages(clipboard);
  const plainText = getPlainText(clipboard);
  const processedText = processPastedText(plainText);
  insertAtCursor(textarea, processedText);
  return {
    success: true,
    hasImages,
    message: hasImages ? 'Images removed; text-only pasted' : undefined
  };
}

import { useMemo, useRef, useEffect } from 'react';
import { tokenize } from '@/csl';

interface Props {
  value: string;
  onChange: (v: string) => void;
  readOnly?: boolean;
  /** P4:外部要求高亮的行号(1-based);变化时自动滚动并高亮该行 */
  highlightLine?: number | null;
  /** 高亮 token(随每次跳转刷新,即便 highlightLine 没变) */
  highlightToken?: number;
}

const CLASS_BY_TYPE: Record<string, string> = {
  KEYWORD: 'text-token-keyword font-medium',
  STRING: 'text-token-string',
  NUMBER: 'text-token-number',
  OPERATOR: 'text-token-operator',
  IDENTIFIER: 'text-token-identifier',
  COMMENT: 'text-muted-foreground italic',
};

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderPlainTextWithComments(text: string) {
  if (!text) return '';
  const commentPattern = new RegExp('(//[^\\n]*)', 'g');
  const commentOnlyPattern = new RegExp('^//[^\\n]*$');
  return text
    .split(commentPattern)
    .map((part) => {
      if (!part) return '';
      if (commentOnlyPattern.test(part)) {
        return `<span class="text-muted-foreground italic">${escapeHtml(part)}</span>`;
      }
      return escapeHtml(part);
    })
    .join('');
}

export const HighlightedEditor = ({ value, onChange, readOnly = false, highlightLine, highlightToken }: Props) => {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const html = useMemo(() => {
    let tokens: ReturnType<typeof tokenize>;
    try {
      tokens = tokenize(value);
    } catch {
      return escapeHtml(value);
    }

    let out = '';
    let cursor = 0;
    const lines = value.split('\n');
    const lineOffsets: number[] = [0];
    for (let i = 0; i < lines.length - 1; i++) {
      lineOffsets.push(lineOffsets[i] + lines[i].length + 1);
    }

    for (const t of tokens) {
      if (t.type === 'EOF') break;
      const tokenStart = (lineOffsets[t.line - 1] ?? 0) + (t.col - 1);

      if (tokenStart > cursor) {
        out += renderPlainTextWithComments(value.slice(cursor, tokenStart));
        cursor = tokenStart;
      }

      let text: string;
      if (t.type === 'STRING') {
        const orig = value.slice(tokenStart, tokenStart + t.value.length + 2);
        text = orig;
        cursor = tokenStart + orig.length;
      } else {
        text = t.value;
        cursor = tokenStart + t.value.length;
      }

      const cls = CLASS_BY_TYPE[t.type] || '';
      out += cls ? `<span class="${cls}">${escapeHtml(text)}</span>` : escapeHtml(text);
    }

    if (cursor < value.length) {
      out += renderPlainTextWithComments(value.slice(cursor));
    }

    return out + '\n';
  }, [value]);

  useEffect(() => {
    const ta = taRef.current;
    const pre = preRef.current;
    const overlay = overlayRef.current;
    if (!ta || !pre) return;
    const sync = () => {
      pre.scrollTop = ta.scrollTop;
      pre.scrollLeft = ta.scrollLeft;
      if (overlay) {
        overlay.scrollTop = ta.scrollTop;
        overlay.scrollLeft = ta.scrollLeft;
      }
    };
    ta.addEventListener('scroll', sync);
    return () => ta.removeEventListener('scroll', sync);
  }, []);

  // P4:跳转高亮 — 滚动到目标行并把光标定位到该行行首
  useEffect(() => {
    const ta = taRef.current;
    if (!ta || !highlightLine || highlightLine < 1) return;
    const lines = value.split('\n');
    if (highlightLine > lines.length) return;
    let offset = 0;
    for (let i = 0; i < highlightLine - 1; i++) offset += lines[i].length + 1;
    // 选中该行(便于视觉聚焦)
    const lineEnd = offset + (lines[highlightLine - 1]?.length ?? 0);
    ta.focus();
    ta.setSelectionRange(offset, lineEnd);
    // 滚动:用近似行高 24px (leading-6 = 1.5rem)
    const approxLineHeight = 24;
    const targetTop = (highlightLine - 1) * approxLineHeight;
    ta.scrollTop = Math.max(0, targetTop - ta.clientHeight / 3);
  }, [highlightLine, highlightToken, value]);

  // 计算高亮行的覆盖层位置
  const highlightStyle = useMemo(() => {
    if (!highlightLine || highlightLine < 1) return null;
    return {
      top: `${(highlightLine - 1) * 24 + 16}px`, // p-4 = 16px
      height: '24px',
    };
  }, [highlightLine, highlightToken]);

  return (
    <div className="absolute inset-0 bg-editor-bg">
      <pre
        ref={preRef}
        aria-hidden
        className="absolute inset-0 m-0 p-4 font-mono text-sm leading-6 whitespace-pre-wrap break-words overflow-auto pointer-events-none text-editor-fg"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {/* P4:行高亮覆盖层 */}
      {highlightStyle && (
        <div
          ref={overlayRef}
          aria-hidden
          className="absolute inset-x-0 pointer-events-none overflow-hidden"
          style={{ top: 0, bottom: 0 }}
        >
          <div
            className="absolute left-0 right-0 bg-primary/15 border-l-2 border-primary animate-pulse"
            style={highlightStyle}
          />
        </div>
      )}
      <textarea
        ref={taRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        readOnly={readOnly}
        className={`absolute inset-0 w-full h-full p-4 font-mono text-sm leading-6 resize-none bg-transparent text-transparent caret-foreground focus:outline-none whitespace-pre-wrap break-words ${readOnly ? 'cursor-not-allowed' : ''}`}
        style={{ WebkitTextFillColor: 'transparent' }}
        placeholder={readOnly ? '工作区为只读/不兼容,无法编辑' : '输入 CSL 代码...'}
      />
    </div>
  );
};

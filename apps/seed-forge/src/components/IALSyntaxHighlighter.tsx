import { useEffect, useRef } from 'react';
import { Code2 } from 'lucide-react';

/**
 * IAL Syntax Highlighter
 * Provides syntax highlighting for IAL expressions
 */
export const IALSyntaxHighlighter = ({ 
  source, 
  onChange 
}: { 
  source: string; 
  onChange: (value: string) => void;
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  // White layer glyphs
  const whiteGlyphs = ['W₁', 'W1', 'WHITE_SEED', 'Æ', 'AE', 'Ω', 'OMEGA', 'Ψ', 'PSI', 'Λ', 'LAMBDA', 'Σ', 'SIGMA', 'Φ', 'PHI', 'Θ', 'THETA', 'Η', 'H', 'ETA', 'Ξ', 'XI', 'ΔΩ', 'DELTA_OMEGA', 'Ō', 'O', 'ORIGIN_LOOP'];
  
  // Blue layer glyphs
  const blueGlyphs = ['Γ', 'GAMMA', 'Π', 'PI', 'Χ', 'X', 'CHI', 'Z', 'ZETA', 'K', 'KAPPA', 'T', 'TAU', 'B₂', 'B2', 'BLUE_BOUND', 'F₁', 'F1', 'FLOW_ONE', 'S₄', 'S4', 'SECTOR_FOUR', 'R₀', 'R0', 'ROOT', 'NΣ', 'NSIGMA', 'C∞', 'CINF', 'C_INFINITY'];
  
  // Gold layer glyphs
  const goldGlyphs = ['I', 'IMPERIUM', 'D', 'DOMINION', 'V', 'VECTOR', 'A₊', 'A+', 'ASCEND', 'Y', 'YIELD', 'Z₊', 'Z+', 'ZENITH', 'G₁', 'G1', 'GOLD_SOURCE', 'MΩ', 'MOMEGA', 'PΘ', 'PTHETA', 'L₁', 'L1', 'LIGHT_ONE', 'EΔ', 'EDELTA', 'K∞', 'KINF', 'KING_INFINITE'];

  const highlightText = (text: string): string => {
    let highlighted = text;

    // Highlight White glyphs
    whiteGlyphs.forEach(glyph => {
      const regex = new RegExp(`\\b${glyph.replace(/[+∞ΔΩ]/g, '\\$&')}\\b`, 'gi');
      highlighted = highlighted.replace(regex, (match) => 
        `<span class="text-blue-300 font-semibold">${match}</span>`
      );
    });

    // Highlight Blue glyphs
    blueGlyphs.forEach(glyph => {
      const regex = new RegExp(`\\b${glyph.replace(/[+∞ΔΩ]/g, '\\$&')}\\b`, 'gi');
      highlighted = highlighted.replace(regex, (match) => 
        `<span class="text-cyan-300 font-semibold">${match}</span>`
      );
    });

    // Highlight Gold glyphs
    goldGlyphs.forEach(glyph => {
      const regex = new RegExp(`\\b${glyph.replace(/[+∞ΔΩ]/g, '\\$&')}\\b`, 'gi');
      highlighted = highlighted.replace(regex, (match) => 
        `<span class="text-yellow-300 font-semibold">${match}</span>`
      );
    });

    // Highlight operators
    highlighted = highlighted.replace(/→/g, '<span class="text-purple-400">→</span>');
    highlighted = highlighted.replace(/:/g, '<span class="text-gray-400">:</span>');
    highlighted = highlighted.replace(/=/g, '<span class="text-gray-400">=</span>');
    
    // Highlight modifiers
    highlighted = highlighted.replace(/([+\-×÷∞Δ])/g, '<span class="text-green-400">$1</span>');
    
    // Highlight keywords
    highlighted = highlighted.replace(/\b(CIV|MATRIX|SPELL)\b/gi, '<span class="text-orange-400 font-semibold">$1</span>');
    
    // Highlight strings
    highlighted = highlighted.replace(/("([^"\\]|\\.)*"|'([^'\\]|\\.)*')/g, '<span class="text-green-300">$1</span>');
    
    // Highlight numbers
    highlighted = highlighted.replace(/\b\d+\.?\d*\b/g, '<span class="text-blue-400">$&</span>');

    return highlighted;
  };

  useEffect(() => {
    if (!textareaRef.current || !highlightRef.current) return;

    const textarea = textareaRef.current;
    const highlightDiv = highlightRef.current;

    const updateHighlight = () => {
      const highlighted = highlightText(textarea.value);
      highlightDiv.innerHTML = highlighted.replace(/\n/g, '<br>');
      
      // Sync scroll
      highlightDiv.scrollTop = textarea.scrollTop;
      highlightDiv.scrollLeft = textarea.scrollLeft;
    };

    textarea.addEventListener('input', updateHighlight);
    textarea.addEventListener('scroll', () => {
      highlightDiv.scrollTop = textarea.scrollTop;
      highlightDiv.scrollLeft = textarea.scrollLeft;
    });

    updateHighlight();

    return () => {
      textarea.removeEventListener('input', updateHighlight);
    };
  }, [source]);

  return (
    <div className="relative w-full">
      {/* Highlight layer */}
      <div
        ref={highlightRef}
        className="absolute inset-0 p-3 font-mono text-sm whitespace-pre-wrap break-words pointer-events-none overflow-hidden"
        style={{
          color: 'transparent',
          border: '1px solid transparent',
          zIndex: 1,
        }}
      />
      
      {/* Textarea layer */}
      <textarea
        ref={textareaRef}
        value={source}
        onChange={(e) => onChange(e.target.value)}
        className="relative w-full p-3 font-mono text-sm bg-transparent border border-border rounded resize-none overflow-auto"
        style={{
          color: 'transparent',
          caretColor: 'white',
          zIndex: 2,
        }}
        spellCheck={false}
      />
    </div>
  );
};

/**
 * Simple IAL Syntax Highlighter (Alternative)
 * Uses CSS classes for simpler implementation
 */
export const SimpleIALHighlighter = ({ 
  source, 
  onChange 
}: { 
  source: string; 
  onChange: (value: string) => void;
}) => {
  return (
    <div className="relative">
      <textarea
        value={source}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-3 font-mono text-sm bg-secondary/30 border border-border rounded resize-none"
        placeholder="输入 IAL 表达式，例如: Ψ : Γ K Z : V"
        spellCheck={false}
      />
      <div className="absolute top-3 right-3 text-xs text-muted-foreground flex items-center gap-1">
        <Code2 className="w-3 h-3" />
        <span>IAL</span>
      </div>
    </div>
  );
};


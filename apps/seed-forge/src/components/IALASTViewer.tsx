import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TreePine, ChevronRight, ChevronDown } from 'lucide-react';
import { compileIAL } from '@/lib/ial';
import { ASTNode, ASTNodeType } from '@/lib/ial';

/**
 * IAL AST Viewer Component
 * Displays the Abstract Syntax Tree of compiled IAL
 */
export const IALASTViewer = () => {
  const [source, setSource] = useState('Ψ : Γ K Z : V');
  const [ast, setAST] = useState<ASTNode | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['root']));

  const handleCompile = () => {
    try {
      const result = compileIAL(source);
      if (result.success && result.ast) {
        setAST(result.ast);
        setExpandedNodes(new Set(['root']));
      } else {
        setAST(null);
        console.warn('Compilation failed:', result.errors);
      }
    } catch (error) {
      console.error('Compilation error:', error);
      setAST(null);
    }
  };

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const renderNode = (node: ASTNode, depth: number = 0, nodeId: string = 'root'): JSX.Element | null => {
    if (!node) return null;

    const isExpanded = expandedNodes.has(nodeId);
    const hasChildren = 'statements' in node || 'expressions' in node || 'glyphs' in node;

    const getNodeColor = (type: ASTNodeType): string => {
      switch (type) {
        case ASTNodeType.PROGRAM:
          return 'text-blue-400';
        case ASTNodeType.EXPRESSION:
          return 'text-green-400';
        case ASTNodeType.SPELL:
          return 'text-purple-400';
        case ASTNodeType.MATRIX:
          return 'text-yellow-400';
        case ASTNodeType.CIV_BLOCK:
          return 'text-red-400';
        case ASTNodeType.GLYPH:
          return 'text-cyan-400';
        case ASTNodeType.GLYPH_SEQUENCE:
          return 'text-orange-400';
        case ASTNodeType.MODIFIER:
          return 'text-pink-400';
        default:
          return 'text-gray-400';
      }
    };

    const getNodeIcon = (type: ASTNodeType): string => {
      switch (type) {
        case ASTNodeType.PROGRAM:
          return '📦';
        case ASTNodeType.EXPRESSION:
          return '⚡';
        case ASTNodeType.SPELL:
          return '✨';
        case ASTNodeType.MATRIX:
          return '🔷';
        case ASTNodeType.CIV_BLOCK:
          return '🏛️';
        case ASTNodeType.GLYPH:
          return '🔤';
        case ASTNodeType.GLYPH_SEQUENCE:
          return '🔗';
        case ASTNodeType.MODIFIER:
          return '➕';
        default:
          return '📄';
      }
    };

    return (
      <div key={nodeId} className="select-none">
        <div
          className="flex items-center gap-1 py-1 hover:bg-secondary/30 rounded cursor-pointer"
          style={{ paddingLeft: `${depth * 20}px` }}
          onClick={() => hasChildren && toggleNode(nodeId)}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )
          ) : (
            <div className="w-4" />
          )}
          <span className="text-lg">{getNodeIcon(node.type)}</span>
          <span className={`font-semibold ${getNodeColor(node.type)}`}>
            {node.type}
          </span>
          {node.type === ASTNodeType.GLYPH && 'value' in node && typeof (node as any).value === 'string' && (
            <span className="text-sm text-muted-foreground ml-2">
              ({(node as any).value})
            </span>
          )}
          {node.type === ASTNodeType.EXPRESSION && (
            <span className="text-xs text-muted-foreground ml-2">
              {('white' in node && node.white ? 'W' : '')}
              {('blue' in node && node.blue ? 'B' : '')}
              {('gold' in node && node.gold ? 'G' : '')}
            </span>
          )}
        </div>

        {isExpanded && (
          <>
            {node.type === ASTNodeType.PROGRAM && 'statements' in node && Array.isArray(node.statements) && (
              <div>
                {node.statements.map((stmt, i) =>
                  renderNode(stmt as ASTNode, depth + 1, `${nodeId}.stmt.${i}`)
                )}
              </div>
            )}

            {node.type === ASTNodeType.EXPRESSION && 'white' in node && node.white && (
              <div className="pl-4">
                {renderNode(node.white as ASTNode, depth + 1, `${nodeId}.white`)}
              </div>
            )}

            {node.type === ASTNodeType.EXPRESSION && 'blue' in node && node.blue && (
              <div className="pl-4">
                {renderNode(node.blue as ASTNode, depth + 1, `${nodeId}.blue`)}
              </div>
            )}

            {node.type === ASTNodeType.EXPRESSION && 'gold' in node && node.gold && (
              <div className="pl-4">
                {renderNode(node.gold as ASTNode, depth + 1, `${nodeId}.gold`)}
              </div>
            )}

            {node.type === ASTNodeType.GLYPH_SEQUENCE && 'glyphs' in node && Array.isArray(node.glyphs) && (
              <div>
                {node.glyphs.map((glyph, i) =>
                  renderNode(glyph as ASTNode, depth + 1, `${nodeId}.glyph.${i}`)
                )}
              </div>
            )}

            {node.type === ASTNodeType.SPELL && 'expressions' in node && Array.isArray(node.expressions) && (
              <div>
                {node.expressions.map((expr, i) =>
                  renderNode(expr as ASTNode, depth + 1, `${nodeId}.expr.${i}`)
                )}
              </div>
            )}

            {node.type === ASTNodeType.GLYPH && 'modifiers' in node && Array.isArray(node.modifiers) && node.modifiers.length > 0 && (
              <div>
                {node.modifiers.map((mod, i) =>
                  renderNode(mod as ASTNode, depth + 1, `${nodeId}.mod.${i}`)
                )}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <Card className="p-6 bg-card/30 backdrop-blur border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <TreePine className="w-5 h-5 text-primary" />
          <CardTitle>IAL AST 可视化</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input */}
        <div className="space-y-2">
          <input
            type="text"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="输入 IAL 表达式"
            className="w-full px-3 py-2 bg-secondary/30 border border-border rounded font-mono text-sm"
          />
          <button
            onClick={handleCompile}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
          >
            编译并显示 AST
          </button>
        </div>

        {/* AST Tree */}
        {ast ? (
          <div className="p-4 bg-secondary/10 rounded border border-border max-h-96 overflow-auto">
            {renderNode(ast)}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            输入 IAL 表达式并编译以查看 AST
          </div>
        )}
      </CardContent>
    </Card>
  );
};


import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Code2, Play, CheckCircle2, XCircle, AlertCircle, Zap } from 'lucide-react';
import { compileIAL, validateIAL, IALErrorHandler, ErrorSeverity } from '@/lib/ial';
import { IALWorkerCompiler } from '@/lib/ial/WorkerCompiler';
import { IALAutocomplete } from '@/lib/ial/Autocomplete';
import { AIAssistant } from '@/lib/ai/AIAssistant';
import { oseEngine } from '@/lib/ose';
import { SimpleIALHighlighter } from './IALSyntaxHighlighter';
import { toast } from 'sonner';

export const IALCompiler = () => {
  const [source, setSource] = useState('Ψ : Γ K Z : V');
  const [result, setResult] = useState<any>(null);
  const [validation, setValidation] = useState<any>(null);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [useWorker, setUseWorker] = useState(false);
  const [compiling, setCompiling] = useState(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<string[]>([]);
  const [autocompletePosition, setAutocompletePosition] = useState({ start: 0, end: 0 });
  const errorHandler = new IALErrorHandler();
  const workerCompiler = new IALWorkerCompiler();
  const autocomplete = new IALAutocomplete();
  const aiAssistant = new AIAssistant({ fallbackMode: 'rule-based' });

  // Detect current layer from IAL expression
  const detectCurrentLayer = (source: string, cursorPos: number): 'white' | 'blue' | 'gold' | undefined => {
    const beforeCursor = source.substring(0, cursorPos);
    const parts = beforeCursor.split(':');
    
    if (parts.length === 1) {
      return 'white';
    } else if (parts.length === 2) {
      return 'blue';
    } else if (parts.length >= 3) {
      return 'gold';
    }
    
    return undefined;
  };

  const handleCompile = async () => {
    setCompiling(true);
    try {
      let compileResult;
      
      if (useWorker) {
        // Use Web Worker for parallel compilation
        compileResult = await workerCompiler.compile(source);
      } else {
        // Use main thread compilation
        compileResult = compileIAL(source);
      }
      
      setResult(compileResult);
      
      if (compileResult.success) {
        toast.success('IAL 编译成功', {
          description: useWorker ? '（使用 Web Worker）' : '',
        });
      } else {
        toast.error('IAL 编译失败', {
          description: compileResult.errors[0]?.message,
        });
      }
    } catch (error) {
      toast.error('编译错误', {
        description: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setCompiling(false);
    }
  };

  const handleValidate = () => {
    const validationResult = validateIAL(source);
    setValidation(validationResult);
    
    if (validationResult.valid) {
      toast.success('IAL 表达式有效');
    } else {
      toast.error('IAL 表达式无效', {
        description: validationResult.errors.join(', '),
      });
    }
  };

  const handleExecute = () => {
    try {
      const compileResult = compileIAL(source);
      
      if (!compileResult.success || !compileResult.compiled) {
        toast.error('无法执行：编译失败');
        return;
      }

      // Execute with OSE
      const executionResults = compileResult.compiled.map(compiled => 
        oseEngine.execute(compiled)
      );

      setExecutionResult({
        compiled: compileResult.compiled,
        execution: executionResults,
      });

      toast.success('执行成功', {
        description: `执行了 ${executionResults.length} 个 IAL 表达式`,
      });
    } catch (error) {
      toast.error('执行错误', {
        description: error instanceof Error ? error.message : String(error),
      });
    }
  };

  return (
    <Card className="p-6 bg-card/30 backdrop-blur border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Code2 className="w-5 h-5 text-primary" />
          <CardTitle>IAL 编译器</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold">IAL 表达式</label>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={useWorker}
                onChange={(e) => setUseWorker(e.target.checked)}
                className="w-4 h-4"
              />
              <span>使用 Web Worker</span>
            </label>
          </div>
          <div className="relative">
            <SimpleIALHighlighter
              source={source}
              onChange={async (value) => {
                setSource(value);
                // Update autocomplete with AI enhancement
                const cursorPos = value.length; // Simplified: assume cursor at end
                const basicSuggestions = autocomplete.getSuggestions(value, cursorPos);
                
                // Enhance with AI assistant
                try {
                  const currentLayer = detectCurrentLayer(value, cursorPos);
                  const enhanced = await aiAssistant.smartCompletion(value, cursorPos, {
                    previousExpressions: [value], // Could track more history
                    currentLayer: currentLayer || undefined,
                  });
                  
                  if (enhanced.suggestions.length > 0) {
                    setAutocompleteSuggestions(enhanced.suggestions);
                    setAutocompletePosition({ start: basicSuggestions.startPosition, end: basicSuggestions.endPosition });
                    setShowAutocomplete(true);
                  } else {
                    setShowAutocomplete(false);
                  }
                } catch (error) {
                  // Fallback to basic autocomplete
                  if (basicSuggestions.suggestions.length > 0) {
                    setAutocompleteSuggestions(basicSuggestions.suggestions);
                    setAutocompletePosition({ start: basicSuggestions.startPosition, end: basicSuggestions.endPosition });
                    setShowAutocomplete(true);
                  } else {
                    setShowAutocomplete(false);
                  }
                }
              }}
            />
            {/* Autocomplete dropdown with explanations */}
            {showAutocomplete && autocompleteSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-secondary border border-border rounded shadow-lg z-50 max-h-48 overflow-y-auto">
                {autocompleteSuggestions.map((suggestion, index) => {
                  const currentLayer = detectCurrentLayer(source, source.length);
                  const explanation = aiAssistant['explainSuggestion'](suggestion, {
                    currentLayer: currentLayer || undefined,
                  });
                  return (
                    <button
                      key={index}
                      className="w-full text-left px-3 py-2 hover:bg-accent text-sm border-b border-border/50 last:border-0"
                      onClick={() => {
                        const before = source.substring(0, autocompletePosition.start);
                        const after = source.substring(autocompletePosition.end);
                        setSource(before + suggestion + after);
                        setShowAutocomplete(false);
                      }}
                    >
                      <div className="font-mono font-semibold">{suggestion}</div>
                      {explanation && (
                        <div className="text-xs text-muted-foreground mt-1">{explanation}</div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button 
            onClick={handleCompile} 
            className="flex-1"
            disabled={compiling}
          >
            <Play className="w-4 h-4 mr-2" />
            {compiling ? '编译中...' : '编译'}
          </Button>
          <Button onClick={handleValidate} variant="outline" className="flex-1">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            验证
          </Button>
          <Button onClick={handleExecute} variant="default" className="flex-1 bg-primary">
            <Zap className="w-4 h-4 mr-2" />
            执行
          </Button>
        </div>

        {/* Validation Result */}
        {validation && (
          <div className="p-4 bg-secondary/30 rounded-lg border border-primary/10">
            <div className="flex items-center gap-2 mb-2">
              {validation.valid ? (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
              <span className="font-semibold">
                {validation.valid ? '表达式有效' : '表达式无效'}
              </span>
            </div>
            {validation.errors.length > 0 && (
              <div className="text-sm text-red-500 space-y-1">
                {validation.errors.map((error: string, i: number) => (
                  <div key={i}>• {error}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Compilation Result */}
        {result && (
          <div className="space-y-4">
            {result.success ? (
              <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="font-semibold text-green-500">编译成功</span>
                </div>
                
                {result.compiled && result.compiled.length > 0 && (
                  <div className="space-y-3">
                    {result.compiled.map((compiled: any, i: number) => (
                      <div key={i} className="p-3 bg-secondary/30 rounded border border-border">
                        <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                          <div>
                            <span className="text-muted-foreground">Domain:</span>
                            <Badge variant="outline" className="ml-2">
                              {compiled.domain}
                            </Badge>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Target:</span>
                            <Badge variant="outline" className="ml-2">
                              {compiled.target}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-xs space-y-1">
                          <div>
                            <span className="text-muted-foreground">Operation:</span>
                            <span className="ml-2 font-mono">{compiled.operation}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Glyphs:</span>
                            <span className="ml-2 font-mono">
                              {compiled.glyphs.join(' ')}
                            </span>
                          </div>
                          {compiled.modifiers.length > 0 && (
                            <div>
                              <span className="text-muted-foreground">Modifiers:</span>
                              <span className="ml-2 font-mono">
                                {compiled.modifiers.join(' ')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span className="font-semibold text-red-500">编译失败</span>
                </div>
                {result.enhancedErrors && result.enhancedErrors.length > 0 ? (
                  <div className="space-y-3">
                    {result.enhancedErrors.map((enhanced: any, i: number) => (
                      <div key={i} className="p-3 bg-secondary/30 rounded border border-border">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">{errorHandler.getErrorIcon(enhanced.severity)}</span>
                          <span className={`font-semibold ${errorHandler.getErrorColor(enhanced.severity)}`}>
                            {enhanced.message}
                          </span>
                        </div>
                        {enhanced.position && (
                          <div className="text-xs text-muted-foreground mb-1">
                            位置: 第 {enhanced.position.line} 行, 第 {enhanced.position.column} 列
                          </div>
                        )}
                        {enhanced.suggestion && (
                          <div className="text-sm text-yellow-500 mb-1">
                            💡 建议: {enhanced.suggestion}
                          </div>
                        )}
                        {enhanced.recovery && (
                          <div className="text-sm text-blue-500">
                            🔧 修复: {enhanced.recovery}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  result.errors.length > 0 && (
                    <div className="text-sm text-red-500 space-y-1">
                      {result.errors.map((error: Error, i: number) => (
                        <div key={i}>• {error.message}</div>
                      ))}
                    </div>
                  )
                )}
              </div>
            )}

            {result.warnings.length > 0 && (
              <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-yellow-500" />
                  <span className="font-semibold text-yellow-500">警告</span>
                </div>
                <div className="text-sm text-yellow-500 space-y-1">
                  {result.warnings.map((warning: string, i: number) => (
                    <div key={i}>• {warning}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Examples */}
        <div className="pt-4 border-t border-border">
          <div className="text-xs font-semibold mb-2 text-muted-foreground">示例表达式：</div>
          <div className="space-y-1">
            {[
              'W₁ : Γ Π Χ : I',
              'Ψ : Γ K Z : V',
              'Æ : Σ : Φ',
              'ΔΩ : Γ : MΩ',
            ].map((example, i) => (
              <button
                key={i}
                onClick={() => setSource(example)}
                className="block w-full text-left text-xs font-mono p-2 bg-secondary/30 hover:bg-secondary/50 rounded border border-border transition-colors"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};


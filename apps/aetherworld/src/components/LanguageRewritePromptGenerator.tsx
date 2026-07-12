import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, CheckCircle2 } from "lucide-react";
import { buildPromptDirectives, type ClientType, type PageType } from "@/lib/productUserLanguageEngine";

export function LanguageRewritePromptGenerator({
  userType,
  pageType,
}: {
  userType: ClientType;
  pageType: PageType;
}) {
  const [copied, setCopied] = useState(false);
  const directives = useMemo(
    () => buildPromptDirectives({ userType, pageType, pageText: "" }),
    [userType, pageType],
  );

  const prompt = useMemo(() => {
    const lines: string[] = [];
    lines.push("# Lovable 文案修复提示词 · Language Rewrite Prompt");
    lines.push("");
    lines.push(`目标用户：${userType}`);
    lines.push(`页面类型：${pageType}`);
    lines.push(`目标语言层级：${directives.targetUserLanguageLevel}`);
    lines.push(`解释深度：${directives.explanationDepth}`);
    lines.push(`Microcopy 模式：${directives.microcopyMode ? "是" : "否"}`);
    lines.push("");
    lines.push("## 必须遵守");
    if (directives.targetUserLanguageLevel === "USER_FRIENDLY" || directives.targetUserLanguageLevel === "ACTION_ORIENTED") {
      lines.push("- 不要直接展示高级术语，先用用户语言解释。");
    }
    if (directives.targetUserLanguageLevel === "ENTERPRISE_SAFE") {
      lines.push("- 完全去命运化，使用 Decision OS 语言（Scenario / Decision / Signal / Review）。");
    }
    if (directives.targetUserLanguageLevel === "EDUCATIONAL" || directives.targetUserLanguageLevel === "RAW_SYSTEM") {
      lines.push("- 可保留术语，但必须附带一句话定义。");
    }
    if (directives.microcopyMode) {
      lines.push("- 移动端短文案：每条不超过 8 个字。");
    }
    lines.push("- 高阶术语首次出现需 tooltip。");
    lines.push("- 普通用户主流程不展示超过 2 个高阶术语。");
    lines.push("");
    if (directives.forbiddenJargon.length) {
      lines.push("## 禁用术语");
      lines.push(directives.forbiddenJargon.map((t) => `- ${t}`).join("\n"));
      lines.push("");
    }
    if (directives.terminologyHints.length) {
      lines.push("## 推荐替换");
      directives.terminologyHints.slice(0, 12).forEach((h) => lines.push(`- ${h.raw} → ${h.useInstead}`));
      lines.push("");
    }
    lines.push("## 输出要求");
    lines.push("- 保留产品安全边界（“预测 ≠ 断言未来；行动可改变结果”）。");
    lines.push("- 保留回验入口与隐私提示。");
    return lines.join("\n");
  }, [userType, pageType, directives]);

  const copy = async () => {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Card className="p-5 space-y-3 aether-card">
      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Language Rewrite Prompt Generator</div>
        <Button size="sm" variant="outline" onClick={copy} className="gap-2">
          {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? "已复制" : "复制"}
        </Button>
      </div>
      <pre className="text-xs whitespace-pre-wrap bg-muted/30 rounded-md p-3 max-h-[420px] overflow-auto">{prompt}</pre>
    </Card>
  );
}

import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

/**
 * OnboardingExplanationCard · 入门说明卡（极短）
 */
export function OnboardingExplanationCard() {
  return (
    <Card className="p-5 aether-card space-y-3">
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        What is this · 一分钟说明
      </div>
      <Tabs defaultValue="A">
        <TabsList>
          <TabsTrigger value="A">版本 A</TabsTrigger>
          <TabsTrigger value="B">版本 B</TabsTrigger>
          <TabsTrigger value="C">版本 C</TabsTrigger>
        </TabsList>
        <TabsContent value="A" className="pt-3 text-sm leading-relaxed text-foreground/85 space-y-1">
          <p>这个工具不是替你做决定。</p>
          <p>它帮你判断：</p>
          <p>· 这件事现在定没定，</p>
          <p>· 你现在该不该动，</p>
          <p>· 后来结果有没有验证。</p>
        </TabsContent>
        <TabsContent value="B" className="pt-3 text-sm leading-relaxed text-foreground/85">
          你可以把它理解成：一个「时间窗口 + 行动建议 + 后续记录」的个人决策工具。
        </TabsContent>
        <TabsContent value="C" className="pt-3 text-sm leading-relaxed text-foreground/85 space-y-1">
          <p>如果你经常卡在：</p>
          <p>· 要不要发消息、</p>
          <p>· 要不要继续做项目、</p>
          <p>· 要不要抓机会、</p>
          <p>· 要不要先休息，</p>
          <p>这个工具就是为这种状态设计的。</p>
        </TabsContent>
      </Tabs>
    </Card>
  );
}

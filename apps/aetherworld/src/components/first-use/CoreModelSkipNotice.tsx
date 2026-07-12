export function CoreModelSkipNotice() {
  return (
    <div className="text-[11px] text-muted-foreground leading-relaxed border-t border-border/40 pt-3">
      Aetherworld 优先使用浏览器本地能力。核心模型用于增强对话、概念理解和知识检索。系统不会因为初始化核心模型而自动上传你的私有数据。
      Full60 原始数列、Founder-only 数据、密钥、token 和密码不得进入模型上下文。
    </div>
  );
}

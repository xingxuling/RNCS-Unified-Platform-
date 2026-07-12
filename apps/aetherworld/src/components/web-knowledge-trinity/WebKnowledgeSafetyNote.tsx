export function WebKnowledgeSafetyNote() {
  return (
    <div className="rounded border border-amber-500/30 bg-amber-500/5 p-3 text-[11px] leading-relaxed text-amber-100/90">
      <div className="font-semibold mb-1 text-amber-300">安全边界</div>
      Aether Web Knowledge Trinity Runtime 用于将 Aetherworld 的知识、计算法和常数组织为浏览器本地三层模型：
      <span className="font-semibold">WebLKM</span> 负责知识检索与证据链，
      <span className="font-semibold">WebCM</span> 负责计算法选择与执行路线，
      <span className="font-semibold">WebCoM</span> 负责常数、不变量与边界约束。
      不等于现实事实来源、医学模型、金融系统或法律系统。所有输出必须经过 QA、System Constitution、Workspace Trace 与必要的 Recalculation。
      Full60 原始数列、Founder-only 数据、密钥、token、密码和隐私原文不得进入公共知识库或传给模型。
    </div>
  );
}

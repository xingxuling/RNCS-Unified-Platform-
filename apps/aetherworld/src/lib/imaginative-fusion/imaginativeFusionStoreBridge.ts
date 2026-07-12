// WebXXMPackageIdea 草案生成（仅草案，不自动安装 / 上架）
import type { ImaginativeFusionIdea, WebXXMPackageIdea } from "./imaginativeFusionTypes";

export function buildWebXXMPackageIdeas(ideas: ImaginativeFusionIdea[]): WebXXMPackageIdea[] {
  return ideas
    .filter((i) => i.fusionMode === "STORE_FUSION" || i.suggestedNextStep === "CREATE_WEBXXM_PACKAGE_DRAFT")
    .map((i) => ({
      packageName: `Web${slug(i.title)}M`,
      capability: i.description,
      input: "用户输入 / 上游对象引用",
      output: "WebXXM 内部对象草案 + Bridge Plan",
      requiredPermissions: i.riskLevel === "HIGH"
        ? ["READ_USER_DATA", "WRITE_WORKSPACE", "REQUEST_NETWORK_READONLY"]
        : ["READ_WORKSPACE", "WRITE_WORKSPACE"],
      riskLevel: i.riskLevel,
      installFlow: [
        "用户预览能力描述",
        "Secret Guard 检查所需权限",
        "确认后写入 Store 草案（不自动上架）",
      ],
      usageExample: `示例：在 Chat 输入「触发 ${i.cnTitle}」→ 系统调用能力包 → 输出草案对象。`,
    }));
}

function slug(s: string): string {
  return (s || "Pkg").replace(/[^A-Za-z0-9]+/g, "");
}

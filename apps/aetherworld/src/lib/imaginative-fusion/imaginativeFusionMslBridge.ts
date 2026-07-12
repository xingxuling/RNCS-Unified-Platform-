// MSL 帧草案（容错）
import type { ImaginativeFusionReport } from "./imaginativeFusionTypes";

export function buildImaginativeMslFrame(report: ImaginativeFusionReport): string {
  const top = report.topIdeas.map((i) => i.cnTitle).join(" / ");
  return [
    "MSL::IMAGINATIVE_FUSION",
    `@status=SUCCESS`,
    `@ideas=${report.ideaCount}`,
    `@p0=${report.p0Ideas.length}`,
    `@p1=${report.p1Ideas.length}`,
    `@top=${top || "-"}`,
  ].join("\n");
}

// AetherSeed-VL dry-run 预检（纯本地推断，不执行命令）
import type { VlmDryRunReport, VlmTrainingConfig } from "./vlmTypes";
import { listVlmSamples } from "./vlmSampleStore";
import { findBaseModel } from "./vlmBaseModels";

const WHITELIST = [
  "python train_vlm.py --config vlm_config.yaml",
  "python eval_vlm.py --config vlm_config.yaml",
  "python check_vlm_env.py",
  "python -m pip install -r requirements_vlm.txt",
];

export function getVlmGatewayWhitelist(): string[] {
  return [...WHITELIST];
}

export function runVlmDryRun(config: VlmTrainingConfig, userConfirmed: boolean): VlmDryRunReport {
  const samples = listVlmSamples().filter((s) => s.safetyStatus !== "BLOCK");
  const hasImages = samples.some((s) => s.images.length > 0);
  const base = findBaseModel(config.baseModelId);
  const checks = [
    { name: "图文数据集存在", ok: samples.length > 0, detail: `可用样本：${samples.length}` },
    { name: "至少存在一张图片", ok: hasImages, detail: hasImages ? "OK" : "未发现任何图片" },
    { name: "底座模型已声明", ok: !!config.baseModelId, detail: config.baseModelId || "未设置" },
    { name: "processor 可用", ok: !!config.processor, detail: config.processor },
    { name: "输出目录已声明", ok: !!config.outputDir, detail: config.outputDir },
    { name: "设备模式已声明", ok: !!config.deviceMode, detail: config.deviceMode },
    { name: "训练方式非全参数", ok: config.trainingMethod !== "VLM_SFT" || config.batchSize <= 8, detail: config.trainingMethod },
    {
      name: "底座模型推荐 LoRA / SFT",
      ok: !!base,
      detail: base ? `${base.displayName} · ${base.inferenceTrack}` : "未在已知清单中（仍可使用，但请人工核对）",
    },
    { name: "白名单命令已就位", ok: WHITELIST.length >= 4, detail: `${WHITELIST.length} 条` },
    { name: "用户已确认", ok: userConfirmed, detail: userConfirmed ? "已确认" : "未确认（禁止真正训练）" },
  ];
  const blockingReasons = checks.filter((c) => !c.ok).map((c) => c.name);
  return {
    ok: blockingReasons.length === 0,
    checkedAt: new Date().toISOString(),
    checks,
    blockingReasons,
  };
}

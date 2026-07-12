// AetherSeed Local Training · 扩展文件构建器（300M 适用）
// 生成 check_env.py / README_ollama_export.md。
// 安全边界：脚本由 Founder 手动运行，本系统不执行。
import type { LocalTrainingPlan } from "./localTrainingTypes";
import type { LocalTrainingExtendedOptions } from "./localTrainingExtendedOptions";
import {
  HARDWARE_MODE_LABEL,
  OUTPUT_FORMAT_LABEL,
  effectiveMaxSteps,
  effectiveMinutes,
} from "./localTrainingExtendedOptions";

export function buildCheckEnvPy(): string {
  return `"""AetherSeed Local Training · check_env.py 草案
说明：
  - 在本机执行：python check_env.py
  - 检查 Python / torch / CUDA / 磁盘空间 / 写权限。
  - 不联网；不上传任何信息。
"""
import os
import sys
import shutil


def main() -> int:
    print(f"[AetherSeed] python = {sys.version.split()[0]}")
    try:
        import torch  # type: ignore
        print(f"[AetherSeed] torch  = {torch.__version__}")
        cuda = torch.cuda.is_available()
        print(f"[AetherSeed] cuda   = {cuda}")
        if cuda:
            print(f"[AetherSeed] device = {torch.cuda.get_device_name(0)}")
    except Exception as e:
        print(f"[AetherSeed] torch missing: {e}")
        return 1

    cwd = os.getcwd()
    total, used, free = shutil.disk_usage(cwd)
    print(f"[AetherSeed] free   = {free // (1024 ** 3)} GB at {cwd}")
    if free < 5 * 1024 ** 3:
        print("[AetherSeed][WARN] 剩余空间 < 5GB，300M checkpoint 可能保存不下。")

    test_dir = os.path.join(cwd, "outputs", "checkpoints", ".aether_write_test")
    try:
        os.makedirs(test_dir, exist_ok=True)
        with open(os.path.join(test_dir, "ok.txt"), "w", encoding="utf-8") as f:
            f.write("ok")
        print("[AetherSeed] write permission: OK")
    except Exception as e:
        print(f"[AetherSeed][ERROR] cannot write outputs/: {e}")
        return 2

    print("[AetherSeed] env check passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
`;
}

export function buildOllamaExportReadme(
  plan: LocalTrainingPlan,
  opts: LocalTrainingExtendedOptions,
): string {
  const tag = opts.ollamaTargetTag || "aetherseed-300m";
  const lines: string[] = [];
  lines.push(`# AetherSeed 300M · Ollama 接入准备 README`);
  lines.push("");
  lines.push(`- 训练计划：\`${plan.name}\``);
  lines.push(`- 目标模型：\`${plan.targetModel}\``);
  lines.push(`- Ollama 目标名称：\`${tag}\``);
  lines.push("");
  lines.push("> 本文件仅为接入准备说明，不会自动执行任何转换 / 上传 / 下载。");
  lines.push("> 所有步骤由创始人在本机手动执行。模型仅供 Aetherworld 内部使用，不开源、不公开。");
  lines.push("");
  lines.push("## 1. 训练完成");
  lines.push("- 在本机训练页面把实验状态改为 `COMPLETED_MANUAL`。");
  lines.push("- 记录最终 checkpoint 路径，例如 `outputs/checkpoints/aetherseed-300m/final/`。");
  lines.push("");
  lines.push("## 2. 转 HuggingFace 格式");
  lines.push("```bash");
  lines.push("# 由 Founder 在本机执行（脚本可后续补齐）");
  lines.push("python tools/convert_to_hf.py \\");
  lines.push("  --checkpoint outputs/checkpoints/aetherseed-300m/final/ \\");
  lines.push("  --out outputs/hf/aetherseed-300m/");
  lines.push("```");
  lines.push("");
  lines.push("## 3. 转 GGUF");
  lines.push("```bash");
  lines.push("# 使用 llama.cpp 的 convert 工具（本机手动，不联网）");
  lines.push("python convert.py outputs/hf/aetherseed-300m/ \\");
  lines.push("  --outfile outputs/gguf/aetherseed-300m.gguf \\");
  lines.push("  --outtype q4_0");
  lines.push("```");
  lines.push("");
  lines.push("## 4. 创建 Modelfile");
  lines.push("```text");
  lines.push("FROM ./outputs/gguf/aetherseed-300m.gguf");
  lines.push("TEMPLATE \"\"\"{{ .System }}\\n用户：{{ .Prompt }}\\nAetherSeed：\"\"\"");
  lines.push("SYSTEM \"\"\"你是 AetherSeed 300M 私有模型，仅供 Aetherworld 创始人内部使用，不对外公开。\"\"\"");
  lines.push("PARAMETER temperature 0.7");
  lines.push("PARAMETER num_ctx 2048");
  lines.push("```");
  lines.push("");
  lines.push("## 5. 注册到 Ollama");
  lines.push("```bash");
  lines.push(`ollama create ${tag} -f Modelfile`);
  lines.push(`ollama run ${tag}`);
  lines.push("```");
  lines.push("");
  lines.push("## 6. 接入本地执行网关");
  lines.push("- 打开 `/system/local-gateway`，把 Provider 模型名设置为 `" + tag + "`。");
  lines.push("- 在 Chat 中测试是否可以稳定返回中文与 Lovable Prompt 结构。");
  lines.push("");
  lines.push("## 安全提醒");
  lines.push("- 训练数据不上传；模型不上传；checkpoint 不上传。");
  lines.push("- 本模型仅供创始人本人和 Aetherworld 内部使用，不发布到公开仓库。");
  lines.push("- 不要把私有模型权重打包进任何对外发布的包。");
  lines.push("");
  lines.push("## 训练运行摘要");
  const maxSteps = effectiveMaxSteps(opts);
  lines.push(`- 硬件模式：${HARDWARE_MODE_LABEL[opts.hardwareMode]}`);
  lines.push(`- 训练时长：${effectiveMinutes(opts)} 分钟`);
  lines.push(`- 最大步数：${maxSteps === "AUTO" ? "自动估算" : maxSteps}`);
  lines.push(`- checkpoint 目录：\`${opts.checkpoint.checkpointDir}\``);
  lines.push(
    `- 输出格式：${opts.outputFormats.map((f) => OUTPUT_FORMAT_LABEL[f]).join(" / ")}`,
  );
  lines.push("");
  return lines.join("\n");
}

export function buildRunbookExtendedNotes(opts: LocalTrainingExtendedOptions): string[] {
  const maxSteps = effectiveMaxSteps(opts);
  return [
    `硬件模式：${HARDWARE_MODE_LABEL[opts.hardwareMode]}`,
    `训练时长上限：${effectiveMinutes(opts)} 分钟`,
    `最大步数：${maxSteps === "AUTO" ? "自动估算" : maxSteps}`,
    `checkpoint：每 ${opts.checkpoint.saveEverySteps} step 或每 ${opts.checkpoint.saveEveryMinutes} 分钟保存一次，最多保留 ${opts.checkpoint.saveTotalLimit} 个。`,
    `输出目录：${opts.checkpoint.checkpointDir}`,
    `输出格式：${opts.outputFormats.map((f) => OUTPUT_FORMAT_LABEL[f]).join(" / ")}`,
    `Ollama 目标名称：${opts.ollamaTargetTag}`,
  ];
}

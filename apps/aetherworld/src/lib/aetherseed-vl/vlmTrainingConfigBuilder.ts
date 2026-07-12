// AetherSeed-VL 训练配置 / 脚本生成（不执行，仅生成文本）
import type { VlmTrainingConfig, VlmTrainingMethod } from "./vlmTypes";

export interface VlmTrainingPreset {
  id: string;
  label: string;
  description: string;
  config: Partial<VlmTrainingConfig>;
}

export const VLM_PRESETS: VlmTrainingPreset[] = [
  {
    id: "VL_SMOKE",
    label: "AetherSeed-VL 冒烟测试",
    description: "极少量图文样本，仅验证训练链路是否通畅。",
    config: {
      trainingMethod: "VLM_SMOKE_RUN",
      imageResolution: 336,
      maxImagePixels: 336 * 336,
      maxTextLength: 512,
      batchSize: 1,
      gradientAccumulation: 1,
      learningRate: 1e-4,
      maxSteps: 20,
      checkpointInterval: 10,
      evalEverySteps: 10,
      saveTotalLimit: 2,
      mixedPrecision: "bf16",
      deviceMode: "CPU",
    },
  },
  {
    id: "VL_UI_UNDERSTANDING",
    label: "AetherSeed-VL UI 截图理解",
    description: "针对 Aetherworld 页面截图微调，LoRA 优先。",
    config: {
      trainingMethod: "VLM_LORA",
      imageResolution: 672,
      maxImagePixels: 672 * 672,
      maxTextLength: 1024,
      batchSize: 2,
      gradientAccumulation: 4,
      learningRate: 2e-4,
      maxSteps: 500,
      checkpointInterval: 100,
      evalEverySteps: 100,
      saveTotalLimit: 3,
      mixedPrecision: "bf16",
      deviceMode: "GPU",
    },
  },
  {
    id: "VL_CHAR_SYMBOL",
    label: "AetherSeed-VL 角色与符号理解",
    description: "用于蓝天机角色图、符号图、结构图的小规模 LoRA。",
    config: {
      trainingMethod: "VLM_LORA",
      imageResolution: 448,
      maxImagePixels: 448 * 448,
      maxTextLength: 768,
      batchSize: 2,
      gradientAccumulation: 4,
      learningRate: 1.5e-4,
      maxSteps: 300,
      checkpointInterval: 50,
      evalEverySteps: 50,
      saveTotalLimit: 3,
      mixedPrecision: "bf16",
      deviceMode: "GPU",
    },
  },
  {
    id: "VL_FIRST_RUN",
    label: "AetherSeed-VL 正式第一炉",
    description: "使用完整图文数据集进行 LoRA / SFT，时长较长。",
    config: {
      trainingMethod: "VLM_LORA",
      imageResolution: 672,
      maxImagePixels: 672 * 672,
      maxTextLength: 2048,
      batchSize: 4,
      gradientAccumulation: 8,
      learningRate: 1e-4,
      maxSteps: 2000,
      checkpointInterval: 200,
      evalEverySteps: 200,
      saveTotalLimit: 5,
      mixedPrecision: "bf16",
      deviceMode: "GPU",
    },
  },
];

export function buildVlmTrainingConfig(
  presetId: string,
  baseModelId: string,
  datasetVersionId: string,
): VlmTrainingConfig {
  const preset = VLM_PRESETS.find((p) => p.id === presetId) ?? VLM_PRESETS[0];
  const method: VlmTrainingMethod = preset.config.trainingMethod ?? "VLM_LORA";
  return {
    baseModelId,
    visionTower: "auto",
    tokenizer: "auto",
    processor: "auto",
    trainingMethod: method,
    datasetVersionId,
    imageResolution: 448,
    maxImagePixels: 448 * 448,
    maxTextLength: 1024,
    batchSize: 1,
    gradientAccumulation: 1,
    learningRate: 1e-4,
    maxSteps: 100,
    checkpointInterval: 20,
    evalEverySteps: 50,
    saveTotalLimit: 3,
    mixedPrecision: "bf16",
    deviceMode: "CPU",
    outputDir: "./aetherseed_vl_output",
    adapterOutputDir: "./aetherseed_vl_output/adapter",
    logDir: "./aetherseed_vl_output/logs",
    outputAdapterName: "aetherseed-vl-adapter-v0.1",
    outputModelName: "aetherseed-vl-private-v0.1",
    ...preset.config,
  };
}

export interface VlmTrainingBundle {
  config: VlmTrainingConfig;
  files: { path: string; content: string }[];
}

export function buildVlmTrainingBundle(config: VlmTrainingConfig, datasetPath = "./dataset"): VlmTrainingBundle {
  const yaml = [
    "# AetherSeed-VL 训练配置（不会自动执行）",
    `baseModelId: ${config.baseModelId}`,
    `datasetPath: ${datasetPath}`,
    `imageDir: ${datasetPath}/images`,
    `trainingMethod: ${config.trainingMethod}`,
    `outputDir: ${config.outputDir}`,
    `adapterOutputDir: ${config.adapterOutputDir}`,
    `imageResolution: ${config.imageResolution}`,
    `batchSize: ${config.batchSize}`,
    `gradientAccumulation: ${config.gradientAccumulation}`,
    `learningRate: ${config.learningRate}`,
    `maxSteps: ${config.maxSteps}`,
    `checkpointInterval: ${config.checkpointInterval}`,
    `evalEverySteps: ${config.evalEverySteps}`,
    `saveTotalLimit: ${config.saveTotalLimit}`,
    `mixedPrecision: ${config.mixedPrecision}`,
    `deviceMode: ${config.deviceMode}`,
  ].join("\n");

  const trainPy = `"""AetherSeed-VL 训练入口（占位）。
默认使用 LoRA / Adapter，禁止从零训练大型 VLM。
请先准备好 baseModel、processor、本地图片、train_vlm.jsonl。
执行前必须通过 dry-run 与用户确认。
"""

import argparse, json, os, sys

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", required=True)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    print("[AetherSeed-VL] 读取配置:", args.config)
    if args.dry_run:
        print("[AetherSeed-VL] dry-run 模式，不会执行真实训练。")
        sys.exit(0)
    print("[AetherSeed-VL] 训练入口占位：请接入 transformers / peft 实现。")

if __name__ == "__main__":
    main()
`;
  const evalPy = `"""AetherSeed-VL 评测脚本（占位）。"""
import argparse
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", required=True)
    args = parser.parse_args()
    print("[AetherSeed-VL] 评测入口占位:", args.config)
if __name__ == "__main__":
    main()
`;
  const checkEnv = `"""AetherSeed-VL 环境检查。"""
import importlib, sys
needed = ["torch", "transformers", "peft", "PIL"]
missing = []
for m in needed:
    try:
        importlib.import_module(m)
    except Exception:
        missing.append(m)
print("缺失:", missing if missing else "无")
sys.exit(0 if not missing else 1)
`;
  const requirements = `torch
transformers>=4.40
peft>=0.10
accelerate
Pillow
sentencepiece
`;
  const readmeTrain = `# AetherSeed-VL 训练说明

仅生成配置与脚本，**不会**自动执行训练。

执行流程：
1. 在本机准备 Python 环境并安装 \`requirements_vlm.txt\`。
2. 将导出的数据集解压到 \`./dataset\`，并将本地图片放入 \`./dataset/images\`。
3. 运行 \`python check_vlm_env.py\` 验证环境。
4. 运行 \`python train_vlm.py --config vlm_config.yaml --dry-run\` 做 dry-run。
5. 经用户确认后，去掉 \`--dry-run\` 才能真正训练。

默认使用 ${config.trainingMethod}，不进行全参数训练。
`;
  const readmeInfer = `# AetherSeed-VL 推理说明

- 默认走 Transformers 本地推理。
- 是否能直接接 Ollama 取决于底座模型与视觉组件支持，不要假设所有 VLM 都能 Ollama。
- LoRA Adapter 路径：${config.adapterOutputDir}
- 输出模型名：${config.outputModelName}
`;
  const runbook = `# AetherSeed-VL Runbook

- 训练方式：${config.trainingMethod}
- 底座：${config.baseModelId}
- 数据集版本：${config.datasetVersionId}
- 设备模式：${config.deviceMode}
- 最大步数：${config.maxSteps}
- checkpoint 间隔：${config.checkpointInterval}

任何阶段失败请先查看 ${config.logDir}。
`;

  return {
    config,
    files: [
      { path: "vlm_config.yaml", content: yaml },
      { path: "train_vlm.py", content: trainPy },
      { path: "eval_vlm.py", content: evalPy },
      { path: "check_vlm_env.py", content: checkEnv },
      { path: "requirements_vlm.txt", content: requirements },
      { path: "README_vlm_training.md", content: readmeTrain },
      { path: "README_vlm_inference.md", content: readmeInfer },
      { path: "runbook_vlm.md", content: runbook },
    ],
  };
}

// AetherSeed Local Training · 扩展选项 v0.1
// 为 AetherSeed 300M 私有模型第一炉训练提供：
// - 硬件模式
// - 训练时长 / 步数 / 规模
// - checkpoint 设置
// - 输出格式
// - 预设
// 安全边界：仅生成配置 / 不执行训练 / 不上传 / 不下载 / 不绕过用户确认。
import type { LocalTrainingMode, LocalTrainingTarget } from "./localTrainingTypes";

export type HardwareMode =
  | "LOCAL_CPU_SLOW"
  | "LOCAL_GPU"
  | "NIGHTLY_SLOW"
  | "SHORT_TEST"
  | "SERVER_RESERVED";

export const HARDWARE_MODE_LABEL: Record<HardwareMode, string> = {
  LOCAL_CPU_SLOW: "本机 CPU 慢训",
  LOCAL_GPU: "本机 GPU",
  NIGHTLY_SLOW: "夜间慢训",
  SHORT_TEST: "短时测试",
  SERVER_RESERVED: "服务器预留",
};

export const HARDWARE_MODE_HINT: Record<HardwareMode, string> = {
  LOCAL_CPU_SLOW: "最稳，但时间长。",
  LOCAL_GPU: "如果检测到独立 GPU，可选择。",
  NIGHTLY_SLOW: "适合长时间低干预运行。",
  SHORT_TEST: "只跑少量 step 验证。",
  SERVER_RESERVED: "未来接 GPU 服务器。",
};

export type TrainingScale = "SMOKE_SAMPLE" | "DATASET_FULL" | "CUSTOM_SAMPLE_LIMIT";
export const TRAINING_SCALE_LABEL: Record<TrainingScale, string> = {
  SMOKE_SAMPLE: "小样本测试",
  DATASET_FULL: "当前数据集全量",
  CUSTOM_SAMPLE_LIMIT: "自定义样本上限",
};

export type DurationPreset =
  | "TEST_10M"
  | "TEST_1H"
  | "NIGHT_6H"
  | "NIGHT_12H"
  | "LONG_24H"
  | "CUSTOM";

export const DURATION_PRESET_LABEL: Record<DurationPreset, string> = {
  TEST_10M: "10 分钟测试",
  TEST_1H: "1 小时测试",
  NIGHT_6H: "6 小时夜间",
  NIGHT_12H: "12 小时夜间",
  LONG_24H: "24 小时长训",
  CUSTOM: "自定义分钟数",
};

export const DURATION_PRESET_MINUTES: Record<Exclude<DurationPreset, "CUSTOM">, number> = {
  TEST_10M: 10,
  TEST_1H: 60,
  NIGHT_6H: 360,
  NIGHT_12H: 720,
  LONG_24H: 1440,
};

export type StepPreset = "AUTO" | "S_100" | "S_500" | "S_1000" | "CUSTOM";
export const STEP_PRESET_LABEL: Record<StepPreset, string> = {
  AUTO: "自动估算",
  S_100: "100 step",
  S_500: "500 step",
  S_1000: "1000 step",
  CUSTOM: "自定义",
};

export type OutputFormat =
  | "HUGGINGFACE_CHECKPOINT"
  | "SAFETENSORS"
  | "GGUF_RESERVED"
  | "OLLAMA_MODELFILE_RESERVED"
  | "TRAIN_LOG"
  | "EVAL_REPORT";

export const OUTPUT_FORMAT_LABEL: Record<OutputFormat, string> = {
  HUGGINGFACE_CHECKPOINT: "HuggingFace checkpoint",
  SAFETENSORS: "safetensors",
  GGUF_RESERVED: "GGUF 预留",
  OLLAMA_MODELFILE_RESERVED: "Ollama Modelfile 预留",
  TRAIN_LOG: "训练日志",
  EVAL_REPORT: "评测报告",
};

export interface CheckpointSettings {
  saveEverySteps: number;
  saveEveryMinutes: number;
  saveTotalLimit: number;
  resumeAllowed: boolean;
  resumeFromCheckpoint?: string;
  checkpointDir: string;
}

export interface LocalTrainingExtendedOptions {
  hardwareMode: HardwareMode;
  trainingScale: TrainingScale;
  customSampleLimit?: number;
  durationPreset: DurationPreset;
  customMinutes?: number;
  stepPreset: StepPreset;
  customSteps?: number;
  checkpoint: CheckpointSettings;
  outputFormats: OutputFormat[];
  ollamaTargetTag: string;
}

export const DEFAULT_300M_OUTPUTS: OutputFormat[] = [
  "HUGGINGFACE_CHECKPOINT",
  "TRAIN_LOG",
  "EVAL_REPORT",
];

export function defaultCheckpointFor(target: LocalTrainingTarget): CheckpointSettings {
  if (target === "AETHERSEED_300M_PRIVATE") {
    return {
      saveEverySteps: 200,
      saveEveryMinutes: 30,
      saveTotalLimit: 8,
      resumeAllowed: true,
      checkpointDir: "outputs/checkpoints/aetherseed-300m/",
    };
  }
  return {
    saveEverySteps: 500,
    saveEveryMinutes: 60,
    saveTotalLimit: 5,
    resumeAllowed: true,
    checkpointDir: `outputs/checkpoints/${target.toLowerCase()}/`,
  };
}

// ===== 4 个 300M 预设 =====
export type Preset300mId =
  | "PRESET_300M_SMOKE"
  | "PRESET_300M_NIGHTLY"
  | "PRESET_300M_FIRST_RUN"
  | "PRESET_300M_FORMAT";

export interface Preset300mDescriptor {
  id: Preset300mId;
  name: string;
  purpose: string;
  mode: LocalTrainingMode;
  options: LocalTrainingExtendedOptions;
}

export const PRESET_300M_LIST: Preset300mDescriptor[] = [
  {
    id: "PRESET_300M_SMOKE",
    name: "300M 冒烟测试",
    purpose: "验证链路是否能跑通，不追求训练效果。",
    mode: "SFT_TINY",
    options: {
      hardwareMode: "SHORT_TEST",
      trainingScale: "SMOKE_SAMPLE",
      customSampleLimit: 200,
      durationPreset: "TEST_10M",
      stepPreset: "S_100",
      checkpoint: {
        saveEverySteps: 50,
        saveEveryMinutes: 5,
        saveTotalLimit: 4,
        resumeAllowed: true,
        checkpointDir: "outputs/checkpoints/aetherseed-300m-smoke/",
      },
      outputFormats: DEFAULT_300M_OUTPUTS,
      ollamaTargetTag: "aetherseed-300m-smoke",
    },
  },
  {
    id: "PRESET_300M_NIGHTLY",
    name: "300M 夜间慢训",
    purpose: "晚上长时间稳定运行；保守 batch；高频 checkpoint。",
    mode: "CONTINUED_PRETRAIN_PLUS_SFT",
    options: {
      hardwareMode: "NIGHTLY_SLOW",
      trainingScale: "DATASET_FULL",
      durationPreset: "NIGHT_12H",
      stepPreset: "AUTO",
      checkpoint: {
        saveEverySteps: 200,
        saveEveryMinutes: 20,
        saveTotalLimit: 12,
        resumeAllowed: true,
        checkpointDir: "outputs/checkpoints/aetherseed-300m-nightly/",
      },
      outputFormats: DEFAULT_300M_OUTPUTS,
      ollamaTargetTag: "aetherseed-300m-nightly",
    },
  },
  {
    id: "PRESET_300M_FIRST_RUN",
    name: "300M 正式第一炉",
    purpose: "使用当前 v0.1 数据集较完整训练；开启评测与实验账本登记。",
    mode: "CONTINUED_PRETRAIN_PLUS_SFT",
    options: {
      hardwareMode: "NIGHTLY_SLOW",
      trainingScale: "DATASET_FULL",
      durationPreset: "LONG_24H",
      stepPreset: "AUTO",
      checkpoint: {
        saveEverySteps: 200,
        saveEveryMinutes: 15,
        saveTotalLimit: 16,
        resumeAllowed: true,
        checkpointDir: "outputs/checkpoints/aetherseed-300m-first-run/",
      },
      outputFormats: [...DEFAULT_300M_OUTPUTS, "SAFETENSORS"],
      ollamaTargetTag: "aetherseed-300m",
    },
  },
  {
    id: "PRESET_300M_FORMAT",
    name: "300M 格式强化",
    purpose: "强化 JSON / MSL / Lovable Prompt 结构化输出。",
    mode: "FORMAT_TUNING",
    options: {
      hardwareMode: "LOCAL_CPU_SLOW",
      trainingScale: "DATASET_FULL",
      durationPreset: "NIGHT_6H",
      stepPreset: "S_1000",
      checkpoint: {
        saveEverySteps: 250,
        saveEveryMinutes: 20,
        saveTotalLimit: 8,
        resumeAllowed: true,
        checkpointDir: "outputs/checkpoints/aetherseed-300m-format/",
      },
      outputFormats: DEFAULT_300M_OUTPUTS,
      ollamaTargetTag: "aetherseed-300m-format",
    },
  },
];

export function defaultExtendedOptionsFor(target: LocalTrainingTarget): LocalTrainingExtendedOptions {
  if (target === "AETHERSEED_300M_PRIVATE") {
    return PRESET_300M_LIST[0].options;
  }
  return {
    hardwareMode: "SHORT_TEST",
    trainingScale: "SMOKE_SAMPLE",
    durationPreset: "TEST_1H",
    stepPreset: "AUTO",
    checkpoint: defaultCheckpointFor(target),
    outputFormats: ["HUGGINGFACE_CHECKPOINT", "TRAIN_LOG"],
    ollamaTargetTag: target.toLowerCase().replace(/_/g, "-"),
  };
}

export function effectiveMinutes(opts: LocalTrainingExtendedOptions): number {
  if (opts.durationPreset === "CUSTOM") return Math.max(1, opts.customMinutes ?? 30);
  return DURATION_PRESET_MINUTES[opts.durationPreset];
}

export function effectiveMaxSteps(opts: LocalTrainingExtendedOptions): number | "AUTO" {
  if (opts.stepPreset === "AUTO") return "AUTO";
  if (opts.stepPreset === "CUSTOM") return Math.max(10, opts.customSteps ?? 100);
  return { S_100: 100, S_500: 500, S_1000: 1000 }[opts.stepPreset];
}

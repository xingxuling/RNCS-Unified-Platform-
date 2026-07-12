// AetherSeed-VL 数据集导出包构建（生成文件文本，不上传任何数据）
import type { MultimodalTrainingSample } from "./vlmTypes";
import { listVlmSamples } from "./vlmSampleStore";

export type VlmExportFormat = "VLM_CHATML" | "LLAVA_JSON" | "IMAGE_FOLDER_METADATA" | "HF_VISION";

export interface VlmExportFile {
  path: string;
  content: string;
  mimeType: string;
}

export interface VlmExportPackage {
  versionName: string;
  format: VlmExportFormat;
  files: VlmExportFile[];
  imageCount: number;
  sampleCount: number;
  warning: string;
}

function asChatml(s: MultimodalTrainingSample) {
  return {
    id: s.id,
    messages: [
      { role: "system", content: "你是 AetherSeed-VL 私有图文助手。" },
      {
        role: "user",
        content: [
          ...s.images.map((img) => ({ type: "image", path: img.relativePath ?? `images/${img.fileName}` })),
          { type: "text", text: s.instruction },
        ],
      },
      { role: "assistant", content: s.answer },
    ],
    sample_type: s.sampleType,
    tags: s.tags,
  };
}

function asLlava(s: MultimodalTrainingSample) {
  return {
    id: s.id,
    image: s.images.map((img) => img.relativePath ?? `images/${img.fileName}`),
    conversations: [
      { from: "human", value: `<image>\n${s.instruction}` },
      { from: "gpt", value: s.answer },
    ],
  };
}

function asImageFolderMeta(s: MultimodalTrainingSample) {
  return {
    file_name: s.images[0]?.relativePath ?? `images/${s.images[0]?.fileName ?? "missing.png"}`,
    instruction: s.instruction,
    answer: s.answer,
    sample_type: s.sampleType,
  };
}

export function buildVlmExportPackage(
  versionName: string,
  format: VlmExportFormat,
  trainRatio = 0.9,
): VlmExportPackage {
  const all = listVlmSamples().filter((s) => s.safetyStatus !== "BLOCK");
  const cut = Math.max(1, Math.floor(all.length * trainRatio));
  const train = all.slice(0, cut);
  const evalSet = all.slice(cut);

  const files: VlmExportFile[] = [];
  const imageManifest = all.flatMap((s) =>
    s.images.map((img) => ({
      sampleId: s.id,
      file: img.relativePath ?? `images/${img.fileName}`,
      mimeType: img.mimeType,
      sizeBytes: img.sizeBytes,
      safetyStatus: img.safetyStatus,
    })),
  );

  if (format === "VLM_CHATML") {
    files.push({
      path: "train_vlm.jsonl",
      content: train.map((s) => JSON.stringify(asChatml(s))).join("\n"),
      mimeType: "application/jsonl",
    });
    files.push({
      path: "eval_vlm.jsonl",
      content: evalSet.map((s) => JSON.stringify(asChatml(s))).join("\n"),
      mimeType: "application/jsonl",
    });
  } else if (format === "LLAVA_JSON") {
    files.push({
      path: "train_vlm.json",
      content: JSON.stringify(train.map(asLlava), null, 2),
      mimeType: "application/json",
    });
    files.push({
      path: "eval_vlm.json",
      content: JSON.stringify(evalSet.map(asLlava), null, 2),
      mimeType: "application/json",
    });
  } else if (format === "IMAGE_FOLDER_METADATA") {
    files.push({
      path: "metadata.jsonl",
      content: all.map((s) => JSON.stringify(asImageFolderMeta(s))).join("\n"),
      mimeType: "application/jsonl",
    });
  } else {
    files.push({
      path: "dataset.json",
      content: JSON.stringify(
        all.map((s) => ({
          id: s.id,
          images: s.images.map((img) => img.relativePath ?? `images/${img.fileName}`),
          text: s.instruction,
          answer: s.answer,
        })),
        null,
        2,
      ),
      mimeType: "application/json",
    });
  }

  files.push({
    path: "multimodal_manifest.json",
    content: JSON.stringify(
      {
        version: versionName,
        format,
        sampleCount: all.length,
        trainCount: train.length,
        evalCount: evalSet.length,
        targetModel: "AETHERSEED_VL_PRIVATE",
      },
      null,
      2,
    ),
    mimeType: "application/json",
  });
  files.push({
    path: "image_manifest.json",
    content: JSON.stringify(imageManifest, null, 2),
    mimeType: "application/json",
  });
  files.push({
    path: "safety_report.json",
    content: JSON.stringify(
      {
        total: all.length,
        warn: all.filter((s) => s.safetyStatus === "WARN").length,
        pass: all.filter((s) => s.safetyStatus === "PASS").length,
        blockExcluded: listVlmSamples().filter((s) => s.safetyStatus === "BLOCK").length,
      },
      null,
      2,
    ),
    mimeType: "application/json",
  });
  files.push({
    path: "license_manifest.json",
    content: JSON.stringify(
      all.map((s) => ({ id: s.id, license: s.licenseStatus })),
      null,
      2,
    ),
    mimeType: "application/json",
  });
  files.push({
    path: "README_AETHERSEED_VL_DATASET.md",
    content: [
      `# ${versionName}`,
      "",
      "AetherSeed-VL 私有图文数据集导出包。",
      "",
      "- 格式：" + format,
      "- 样本数：" + all.length,
      "- 训练 / 评测：" + train.length + " / " + evalSet.length,
      "- 图片数：" + imageManifest.length,
      "",
      "## 安全边界",
      "",
      "- 仅限本地训练使用，不得上传至外部服务。",
      "- BLOCK 样本已自动剔除。",
      "- 训练前请人工抽样复核。",
    ].join("\n"),
    mimeType: "text/markdown",
  });

  return {
    versionName,
    format,
    files,
    imageCount: imageManifest.length,
    sampleCount: all.length,
    warning: "本导出包不包含真实图片字节。请将本地图片放入 images/ 目录后再启动训练。",
  };
}

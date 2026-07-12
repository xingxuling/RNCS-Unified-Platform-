// User Asset Upload · 类型识别
import {
  USER_ASSET_TYPE_TO_PACKAGE_TYPE,
  type UserUploadedAssetType,
} from "./userAssetUploadTypes";
import { getExtension } from "./userAssetSafetyPolicy";

interface ClassifyContext {
  fileName: string;
  preview?: string;
  innerFileNames?: string[];
}

function lower(s?: string): string {
  return (s ?? "").toLowerCase();
}

/** 根据文件名 + 预览文本启发式识别用户资产类型 */
export function classifyUserAsset(ctx: ClassifyContext): UserUploadedAssetType {
  const name = lower(ctx.fileName);
  const preview = lower(ctx.preview);
  const ext = getExtension(ctx.fileName);

  // 显式命名
  if (/lovable[_-]?prompt|lovable.*prompt/.test(name)) return "LOVABLE_PROMPT_PACK";
  if (/world[_-]?pack|world[_-]?setting|世界设定|世界包/.test(name) || /world setting|世界设定/.test(preview)) return "WORLD_PACKAGE";
  if (/character|角色|persona/.test(name)) return "CHARACTER_PACKAGE";
  if (/music|suno|udio|歌曲|音乐/.test(name)) return "MUSIC_PROMPT_PACK";
  if (/agent|智能体/.test(name) && (ext === "json" || ext === "jsonl")) return "AGENT_CONFIG_PACK";
  if (/workflow|工作流|pipeline/.test(name)) return "WORKFLOW_PACK";
  if (/eval|评测/.test(name)) return "EVAL_DATASET_PACK";
  if (/dataset|sft|chatml|alpaca|train\.jsonl/.test(name)) return "DATASET_PACK";
  if (/train(ing)?[_-]?pack|train(ing)?[_-]?bundle|训练包/.test(name)) return "TRAINING_PACKAGE";
  if (/enterprise|企业|方案|solution/.test(name)) return "ENTERPRISE_DOCUMENT";
  if (/method|方法|sop|playbook/.test(name)) return "METHOD_PACKAGE";
  if (/course|课程|lesson/.test(name)) return "COURSE_MATERIAL";
  if (/prompt|提示词/.test(name)) return "PROMPT_PACK";

  // 按扩展名兜底
  switch (ext) {
    case "md":
    case "txt":
      if (/^you are |你是一名|你是一位|act as /i.test(preview)) return "PROMPT_PACK";
      return "PROMPT_PACK";
    case "json":
      if (/"messages"|"role"\s*:\s*"system"/.test(preview)) return "PROMPT_PACK";
      if (/"workflow"|"steps"\s*:/.test(preview)) return "WORKFLOW_PACK";
      if (/"agent"|"tools"\s*:/.test(preview)) return "AGENT_CONFIG_PACK";
      if (/"instruction"|"input"|"output"/.test(preview)) return "DATASET_PACK";
      return "CREATOR_ASSET";
    case "jsonl":
    case "csv":
      return "DATASET_PACK";
    case "ts":
    case "tsx":
    case "js":
    case "jsx":
    case "py":
      return "CODE_TEMPLATE";
    case "html":
    case "css":
      return "UI_TEMPLATE";
    case "pdf":
    case "docx":
      return "ENTERPRISE_DOCUMENT";
    case "png":
    case "jpg":
    case "jpeg":
    case "webp":
    case "svg":
    case "mp3":
    case "wav":
      return "CREATOR_ASSET";
    case "zip":
      if (ctx.innerFileNames?.some((n) => /train(ing)?|dataset|checkpoint/i.test(n))) return "TRAINING_PACKAGE";
      if (ctx.innerFileNames?.some((n) => /prompt/i.test(n))) return "PROMPT_PACK";
      return "CREATOR_ASSET";
    default:
      return "UNKNOWN";
  }
}

export function packageTypeFor(t: UserUploadedAssetType) {
  return USER_ASSET_TYPE_TO_PACKAGE_TYPE[t];
}

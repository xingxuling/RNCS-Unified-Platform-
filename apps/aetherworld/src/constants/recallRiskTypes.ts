export interface RecallRiskType {
  id: string;
  label: string;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
}

export const RECALL_RISK_TYPES: RecallRiskType[] = [
  { id: "MEDIA_CONTAMINATION", label: "影视/动漫/小说污染", description: "近期接触作品的图像渗入记忆。", severity: "HIGH" },
  { id: "AI_IMAGE_CONTAMINATION", label: "AI 生成图像污染", description: "AI 内容反复曝光后的图像残留。", severity: "MEDIUM" },
  { id: "SOCIAL_MEDIA", label: "社交媒体内容", description: "短视频/帖子持续输入的象征。", severity: "MEDIUM" },
  { id: "CHILDHOOD_MEMORY", label: "童年记忆碎片", description: "被遗忘的真实经历重新激活。", severity: "LOW" },
  { id: "HISTORY_KNOWLEDGE", label: "历史知识片段", description: "学过的知识被情绪重新着色。", severity: "LOW" },
  { id: "EMOTIONAL_PROJECTION", label: "情绪投射", description: "强情绪将一般记忆神圣化。", severity: "MEDIUM" },
  { id: "WISH_PROJECTION", label: "愿望投射", description: "希望自己是某种身份。", severity: "HIGH" },
  { id: "FEAR_PROJECTION", label: "恐惧投射", description: "恐惧具象成画面。", severity: "MEDIUM" },
  { id: "SELF_MYTHIFICATION", label: "过度自我神话化", description: "把日常体验解读为命定。", severity: "HIGH" },
  { id: "SLEEP_STRESS", label: "睡眠不足或压力", description: "生理状态扭曲感知。", severity: "MEDIUM" },
];

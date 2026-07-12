export interface FirstUseQaCheck { id: string; label: string; passed: boolean; }

export function runFirstUseQa(input: {
  guideShown: boolean;
  hasWebLlmCard: boolean;
  hasWebLcmCard: boolean;
  hasWebLkmCard: boolean;
  canSkipToRuleMode: boolean;
  chineseTitles: boolean;
  noCommercialApi: boolean;
  privacyNoticeShown: boolean;
}): FirstUseQaCheck[] {
  return [
    { id: "guide-shown", label: "首次进入展示引导", passed: input.guideShown },
    { id: "webllm-card", label: "包含语言模型 WebLLM 卡片", passed: input.hasWebLlmCard },
    { id: "weblcm-card", label: "包含概念模型 WebLCM 卡片", passed: input.hasWebLcmCard },
    { id: "weblkm-card", label: "包含知识模型 WebLKM 卡片", passed: input.hasWebLkmCard },
    { id: "rule-mode", label: "可跳过进入规则模式", passed: input.canSkipToRuleMode },
    { id: "chinese-titles", label: "主标题中文化", passed: input.chineseTitles },
    { id: "no-commercial-api", label: "不依赖商业 API", passed: input.noCommercialApi },
    { id: "privacy-notice", label: "显示隐私与安全说明", passed: input.privacyNoticeShown },
  ];
}

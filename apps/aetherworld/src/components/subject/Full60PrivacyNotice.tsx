import { FULL60_PRIVACY_NOTICE } from "@/constants/subject/subjectPrivacyRules";

export function Full60PrivacyNotice() {
  return (
    <div className="rounded-md border border-purple-500/30 bg-purple-500/5 p-3 text-xs text-purple-200">
      <div className="font-medium mb-1">Full60 隐私提示</div>
      <p>{FULL60_PRIVACY_NOTICE}</p>
    </div>
  );
}

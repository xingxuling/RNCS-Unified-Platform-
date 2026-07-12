import { WEBXXM_STATUS_LABEL, WEBXXM_STATUS_TONE, type WebXXMPackageStatusId } from "@/constants/webxxm-store/webXXMPackageStatuses";

export function WebXXMPackageStatusBadge({ status }: { status: WebXXMPackageStatusId }) {
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded border border-border/50 ${WEBXXM_STATUS_TONE[status]}`}>
      {WEBXXM_STATUS_LABEL[status]}
    </span>
  );
}

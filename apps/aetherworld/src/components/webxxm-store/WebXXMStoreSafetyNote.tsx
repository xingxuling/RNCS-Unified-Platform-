export function WebXXMStoreSafetyNote() {
  return (
    <div className="aether-card p-3 text-[11px] text-muted-foreground">
      WebXXM 能力包必须经过安全检查与 QA。CRITICAL 风险将被自动 BLOCK，HIGH 需 Founder 审批。
      只有 ENABLED 的能力包才能被 Sequence AI、Runtime Spine、WebCapabilityRouter 调用。
    </div>
  );
}

import { APP_RUNTIME_SAFETY_FOOTER } from "@/lib/app-runtime/appRuntimeSafetyGuard";

export function AppRuntimeSafetyNote() {
  return (
    <div className="border border-amber-700/40 bg-amber-900/10 rounded p-3 text-[11px] text-amber-200/80 leading-relaxed">
      {APP_RUNTIME_SAFETY_FOOTER}
    </div>
  );
}

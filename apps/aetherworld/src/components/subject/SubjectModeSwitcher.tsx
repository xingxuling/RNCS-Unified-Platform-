import { useEffect, useState } from "react";
import { SUBJECT_MODE_LIST, SUBJECT_MODES, type SubjectModeId } from "@/constants/subject/subjectModes";
import {
  resolveActiveMode,
  switchSubjectMode,
} from "@/lib/subject/activeSubjectModeResolver";

function notifyChange() {
  window.dispatchEvent(new Event("aether:subject-mode-changed"));
}

export function SubjectModeSwitcher() {
  const [resolution, setResolution] = useState(() => resolveActiveMode());

  useEffect(() => {
    setResolution(resolveActiveMode());
  }, []);

  const handleSwitch = (id: SubjectModeId) => {
    const next = switchSubjectMode(id);
    setResolution(next);
    notifyChange();
  };

  return (
    <div className="space-y-3">
      <div className="text-sm text-muted-foreground">
        当前模式：<span className="text-foreground font-medium">{SUBJECT_MODES[resolution.resolvedMode].label}</span>
        <span className="ml-2 text-xs">（{resolution.reason}）</span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {SUBJECT_MODE_LIST.map((m) => {
          const active = resolution.resolvedMode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => handleSwitch(m.id)}
              className={`text-left rounded-lg border p-3 transition ${
                active ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{m.label}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] ${m.badgeClass}`}>{m.shortLabel}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{m.description}</p>
            </button>
          );
        })}
      </div>
      {resolution.warnings.length > 0 && (
        <ul className="text-xs text-yellow-300 space-y-1">
          {resolution.warnings.map((w, i) => (
            <li key={i}>• {w}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

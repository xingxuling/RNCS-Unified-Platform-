import { getStoredMode, getProfileStatus, setStoredMode } from "./subjectProfileStore";

/**
 * Migrate legacy installs that defaulted to DEMO even when real subject data
 * is already present. Runs once on app boot.
 */
export function runSubjectModeMigration() {
  if (typeof window === "undefined") return;
  const stored = getStoredMode();
  const status = getProfileStatus();

  if (!stored) {
    if (status.hasFull60) setStoredMode("FULL_60");
    else if (status.hasLight20) setStoredMode("LIGHT_20");
    else setStoredMode("DEMO");
    return;
  }

  if (stored === "DEMO" && (status.hasLight20 || status.hasFull60)) {
    setStoredMode(status.hasFull60 ? "FULL_60" : "LIGHT_20");
  }
}

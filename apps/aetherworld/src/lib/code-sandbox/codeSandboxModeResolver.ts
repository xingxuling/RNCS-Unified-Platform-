import type { CodeSandboxMode } from "@/constants/code-sandbox/codeSandboxModes";
import type { AppProjectObject } from "@/lib/app-runtime/appProjectObjectEngine";

export function resolveSandboxMode(project: AppProjectObject, requested?: CodeSandboxMode): CodeSandboxMode {
  if (requested && requested !== "FUTURE_REAL_SANDBOX") return requested;
  const hasHtml = project.codeFiles.some((f) => f.path.endsWith("index.html"));
  const hasReact = project.codeFiles.some((f) => f.path.endsWith(".tsx") || f.path.endsWith(".jsx"));
  if (hasHtml && !hasReact) return "STATIC_HTML_RUNNER";
  if (hasReact) return "SIMULATED_BUILD_RUNNER";
  return "STATIC_HTML_RUNNER";
}

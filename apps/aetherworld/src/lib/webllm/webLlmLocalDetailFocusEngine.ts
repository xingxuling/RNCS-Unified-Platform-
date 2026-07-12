export interface LocalDetailReport {
  status: "PASS" | "WARN" | "FAIL";
  missingFields: string[];
  inconsistencies: string[];
  vaguePhrases: string[];
}

const VAGUE = ["很多", "一些", "大概", "也许", "可能吧", "差不多"];

export function checkLocalDetail(output: string, requiredFields: string[] = []): LocalDetailReport {
  const missing = requiredFields.filter((f) => !output.includes(f));
  const vague = VAGUE.filter((v) => output.includes(v));
  const incons: string[] = [];
  // simple check: route names should start with "/"
  const m = output.match(/\b[a-zA-Z][a-zA-Z0-9_-]+\.tsx?\b/g);
  if (m && new Set(m).size !== m.length) incons.push("文件名出现重复，可能不一致。");
  const status: LocalDetailReport["status"] = missing.length >= 2 ? "FAIL" : (missing.length || vague.length) ? "WARN" : "PASS";
  return { status, missingFields: missing, inconsistencies: incons, vaguePhrases: vague };
}

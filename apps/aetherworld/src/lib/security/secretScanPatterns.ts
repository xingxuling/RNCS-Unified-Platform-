// 高置信 / 疑似密钥扫描规则
// confidence: HIGH 代表强匹配，必须 BLOCK；MEDIUM 代表疑似，WARN。

export interface SecretPattern {
  id: string;
  label: string;
  pattern: RegExp;
  confidence: "HIGH" | "MEDIUM";
}

export const SECRET_PATTERNS: SecretPattern[] = [
  // 高置信：常见服务商前缀
  { id: "OPENAI_SK", label: "OpenAI sk-key", pattern: /\bsk-[A-Za-z0-9_-]{20,}\b/g, confidence: "HIGH" },
  { id: "ANTHROPIC", label: "Anthropic key", pattern: /\bsk-ant-[A-Za-z0-9_-]{20,}\b/g, confidence: "HIGH" },
  { id: "GITHUB_PAT", label: "GitHub PAT", pattern: /\bghp_[A-Za-z0-9]{30,}\b/g, confidence: "HIGH" },
  { id: "GITLAB_PAT", label: "GitLab PAT", pattern: /\bglpat-[A-Za-z0-9_-]{20,}\b/g, confidence: "HIGH" },
  { id: "HF_TOKEN", label: "HuggingFace token", pattern: /\bhf_[A-Za-z0-9]{30,}\b/g, confidence: "HIGH" },
  { id: "STRIPE_SK", label: "Stripe secret key", pattern: /\b(sk|rk)_(live|test)_[A-Za-z0-9]{20,}\b/g, confidence: "HIGH" },
  { id: "RESEND", label: "Resend key", pattern: /\bre_[A-Za-z0-9]{20,}\b/g, confidence: "HIGH" },
  { id: "BEARER", label: "Bearer token", pattern: /\bBearer\s+[A-Za-z0-9\-._~+/]{20,}=*/g, confidence: "HIGH" },
  { id: "JWT", label: "JWT token", pattern: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g, confidence: "HIGH" },

  // 疑似：key=value 形式
  { id: "KV_APIKEY", label: "apiKey=...", pattern: /\b(api[_-]?key|access[_-]?token|refresh[_-]?token|secret|password)\s*[:=]\s*["']?[A-Za-z0-9_\-./+=]{12,}["']?/gi, confidence: "MEDIUM" },
  { id: "ENV_KEY", label: "环境变量密钥", pattern: /\b(OPENAI_API_KEY|ANTHROPIC_API_KEY|GEMINI_API_KEY|SUPABASE_SERVICE_ROLE_KEY|STRIPE_SECRET_KEY|RESEND_API_KEY)\b\s*[:=]\s*["']?[A-Za-z0-9_\-./+=]{8,}["']?/g, confidence: "MEDIUM" },
];

export type SecretScanLevel = "PASS" | "WARN" | "BLOCK";

export interface SecretScanHit {
  id: string;
  label: string;
  confidence: "HIGH" | "MEDIUM";
  sample: string; // 已脱敏
}

export interface SecretScanReport {
  level: SecretScanLevel;
  hits: SecretScanHit[];
}

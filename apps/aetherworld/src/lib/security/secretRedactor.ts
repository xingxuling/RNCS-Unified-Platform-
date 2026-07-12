// 统一脱敏工具
// 把敏感字符串渲染为 sk-****7890 / Bearer ****mnop 形式

export function maskSecret(raw: string): string {
  if (!raw) return raw;
  const trimmed = raw.trim();
  if (trimmed.length <= 8) return "****";
  const tail = trimmed.slice(-4);
  const prefixMatch = trimmed.match(/^(sk-ant-|sk-|ghp_|glpat-|hf_|re_|Bearer\s+|eyJ)/i);
  const prefix = prefixMatch ? prefixMatch[0] : trimmed.slice(0, Math.min(4, trimmed.length - 4));
  return `${prefix}****${tail}`;
}

export function redactText(text: string): string {
  if (!text) return text;
  let out = text;
  // 顺序较敏感 → 较泛
  const replacements: Array<{ pattern: RegExp; render: (m: string) => string }> = [
    { pattern: /\bsk-ant-[A-Za-z0-9_-]{20,}\b/g, render: maskSecret },
    { pattern: /\bsk-[A-Za-z0-9_-]{20,}\b/g, render: maskSecret },
    { pattern: /\bghp_[A-Za-z0-9]{30,}\b/g, render: maskSecret },
    { pattern: /\bglpat-[A-Za-z0-9_-]{20,}\b/g, render: maskSecret },
    { pattern: /\bhf_[A-Za-z0-9]{30,}\b/g, render: maskSecret },
    { pattern: /\b(sk|rk)_(live|test)_[A-Za-z0-9]{20,}\b/g, render: maskSecret },
    { pattern: /\bre_[A-Za-z0-9]{20,}\b/g, render: maskSecret },
    { pattern: /\bBearer\s+[A-Za-z0-9\-._~+/]{20,}=*/g, render: (m) => `Bearer ${maskSecret(m.replace(/^Bearer\s+/i, ""))}` },
    { pattern: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g, render: maskSecret },
    {
      pattern: /\b(api[_-]?key|access[_-]?token|refresh[_-]?token|secret|password)(\s*[:=]\s*["']?)([A-Za-z0-9_\-./+=]{12,})(["']?)/gi,
      render: (m) => m.replace(/([A-Za-z0-9_\-./+=]{12,})/, (g) => maskSecret(g)),
    },
  ];
  for (const r of replacements) out = out.replace(r.pattern, (m) => r.render(m));
  return out;
}

export function redactObject<T>(input: T): T {
  if (input == null) return input;
  if (typeof input === "string") return redactText(input) as unknown as T;
  if (Array.isArray(input)) return input.map(redactObject) as unknown as T;
  if (typeof input === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
      const sensitiveKey = /api[_-]?key|secret|token|password|bearer/i.test(k);
      if (sensitiveKey && typeof v === "string") {
        out[k] = maskSecret(v);
      } else {
        out[k] = redactObject(v);
      }
    }
    return out as T;
  }
  return input;
}

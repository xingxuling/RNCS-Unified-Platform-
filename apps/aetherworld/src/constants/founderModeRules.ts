// Founder Mode rule constants — single source of truth for guard policy.

export const FOUNDER_MODE_RULES = {
  STORAGE_KEY_SECURITY: "founderSecurityState",
  STORAGE_KEY_SESSION: "founderSession",
  STORAGE_KEY_AUDIT: "founderAuditLog",

  DEFAULT_SESSION_HOURS: 2,
  SESSION_DURATION_OPTIONS: [
    { id: "30m",      label: "30 分钟", hours: 0.5 },
    { id: "2h",       label: "2 小时",  hours: 2 },
    { id: "12h",      label: "12 小时", hours: 12 },
    { id: "browser",  label: "仅本次浏览", hours: 0 }, // 0 = until browser close (sessionStorage fallback handled elsewhere)
  ],

  MIN_PASSPHRASE_LENGTH: 6,
  MAX_PASSPHRASE_LENGTH: 128,
  PBKDF2_ITERATIONS: 120_000,

  // Public surfaces — always visible to standard users
  PUBLIC_ROUTES: [
    "/", "/onboarding", "/calendar", "/subject",
    "/prediction-dimensions", "/event-algorithms",
    "/feedback", "/docs", "/usage-safety", "/prompt-forge",
  ],

  // Founder-only routes — must pass Founder Gate
  FOUNDER_ROUTES: [
    "/founder", "/founder-console", "/founder-permissions",
  ],

  WARNING_LOCAL_ONLY:
    "当前为本地保护，不等同于服务器账户安全。请不要在共享设备上保存创始人模式。",
} as const;

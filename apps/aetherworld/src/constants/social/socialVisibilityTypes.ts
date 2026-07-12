export const SOCIAL_VISIBILITY_TYPES = {
  PRIVATE: { id: "PRIVATE", label: "仅自己", description: "仅自己可见，不进入任何动态。" },
  UNLISTED: { id: "UNLISTED", label: "凭链接", description: "知道链接的人可见，不会出现在公共动态。" },
  PUBLIC: { id: "PUBLIC", label: "公开", description: "进入公共动态，所有用户可见。" },
  FOUNDER_ONLY: { id: "FOUNDER_ONLY", label: "Founder 专属", description: "仅 Founder 或被授权账号可见。" },
} as const;

export type SocialVisibility = keyof typeof SOCIAL_VISIBILITY_TYPES;
export const SOCIAL_VISIBILITY_LIST = Object.values(SOCIAL_VISIBILITY_TYPES);
export const DEFAULT_SOCIAL_VISIBILITY: SocialVisibility = "PRIVATE";

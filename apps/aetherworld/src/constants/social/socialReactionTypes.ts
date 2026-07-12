export const SOCIAL_REACTION_TYPES = {
  LIKE: { id: "LIKE", label: "喜欢", emoji: "👍" },
  SAVE: { id: "SAVE", label: "收藏", emoji: "⭐" },
  INSPIRE: { id: "INSPIRE", label: "受启发", emoji: "✨" },
  USEFUL: { id: "USEFUL", label: "有用", emoji: "💡" },
} as const;

export type SocialReactionType = keyof typeof SOCIAL_REACTION_TYPES;
export const SOCIAL_REACTION_LIST = Object.values(SOCIAL_REACTION_TYPES);

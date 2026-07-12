// Lightweight localStorage store with backend adapter seam.
import type {
  SocialProfile,
  SocialPost,
  SocialReaction,
  SocialComment,
  SocialCollection,
} from "./socialTypes";

const KEYS = {
  profiles: "aether.social.profiles",
  posts: "aether.social.posts",
  reactions: "aether.social.reactions",
  comments: "aether.social.comments",
  collections: "aether.social.collections",
  follows: "aether.social.follows",
  settings: "aether.social.settings",
} as const;

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent("aether-social:change", { detail: { key } }));
  } catch {}
}

export const socialStorage = {
  getProfiles: () => read<SocialProfile[]>(KEYS.profiles, []),
  setProfiles: (v: SocialProfile[]) => write(KEYS.profiles, v),
  getPosts: () => read<SocialPost[]>(KEYS.posts, []),
  setPosts: (v: SocialPost[]) => write(KEYS.posts, v),
  getReactions: () => read<SocialReaction[]>(KEYS.reactions, []),
  setReactions: (v: SocialReaction[]) => write(KEYS.reactions, v),
  getComments: () => read<SocialComment[]>(KEYS.comments, []),
  setComments: (v: SocialComment[]) => write(KEYS.comments, v),
  getCollections: () => read<SocialCollection[]>(KEYS.collections, []),
  setCollections: (v: SocialCollection[]) => write(KEYS.collections, v),
  getSettings: () => read<{ publicFeedEnabled: boolean }>(KEYS.settings, { publicFeedEnabled: false }),
  setSettings: (v: { publicFeedEnabled: boolean }) => write(KEYS.settings, v),
  subscribe: (cb: () => void) => {
    if (typeof window === "undefined") return () => {};
    const handler = () => cb();
    window.addEventListener("aether-social:change", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("aether-social:change", handler);
      window.removeEventListener("storage", handler);
    };
  },
};

export function newId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function nowIso() {
  return new Date().toISOString();
}

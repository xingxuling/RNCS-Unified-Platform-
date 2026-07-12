// MSL 状态帧 —— 轻量内存 + LocalStorage 持久化
// 容量受限，仅保留最近 N 条，供 System / Audit 查看。
import type { MSLStateFrame } from "./mslStateTypes";

const STORAGE_KEY = "aether.msl.state.frames.v1";
const MAX_FRAMES = 200;

let memoryCache: MSLStateFrame[] | null = null;

function load(): MSLStateFrame[] {
  if (memoryCache) return memoryCache;
  try {
    if (typeof localStorage === "undefined") {
      memoryCache = [];
      return memoryCache;
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    memoryCache = raw ? (JSON.parse(raw) as MSLStateFrame[]) : [];
  } catch {
    memoryCache = [];
  }
  return memoryCache!;
}

function save(frames: MSLStateFrame[]) {
  memoryCache = frames;
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(frames));
    }
  } catch {
    // 配额或环境不支持时静默
  }
}

export function recordMslFrame(frame: MSLStateFrame): MSLStateFrame {
  const frames = load();
  frames.unshift(frame);
  if (frames.length > MAX_FRAMES) frames.length = MAX_FRAMES;
  save(frames);
  return frame;
}

export function listRecentMslFrames(limit = 30): MSLStateFrame[] {
  return load().slice(0, limit);
}

export function listMslFramesBySession(sessionId: string, limit = 50): MSLStateFrame[] {
  return load().filter((f) => f.chatSessionId === sessionId).slice(0, limit);
}

export function clearMslFrames() {
  save([]);
}

// 语义指纹 v0.1：为每条 Chat 回答生成轻量 sequence code。
import type { CalculusId } from "./calculusRouteResultTypes";

export interface ChatSequenceFingerprint {
  messageId: string;
  sequenceCode: string;
  domain: string;
  calculusIds: CalculusId[];
  outputType: string;
  createdAt: string;
}

function hash32(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h.toString(36).toUpperCase().padStart(7, "0");
}

const STORE_KEY = "aether.chat.sequence.fingerprint.v1";

export function buildFingerprint(params: {
  messageId: string;
  text: string;
  domain: string;
  calculusIds: CalculusId[];
  outputType: string;
}): ChatSequenceFingerprint {
  const head = (params.calculusIds[0] ?? "GENERIC").slice(0, 4);
  const code = `SEQ-${head}-${hash32(params.text || params.messageId).slice(0, 6)}`;
  const fp: ChatSequenceFingerprint = {
    messageId: params.messageId,
    sequenceCode: code,
    domain: params.domain,
    calculusIds: params.calculusIds,
    outputType: params.outputType,
    createdAt: new Date().toISOString(),
  };
  if (typeof window !== "undefined") {
    try {
      const arr: ChatSequenceFingerprint[] = JSON.parse(localStorage.getItem(STORE_KEY) || "[]");
      arr.unshift(fp);
      localStorage.setItem(STORE_KEY, JSON.stringify(arr.slice(0, 200)));
    } catch {
      /* noop */
    }
  }
  return fp;
}

export function listFingerprints(): ChatSequenceFingerprint[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || "[]"); } catch { return []; }
}

/**
 * Streaming engine placeholder — reserves a token-by-token API surface for future
 * real WebLLM integration. For now emits the final text in one chunk.
 */
import type { WebLlmRunRequest } from "./webLlmChatEngine";
import { runWebLlmChat } from "./webLlmChatEngine";

export async function* streamWebLlm(req: WebLlmRunRequest): AsyncGenerator<string, void, unknown> {
  const r = await runWebLlmChat({ ...req, stream: true });
  yield r.rawText;
}

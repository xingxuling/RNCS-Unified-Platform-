import type { ChatDisplayResult, ChatResultAction } from "@/lib/chat/chatDisplayResultTypes";

import { ChatTextResult }           from "./ChatTextResult";
import { ChatObjectResultCard }     from "./ChatObjectResultCard";
import { ChatAppResultCard }        from "./ChatAppResultCard";
import { ChatCodeResultCard }       from "./ChatCodeResultCard";
import { ChatPatchResultCard }      from "./ChatPatchResultCard";
import { ChatWorldResultCard }      from "./ChatWorldResultCard";
import { ChatMusicResultCard }      from "./ChatMusicResultCard";
import { ChatConceptResultCard }    from "./ChatConceptResultCard";
import { ChatKnowledgeResultCard }  from "./ChatKnowledgeResultCard";
import { ChatQaResultCard }         from "./ChatQaResultCard";
import { ChatStoreResultCard }      from "./ChatStoreResultCard";
import { ChatSystemResultCard }     from "./ChatSystemResultCard";

interface Props {
  result: ChatDisplayResult;
  onAction?: (action: ChatResultAction, result: ChatDisplayResult) => void;
}

/**
 * 统一的对话结果渲染器：根据 resultType 分派到具体卡片。
 * 这是“对话承接层”的核心入口。
 */
export function ChatDisplayResultRenderer({ result, onAction }: Props) {
  switch (result.resultType) {
    case "TEXT":      return <ChatTextResult         result={result} onAction={onAction} />;
    case "OBJECT":    return <ChatObjectResultCard   result={result} onAction={onAction} />;
    case "APP":       return <ChatAppResultCard      result={result} onAction={onAction} />;
    case "CODE":      return <ChatCodeResultCard     result={result} onAction={onAction} />;
    case "PATCH":     return <ChatPatchResultCard    result={result} onAction={onAction} />;
    case "WORLD":     return <ChatWorldResultCard    result={result} onAction={onAction} />;
    case "MUSIC":     return <ChatMusicResultCard    result={result} onAction={onAction} />;
    case "CONCEPT":   return <ChatConceptResultCard  result={result} onAction={onAction} />;
    case "KNOWLEDGE": return <ChatKnowledgeResultCard result={result} onAction={onAction} />;
    case "QA":        return <ChatQaResultCard       result={result} onAction={onAction} />;
    case "STORE":     return <ChatStoreResultCard    result={result} onAction={onAction} />;
    case "SYSTEM":    return <ChatSystemResultCard   result={result} onAction={onAction} />;
    default:          return <ChatTextResult         result={result} onAction={onAction} />;
  }
}

import type { ChatDisplayResult, ChatResultAction } from "@/lib/chat/chatDisplayResultTypes";
import { ChatResultBaseCard } from "./ChatResultBaseCard";

interface Props {
  result: ChatDisplayResult;
  onAction?: (a: ChatResultAction, r: ChatDisplayResult) => void;
}

interface MusicPreview {
  songTitle?: string;
  genre?: string;
  mood?: string;
  style?: string;
  lyricsPreview?: string;
  sunoPrompt?: string;
}

export function ChatMusicResultCard({ result, onAction }: Props) {
  const p = (result.structuredPreview ?? {}) as MusicPreview;
  return (
    <ChatResultBaseCard result={result} onAction={onAction} accent="violet">
      <div className="text-xs space-y-1.5">
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-muted-foreground">
          {p.songTitle && <span>歌名：<span className="text-foreground/90">{p.songTitle}</span></span>}
          {p.genre && <span>类型：{p.genre}</span>}
          {p.mood && <span>情绪：{p.mood}</span>}
          {p.style && <span>曲风：{p.style}</span>}
        </div>
        {p.lyricsPreview && (
          <div className="rounded border border-border/40 bg-background/40 p-2 whitespace-pre-wrap text-foreground/85 max-h-40 overflow-y-auto">
            {p.lyricsPreview}
          </div>
        )}
        {p.sunoPrompt && (
          <div className="text-[11px] text-muted-foreground truncate">Suno Prompt：{p.sunoPrompt}</div>
        )}
      </div>
    </ChatResultBaseCard>
  );
}

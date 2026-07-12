export interface ComicPanel {
  panelNumber: number;
  visualDescription: string;
  cameraAngle: string;
  characterAction: string;
  dialogue?: string[];
  narration?: string;
  emotion: string;
}

export interface ComicPage {
  pageNumber: number;
  panels: ComicPanel[];
  pageHook?: string;
}

export interface ComicScript {
  episodeTitle: string;
  pageCount: number;
  pages: ComicPage[];
}

export function generateComicScript(input: {
  episodeTitle: string;
  protagonist: string;
  supporting?: string[];
  conflict: string;
  pageCount?: number;
  panelsPerPage?: number;
}): ComicScript {
  const pages = Math.max(1, input.pageCount ?? 4);
  const panelsPerPage = Math.max(3, Math.min(6, input.panelsPerPage ?? 4));
  const out: ComicPage[] = [];
  for (let p = 1; p <= pages; p++) {
    const panels: ComicPanel[] = [];
    for (let i = 1; i <= panelsPerPage; i++) {
      panels.push({
        panelNumber: i,
        visualDescription: i === 1
          ? `远景：${input.protagonist} 站在画面中部，背景给出环境信息`
          : i === panelsPerPage
          ? `特写：${input.protagonist} 的眼神 / 一个关键物件`
          : `中景：${input.protagonist}${input.supporting?.[0] ? ` 与 ${input.supporting[0]}` : ""} 的互动`,
        cameraAngle: i === 1 ? "wide" : i === panelsPerPage ? "close-up" : "medium",
        characterAction: i === 1 ? "进入场景" : i === panelsPerPage ? "做出关键反应" : "推进冲突",
        dialogue: i % 2 === 0 ? [`${input.protagonist}：${input.conflict} 还能再等一次。`] : undefined,
        narration: i === 1 ? `第 ${p} 页 · 与「${input.conflict}」的距离再次缩短` : undefined,
        emotion: i === panelsPerPage ? "决定" : "压抑",
      });
    }
    out.push({ pageNumber: p, panels, pageHook: p === pages ? `${input.protagonist} 在最后一格做出读者必须看下一页的反应` : `下一页将给出更近的代价` });
  }
  return { episodeTitle: input.episodeTitle, pageCount: pages, pages: out };
}

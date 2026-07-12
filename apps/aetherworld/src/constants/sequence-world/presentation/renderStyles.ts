export interface RenderStyleHint {
  digit: string;
  styleName: string;
  paletteBias: string[];
  motifs: string[];
  description: string;
}

export const DIGIT_RENDER_STYLES: Record<string, RenderStyleHint> = {
  "0": { digit: "0", styleName: "虚空封存", paletteBias: ["#05070d", "#0b0f1a"], motifs: ["雾", "黑场", "封存环"], description: "暗场、雾、虚空、低饱和、透明" },
  "1": { digit: "1", styleName: "主权核心", paletteBias: ["#fefce8", "#facc15"], motifs: ["中心光", "锐利构图"], description: "中心光、锐利构图、强方向" },
  "2": { digit: "2", styleName: "关系连接", paletteBias: ["#67e8f9", "#a5f3fc"], motifs: ["连接线", "双环"], description: "连接线、双环、关系节点" },
  "3": { digit: "3", styleName: "信息符号", paletteBias: ["#c084fc", "#f0abfc"], motifs: ["符文", "信息流"], description: "符文、文字粒子、界面流" },
  "4": { digit: "4", styleName: "制度结构", paletteBias: ["#94a3b8", "#475569"], motifs: ["网格", "建筑线"], description: "网格、几何边界、建筑线" },
  "5": { digit: "5", styleName: "风暴显化", paletteBias: ["#22d3ee", "#0ea5e9"], motifs: ["风", "粒子"], description: "风、旋涡、速度线、粒子爆发" },
  "6": { digit: "6", styleName: "生命承载", paletteBias: ["#86efac", "#34d399"], motifs: ["生命纹理", "暖光"], description: "生命纹理、柔和光、恢复感" },
  "7": { digit: "7", styleName: "潜层迷雾", paletteBias: ["#1e293b", "#312e81"], motifs: ["迷雾", "暗纹"], description: "迷雾、暗纹、隐藏层" },
  "8": { digit: "8", styleName: "重力资源", paletteBias: ["#92400e", "#d4af37"], motifs: ["金属", "金色"], description: "金属、金色、重力核心" },
  "9": { digit: "9", styleName: "终局文明", paletteBias: ["#1e1b4b", "#d4af37"], motifs: ["星海", "神殿"], description: "星海、神殿、文明遗迹、终局光环" },
};

export const RENDER_STYLE_PRESETS = [
  "obsidian_aether_gold", "void_silver", "wind_storm", "bio_garden", "archive_dust", "civilization_halo",
];

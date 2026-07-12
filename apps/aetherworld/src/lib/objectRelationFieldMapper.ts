export interface RelationField {
  relatedObjects: string[];
  supporters: string[];
  blockers: string[];
  dependencies: string[];
  competitors: string[];
  amplificationLinks: string[];
  conflictLinks: string[];
}

export function mapRelationField(input: { description: string }): RelationField {
  const t = input.description || "";
  const grab = (re: RegExp) => (t.match(re) || []).map(s => s.trim()).slice(0, 5);
  return {
    relatedObjects: grab(/(?:相关|涉及|关联)[^。；\n]{0,30}/g),
    supporters:     grab(/(?:支持|帮助|促进|推动)[^。；\n]{0,30}/g),
    blockers:       grab(/(?:阻碍|阻力|阻止|拖累|障碍)[^。；\n]{0,30}/g),
    dependencies:   grab(/(?:依赖|需要|前提)[^。；\n]{0,30}/g),
    competitors:    grab(/(?:竞争|对手|替代)[^。；\n]{0,30}/g),
    amplificationLinks: grab(/(?:放大|加强|协同)[^。；\n]{0,30}/g),
    conflictLinks:      grab(/(?:冲突|矛盾)[^。；\n]{0,30}/g),
  };
}

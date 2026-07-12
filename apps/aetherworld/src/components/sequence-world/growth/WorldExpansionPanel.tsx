import { WorldRuleEvolutionPanel } from "./WorldRuleEvolutionPanel";
export function WorldExpansionPanel() {
  return (
    <div className="text-sm text-muted-foreground p-4">
      请在 <strong>世界生长</strong> 页面运行扩张操作（Expand Zone / Create NPC / Generate Quest Chain）。
    </div>
  );
}
export function WorldMutationPanel() {
  return (
    <div className="text-sm text-muted-foreground p-4">
      变异操作请在 <strong>世界生长</strong> 页面使用 Creative 模式触发。
    </div>
  );
}
export { WorldRuleEvolutionPanel };

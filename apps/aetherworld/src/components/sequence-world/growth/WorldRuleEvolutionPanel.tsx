import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { loadRules, applyRuleEvolution, type WorldRule } from "@/lib/sequence-world/growth/worldRuleEvolutionEngine";
import { WORLD_RULE_TYPES, WORLD_RULE_ACTIONS, type WorldRuleAction, type WorldRuleType } from "@/constants/sequence-world/growth/worldRuleTypes";
import { useFounderState } from "@/hooks/useFounderState";
import { Scale, Lock } from "lucide-react";

export function WorldRuleEvolutionPanel() {
  const { active: isFounder } = useFounderState();
  const [rules, setRules] = useState<WorldRule[]>(loadRules());
  const [name, setName] = useState(""); const [desc, setDesc] = useState("");
  const [ruleType, setRuleType] = useState<WorldRuleType>("NARRATIVE");

  const refresh = () => setRules(loadRules());

  const create = () => {
    applyRuleEvolution({
      action: "CREATE_RULE", worldId: "world-growth-sandbox",
      rule: { name: name || "未命名规则", description: desc, ruleType },
      isFounder,
    });
    setName(""); setDesc(""); refresh();
  };

  const act = (id: string, action: WorldRuleAction) => {
    applyRuleEvolution({ action, worldId: "world-growth-sandbox", ruleId: id, isFounder });
    refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Scale className="size-5 text-primary" />
        <h1 className="text-2xl font-semibold tracking-tight">World Rules · 世界规则</h1>
        <Badge variant="outline">{rules.length}</Badge>
      </div>

      <Card className="p-4 space-y-2">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <Input placeholder="规则名称" value={name} onChange={e => setName(e.target.value)} />
          <Input placeholder="说明" className="md:col-span-2" value={desc} onChange={e => setDesc(e.target.value)} />
          <Select value={ruleType} onValueChange={v => setRuleType(v as WorldRuleType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{WORLD_RULE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <Button onClick={create}>新增规则</Button>
      </Card>

      <div className="grid gap-2">
        {rules.map(r => (
          <Card key={r.ruleId} className="p-3 space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                {r.founderLocked && <Lock className="size-3 text-amber-500" />}
                <span className="font-medium">{r.name}</span>
                <Badge>{r.ruleType}</Badge>
                <Badge variant="outline">{r.version}</Badge>
                {!r.active && <Badge variant="secondary">已废弃</Badge>}
              </div>
              <div className="flex flex-wrap gap-1">
                {WORLD_RULE_ACTIONS.filter(a => a !== "CREATE_RULE").map(a => (
                  <Button key={a} size="sm" variant="ghost" onClick={() => act(r.ruleId, a)}
                    disabled={(a === "FOUNDER_LOCK_RULE" && !isFounder) || (r.founderLocked && !isFounder)}>
                    {a}
                  </Button>
                ))}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{r.description}</p>
          </Card>
        ))}
        {!rules.length && <Card className="p-6 text-sm text-muted-foreground text-center">暂无规则。运行 World Growth 可自动建议规则。</Card>}
      </div>
    </div>
  );
}

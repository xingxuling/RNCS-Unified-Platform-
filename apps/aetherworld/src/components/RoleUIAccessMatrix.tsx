import { CLIENT_PROFILES, MODULES } from "@/constants/clientProfiles";
import { getRoleRule } from "@/constants/roleBasedUIRules";

const MODULE_LABEL: Record<string, string> = {
  [MODULES.HOME]: "主控台",
  [MODULES.SUBJECT]: "主体模型",
  [MODULES.REAL_SUBJECT]: "真实主体",
  [MODULES.CALENDAR]: "触发日历",
  [MODULES.TIMELINE]: "时间线",
  [MODULES.ADVANCED_CORE]: "高级内核",
  [MODULES.SIGNAL]: "信号净化",
  [MODULES.RESONANCE]: "共振锁定",
  [MODULES.BRANCH_COLLAPSE]: "分支塌缩",
  [MODULES.VITALITY]: "产品活性",
  [MODULES.GEO]: "地理因素",
  [MODULES.PROMPT_FORGE]: "提示词锻造",
  [MODULES.CONSTANTS]: "常数库",
  [MODULES.FEEDBACK]: "回验中心",
  [MODULES.FEEDBACK_WEIGHTS]: "回验权重",
  [MODULES.ACCURACY]: "预测有效率",
  [MODULES.RECALCULATION]: "重算中心",
  [MODULES.CONSTITUTION]: "系统宪法",
  [MODULES.DOCS]: "产品文档",
  [MODULES.USAGE_SAFETY]: "使用与安全",
  [MODULES.REGIONAL_UX]: "地区体验",
  [MODULES.BETA_LAUNCH]: "内测发布",
  [MODULES.VERSION_ITERATION]: "版本迭代",
  [MODULES.SOFTWARE_QA]: "软件测试",
  [MODULES.UI_FIT]: "UI 适评",
};

const ALL = Object.values(MODULES);

export function RoleUIAccessMatrix() {
  return (
    <div className="aether-card-elevated p-5">
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
        Role × Module Access
      </div>
      <div className="font-display text-lg gold-text mb-3">角色模块权限矩阵</div>

      <div className="overflow-x-auto -mx-2 px-2">
        <table className="w-full text-[11px] border-collapse min-w-[900px]">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th className="p-2 sticky left-0 bg-background/95">模块</th>
              {CLIENT_PROFILES.map(c => (
                <th key={c.id} className="p-2 font-normal text-center" title={c.nameEn}>
                  {c.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ALL.map(m => (
              <tr key={m} className="border-t border-border/40">
                <td className="p-2 sticky left-0 bg-background/95 text-foreground/85">
                  {MODULE_LABEL[m] ?? m}
                  <div className="text-[10px] text-muted-foreground">{m}</div>
                </td>
                {CLIENT_PROFILES.map(c => {
                  const role = getRoleRule(c.id);
                  const shown = role.show.includes(m);
                  const hidden = role.hide.includes(m);
                  return (
                    <td key={c.id} className="p-1.5 text-center">
                      {shown ? (
                        <span className="px-1.5 py-0.5 rounded border border-emerald-500/40 text-emerald-300 text-[10px]">显</span>
                      ) : hidden ? (
                        <span className="px-1.5 py-0.5 rounded border border-rose-500/40 text-rose-300 text-[10px]">隐</span>
                      ) : (
                        <span className="text-muted-foreground/40">·</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

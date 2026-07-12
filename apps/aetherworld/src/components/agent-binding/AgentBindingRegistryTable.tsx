import { Link } from "@tanstack/react-router";
import { listAgentBindings } from "@/lib/agent-binding/agentBindingRegistry";

export function AgentBindingRegistryTable() {
  const list = listAgentBindings();
  return (
    <div className="aether-card overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="bg-muted/30 text-muted-foreground">
          <tr>
            <th className="text-left p-2">Binding</th>
            <th className="text-left p-2">类型</th>
            <th className="text-left p-2">主体</th>
            <th className="text-left p-2">Runtime</th>
            <th className="text-left p-2">自主等级</th>
            <th className="text-left p-2">状态</th>
            <th className="text-left p-2"></th>
          </tr>
        </thead>
        <tbody>
          {list.map((b) => (
            <tr key={b.bindingId} className="border-t border-border/30">
              <td className="p-2 font-medium">{b.agentName}<div className="text-[10px] text-muted-foreground">{b.bindingId}</div></td>
              <td className="p-2">{b.agentType}</td>
              <td className="p-2">{b.personalityBinding.subjectMode}</td>
              <td className="p-2">{b.runtimeBinding.runtimeMode}</td>
              <td className="p-2">{b.autonomyPolicy.autonomyLevel}</td>
              <td className="p-2">{b.status}</td>
              <td className="p-2">
                <Link to="/agent-binding-entry" search={{ id: b.bindingId } as never} className="text-primary text-[11px] hover:underline">详情</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

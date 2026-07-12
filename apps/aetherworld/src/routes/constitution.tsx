import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { useAetherData } from "@/lib/useAetherData";
import { toast } from "sonner";
import { ShieldAlert, Trash2 } from "lucide-react";

export const Route = createFileRoute("/constitution")({ component: Constitution });

function Constitution() {
  const { resetAll } = useAetherData();
  return (
    <>
      <PageHeader
        caption="System Constitution · 系统宪法"
        title="Aether Fate Engine"
        subtitle="预测不是断言未来，而是在当前结构、时间场、变量与行动共同作用下，判断未来分支的开放度。"
      />
      <div className="p-6 md:p-10 max-w-4xl space-y-6">
        <Card title="产品定义" en="Definition">
          <p>本系统是 <strong>Ultimate Prediction OS · 终极预测操作系统</strong>。它整合主体数列、常数体系、时间场、五域断事、抽散触发、回验反馈，输出强触发日、事件类型、行动许可与验证点。</p>
        </Card>

        <Card title="预测原则" en="Principles">
          <ul className="list-disc pl-5 space-y-1.5">
            <li>预测 ≠ 绝对断言未来。</li>
            <li>预测 = 在结构、时间、变量、行动与回验共同作用下，判断分支开放度。</li>
            <li>系统输出可解释、可复现、可回验。</li>
            <li>用户行动会改变结果，回验是系统的一部分。</li>
          </ul>
        </Card>

        <Card title="变量体系" en="Variables">
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>主体数列</strong>：20 组五位数字，对应天/地/人/神/风。</li>
            <li><strong>数字常数</strong>：0–9 携带语义、五域映射与事件倾向。</li>
            <li><strong>乘除算子</strong>：1–10，放大或阻尼触发强度。</li>
            <li><strong>十二长生</strong>：判断当下相位与能量方向。</li>
            <li><strong>日期数字根</strong>、<strong>抽散随机</strong>、<strong>回验权重</strong>共同决定总分。</li>
          </ul>
        </Card>

        <Card title="常数体系（三段式）" en="Constant Phases">
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Phase A · 基础数字常数</strong>：已完整实装。</li>
            <li><strong>Phase B · 结构常数</strong>：河图洛数 / 五行 / 干支 / 十神 / 九宫 / 阴阳 —— 接口与边界已预留。</li>
            <li><strong>Phase C · 物理现实常数</strong>：太阳 / 月相 / 节律 / 共振 / 熵增 / 阈值 / 反馈延迟 —— 接口与边界已预留。</li>
          </ul>
        </Card>

        <Card title="模块结构" en="Modules">
          <p>主体种子核 · 常数宇宙 · 时间场引擎 · 抽散触发引擎 · 五域断事 · 事件解码器 · 行动许可 · 噪声过滤 · 回验进化系统。每个模块都有清晰边界，可独立升级而不破坏底层架构。</p>
        </Card>

        <Card title="不确定性声明" en="Uncertainty">
          <p>本系统不构成医疗、法律、金融、投资或心理诊断建议。输出结果用于结构判断与自我反思，请结合现实情境做最终决策。</p>
        </Card>

        <Card title="隐私原则" en="Privacy">
          <ul className="list-disc pl-5 space-y-1.5">
            <li>所有数据仅存储于浏览器本地 (localStorage)，不上传任何服务器。</li>
            <li>默认演示数据为模拟主体 Demo Persona（Ari Vale · 艾岚），不代表真实人物命运。</li>
            <li>真实用户数据由用户主动输入，UI 中始终与 Demo 区分。</li>
            <li>未来如接入云端，将以可选方式开放，并采用端到端隔离。</li>
          </ul>
        </Card>

        <Card title="安全边界" en="Safety" highlight>
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <p>
              本系统用于结构预测、时间窗口判断、行动辅助与自我回验。<br />
              <strong>不构成</strong>医疗、法律、金融、投资、心理诊断建议。<br />
              预测结果不是绝对未来，而是当前结构下的分支增强与触发窗口判断。
            </p>
          </div>
        </Card>

        <Card title="本地数据管理" en="Local Data">
          <div className="flex items-center gap-3">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (confirm("将清空所有本地主体、回验与设置（Demo 会重新生成）。继续？")) {
                  resetAll();
                  toast.success("已清空本地数据");
                }
              }}
            >
              <Trash2 className="w-4 h-4 mr-1" /> 清空全部本地数据
            </Button>
            <span className="text-xs text-muted-foreground">仅影响当前浏览器，不可恢复。</span>
          </div>
        </Card>
      </div>
    </>
  );
}

function Card({ title, en, children, highlight }: { title: string; en: string; children: React.ReactNode; highlight?: boolean }) {
  return (
    <section className={`aether-card p-6 ${highlight ? "border-primary/40" : ""}`}>
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{en}</div>
      <h2 className="font-display text-xl gold-text mt-0.5">{title}</h2>
      <div className="gold-divider my-3" />
      <div className="text-sm text-muted-foreground leading-relaxed space-y-2">{children}</div>
    </section>
  );
}

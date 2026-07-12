import { useMemo, useState } from "react";
import { SEQUENCE_OBJECT_TYPES, SEQUENCE_OBJECT_TYPE_LABELS, type SequenceObjectType } from "@/constants/sequence-object/sequenceObjectTypes";
import { SEQUENCE_OBJECT_LAYER_LABELS } from "@/constants/sequence-object/sequenceObjectLayers";
import { compileSequenceObject, type CompileObjectResult } from "@/lib/sequence-object/sequenceObjectArchitectureEngine";
import { saveObjectToWorkspace } from "@/lib/sequence-object/sequenceObjectWorkspaceBridge";
import { SequenceObjectSeedPanel } from "./SequenceObjectSeedPanel";
import { SequenceObjectStructurePanel } from "./SequenceObjectStructurePanel";
import { SequenceObjectRuntimeContractPanel } from "./SequenceObjectRuntimeContractPanel";
import { SequenceObjectLifecyclePanel } from "./SequenceObjectLifecyclePanel";
import { SequenceObjectInterfacePanel } from "./SequenceObjectInterfacePanel";
import { SequenceObjectVariableMap } from "./SequenceObjectVariableMap";
import { SequenceObjectPermissionPanel } from "./SequenceObjectPermissionPanel";
import { SequenceObjectQaPanel } from "./SequenceObjectQaPanel";
import { SequenceObjectExportPanel } from "./SequenceObjectExportPanel";
import { SequenceObjectSafetyNote } from "./SequenceObjectSafetyNote";

export function SequenceObjectPanel() {
  const [text, setText] = useState("一个具有 9-4-2-9 跃迁的世界对象：包含治理、文明阶段、世界规则与音乐基调。");
  const [name, setName] = useState("Demo World");
  const [hint, setHint] = useState<SequenceObjectType | "">("");
  const [seqStr, setSeqStr] = useState("9,4,2,9,3,5");
  const [saved, setSaved] = useState<string | null>(null);
  const [result, setResult] = useState<CompileObjectResult | null>(null);

  const seq = useMemo(() => seqStr.split(/[,\s，]+/).map((s) => s.trim()).filter((s) => /^[0-9]$/.test(s)), [seqStr]);

  function handleCompile() {
    const r = compileSequenceObject({
      text,
      objectName: name,
      objectTypeHint: hint || undefined,
      sourceSequence: seq.length ? seq : undefined,
      sourceType: seq.length ? "MOTHER_SEQUENCE" : "USER_INPUT",
      userMode: "ADVANCED",
    });
    setResult(r);
    setSaved(null);
  }

  function handleSave() {
    if (!result) return;
    const rec = saveObjectToWorkspace({
      objectId: result.object.objectId,
      objectType: result.object.objectType,
      title: result.object.objectName,
      summary: result.object.sourceInputSummary ?? "",
      source: result.object.sourceType,
      reusableInEngines: result.object.reusableInEngines,
      lifecyclePhase: "GROWTH",
      privacyLevel: result.object.privacyLevel,
    });
    setSaved(rec.recordId);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-border bg-card/40 p-3 text-sm space-y-2">
        <div className="font-medium">输入 · Input</div>
        <input className="w-full rounded border border-border bg-background px-2 py-1 text-xs" value={name} onChange={(e) => setName(e.target.value)} placeholder="对象名（可选）" />
        <textarea className="w-full rounded border border-border bg-background px-2 py-1 text-xs" rows={3} value={text} onChange={(e) => setText(e.target.value)} />
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <input className="rounded border border-border bg-background px-2 py-1 flex-1 min-w-[180px]" value={seqStr} onChange={(e) => setSeqStr(e.target.value)} placeholder="母体数列（可选）：0-9 用逗号分隔" />
          <select className="rounded border border-border bg-background px-2 py-1" value={hint} onChange={(e) => setHint(e.target.value as SequenceObjectType | "")}>
            <option value="">自动判断类型</option>
            {SEQUENCE_OBJECT_TYPES.map((t) => <option key={t} value={t}>{SEQUENCE_OBJECT_TYPE_LABELS[t]} · {t}</option>)}
          </select>
          <button type="button" onClick={handleCompile} className="rounded bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:opacity-90">编译对象</button>
          {result && <button type="button" onClick={handleSave} className="rounded border border-border px-3 py-1 text-xs hover:bg-muted/40">保存到 Workspace</button>}
          {saved && <span className="text-emerald-400">已保存：{saved}</span>}
        </div>
      </div>

      {result && (
        <>
          <div className="rounded-md border border-border bg-card/40 p-3 text-sm">
            <div className="font-medium">对象 · {result.object.objectName}</div>
            <div className="text-xs text-muted-foreground">
              类型 {result.object.objectType}（{SEQUENCE_OBJECT_TYPE_LABELS[result.object.objectType]}）· 层级 {SEQUENCE_OBJECT_LAYER_LABELS[result.object.objectLayer]} · 置信度 {(result.resolution.confidence * 100).toFixed(0)}%
            </div>
            <div className="mt-1 text-xs text-muted-foreground">解析原因：{result.resolution.reason}</div>
          </div>

          <SequenceObjectSeedPanel seed={result.seed} />
          <SequenceObjectStructurePanel structure={result.structure} />
          <SequenceObjectVariableMap variables={result.object.coreVariables} />
          <SequenceObjectRuntimeContractPanel contract={result.object.runtimeContract} />
          <SequenceObjectInterfacePanel interfaces={result.object.interfaces} />
          <SequenceObjectLifecyclePanel state={result.object.lifecycleState} />
          <SequenceObjectPermissionPanel permission={result.object.permissions} />
          <SequenceObjectQaPanel qa={result.qa} drift={result.drift} />
          <SequenceObjectExportPanel />
        </>
      )}

      <SequenceObjectSafetyNote />
    </div>
  );
}

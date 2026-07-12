import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ModelInputCard } from "./ModelInputCard";
import { ModelTypeSelector } from "./ModelTypeSelector";
import { GeneratedModelSchemaView } from "./GeneratedModelSchema";
import { ModelFieldTable } from "./ModelFieldTable";
import { ModelWeightPanel } from "./ModelWeightPanel";
import { ModelValidationPlanCard } from "./ModelValidationPlan";
import { ModelExportPanel } from "./ModelExportPanel";
import { ModelSafetyNote } from "./ModelSafetyNote";
import { generateModel, type ModelGenerationResult } from "@/lib/model-generation/modelGenerationEngine";
import { saveModel } from "@/lib/model-generation/modelRegistry";
import { Sparkles, Save } from "lucide-react";

export function ModelGenerationPanel() {
  const [objectName, setObjectName] = useState("");
  const [objectDescription, setObjectDescription] = useState("");
  const [targetUse, setTargetUse] = useState("");
  const [contextText, setContextText] = useState("");
  const [preferredModelType, setPreferredModelType] = useState("__auto__");
  const [exportTarget, setExportTarget] = useState("JSON");
  const [subjectMode, setSubjectMode] = useState<"DEMO" | "LIGHT_20" | "FULL_60" | "FOUNDER">("DEMO");
  const [userLevel, setUserLevel] = useState<"PLAIN_USER" | "STRUCTURED_USER" | "FOUNDER_TECHNICAL">("STRUCTURED_USER");
  const [result, setResult] = useState<ModelGenerationResult | null>(null);

  const handleGenerate = () => {
    if (!objectName.trim()) {
      toast.error("请填写对象名称");
      return;
    }
    const r = generateModel({
      objectName,
      objectDescription,
      targetUse,
      preferredModelType: preferredModelType === "__auto__" ? undefined : preferredModelType,
      userLevel,
      subjectMode,
      exportTarget,
      context: contextText,
    });
    setResult(r);
    toast.success(`已生成 ${r.schema.modelType}`);
  };

  const handleSave = () => {
    if (!result) return;
    saveModel(result.schema, `${objectName} | ${targetUse}`, [result.schema.modelType]);
    toast.success("已保存到 Model Registry");
  };

  const recommended = useMemo(() => result?.resolution.recommendedModelType, [result]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ModelInputCard
          objectName={objectName} setObjectName={setObjectName}
          objectDescription={objectDescription} setObjectDescription={setObjectDescription}
          targetUse={targetUse} setTargetUse={setTargetUse}
          contextText={contextText} setContextText={setContextText}
        />
        <ModelTypeSelector
          preferredModelType={preferredModelType} setPreferredModelType={setPreferredModelType}
          exportTarget={exportTarget} setExportTarget={setExportTarget}
          subjectMode={subjectMode} setSubjectMode={setSubjectMode}
          userLevel={userLevel} setUserLevel={setUserLevel}
          recommended={recommended} reason={result?.resolution.reason}
        />
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button onClick={handleGenerate}><Sparkles className="h-4 w-4 mr-2" />Generate Model 生成模型</Button>
        {result && <Button variant="outline" onClick={handleSave}><Save className="h-4 w-4 mr-2" />保存到 Model Registry</Button>}
      </div>

      {result && (
        <div className="space-y-4">
          <ModelSafetyNote report={result.safety} />
          <GeneratedModelSchemaView schema={result.schema} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ModelFieldTable fields={result.schema.fields} />
            <div className="space-y-4">
              <ModelWeightPanel weights={result.schema.weights} />
              <ModelValidationPlanCard plan={result.schema.validationPlan} />
            </div>
          </div>
          <ModelExportPanel schema={result.schema} defaultTarget={exportTarget} />
        </div>
      )}
    </div>
  );
}

import type { ModelTypeDefinition } from "@/constants/model-generation/modelTypes";
import type { ModelTemplate } from "@/constants/model-generation/modelTemplates";
import type { GeneratedModelField } from "@/lib/model-generation/modelSchemaBuilder";

export function buildFields(
  input: { objectName: string; objectDescription: string; targetUse: string },
  def?: ModelTypeDefinition,
  template?: ModelTemplate,
): GeneratedModelField[] {
  if (template) return template.fields.map(f => ({ ...f }));
  const fields: GeneratedModelField[] = [
    { fieldName: "id",          fieldType: "string", required: true,  description: "唯一标识",     source: "DERIVED" },
    { fieldName: "name",        fieldType: "string", required: true,  description: "名称",         source: "USER_INPUT" },
    { fieldName: "description", fieldType: "string", required: false, description: "描述",         source: "USER_INPUT" },
  ];
  if (def) {
    for (const f of def.requiredFields) {
      if (fields.some(x => x.fieldName === f)) continue;
      fields.push({ fieldName: f, fieldType: inferFieldType(f), required: true, description: `必填字段：${f}`, source: "DERIVED" });
    }
    for (const f of def.optionalFields) {
      if (fields.some(x => x.fieldName === f)) continue;
      fields.push({ fieldName: f, fieldType: inferFieldType(f), required: false, description: `可选字段：${f}`, source: "DERIVED" });
    }
  }
  return fields;
}

function inferFieldType(name: string): GeneratedModelField["fieldType"] {
  if (/(level|count|score|value|trust|conflict|momentum|friction)/i.test(name)) return "number";
  if (/(is|has|can|enabled|active)/i.test(name)) return "boolean";
  if (/(list|array|tags|flags|actions|users|risks|fields|channels|signals|zones|npcs|events|relations|materials|symbols|poses|transitions|options|variables|techniques|interfaces|components|tests|adaptation|terminology|boundaries|checks)/i.test(name)) return "array";
  if (/(profile|range|emotion|lighting|palette|process|outcomes|validation|datalayer|filestructure|scope|dependencies)/i.test(name)) return "object";
  return "string";
}

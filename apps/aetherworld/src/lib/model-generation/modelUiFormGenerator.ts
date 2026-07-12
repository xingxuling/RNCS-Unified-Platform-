import type { GeneratedModelSchema, GeneratedModelField } from "@/lib/model-generation/modelSchemaBuilder";

export interface UiFormField {
  fieldName: string;
  label: string;
  control: "input" | "textarea" | "number" | "switch" | "tags" | "json";
  required: boolean;
  hint?: string;
}

export function generateUiForm(schema: GeneratedModelSchema): UiFormField[] {
  return schema.fields.map(f => ({
    fieldName: f.fieldName,
    label: f.description || f.fieldName,
    control: mapControl(f),
    required: f.required,
    hint: f.source ? `数据来源：${f.source}` : undefined,
  }));
}

function mapControl(f: GeneratedModelField): UiFormField["control"] {
  switch (f.fieldType) {
    case "number": return "number";
    case "boolean": return "switch";
    case "array": return "tags";
    case "object": return "json";
    case "string": return f.fieldName.length > 8 || /desc|description|note/i.test(f.fieldName) ? "textarea" : "input";
    default: return "input";
  }
}

export const MODEL_FIELD_TYPES = ["string", "number", "boolean", "array", "object", "enum"] as const;
export type ModelFieldType = typeof MODEL_FIELD_TYPES[number];

export const FIELD_SOURCES = ["USER_INPUT", "SUBJECT_PROFILE", "MSL", "OMNI", "MANUAL", "DERIVED"] as const;
export type FieldSource = typeof FIELD_SOURCES[number];

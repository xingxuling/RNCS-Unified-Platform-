import { SEQUENCE_OBJECT_TYPE_LABELS, type SequenceObjectType } from "@/constants/sequence-object/sequenceObjectTypes";
import { OBJECT_TYPE_TO_LAYER, SEQUENCE_OBJECT_LAYER_LABELS } from "@/constants/sequence-object/sequenceObjectLayers";

export function SequenceObjectTypeCard({ type }: { type: SequenceObjectType }) {
  const layer = OBJECT_TYPE_TO_LAYER[type];
  return (
    <div className="rounded-md border border-border bg-card/40 p-3 text-sm">
      <div className="font-medium">{SEQUENCE_OBJECT_TYPE_LABELS[type]}</div>
      <div className="text-xs text-muted-foreground">{type}</div>
      <div className="mt-1 text-xs">层级：{SEQUENCE_OBJECT_LAYER_LABELS[layer]}</div>
    </div>
  );
}

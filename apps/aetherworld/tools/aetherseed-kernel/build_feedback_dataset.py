#!/usr/bin/env python3
"""Build a local AetherSeed feedback dataset from kernel record JSONL.

The builder only exports records that are already feedback_sample objects and
whose safetyProfile permits export. It is intentionally conservative:

- No secrets / Full60 / Founder-only samples are exported.
- No app runtime is touched.
- No model training is executed.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent
DEFAULT_LOG = ROOT / "records" / "kernel_events.jsonl"
DEFAULT_OUT = ROOT / "datasets" / "feedback_samples.jsonl"


def iter_jsonl(path: Path):
    if not path.exists():
        return
    with path.open("r", encoding="utf-8") as f:
        for line_no, line in enumerate(f, start=1):
            stripped = line.strip()
            if not stripped:
                continue
            try:
                yield line_no, json.loads(stripped)
            except json.JSONDecodeError as exc:
                raise ValueError(f"Invalid JSONL at {path}:{line_no}: {exc}") from exc


def get_record(wrapper: dict[str, Any]) -> dict[str, Any]:
    record = wrapper.get("record", wrapper)
    if not isinstance(record, dict):
        raise ValueError("Record wrapper must contain an object record")
    return record


def is_exportable_feedback(record: dict[str, Any]) -> tuple[bool, str]:
    if record.get("schemaVersion") != "aetherseed.feedback_sample.v1":
        return False, "not feedback sample"

    safety = record.get("safetyProfile", {})
    if safety.get("containsSecrets"):
        return False, "contains secrets"
    if safety.get("containsFull60"):
        return False, "contains Full60"
    if safety.get("containsFounderOnly"):
        return False, "contains Founder-only material"
    if safety.get("exportAllowed") is not True:
        return False, "export not allowed"
    return True, "exportable"


def to_training_row(record: dict[str, Any]) -> dict[str, Any]:
    sample_input = record.get("input", {})
    target_output = record.get("targetOutput", {})
    lineage = record.get("lineage", {})
    quality = record.get("qualitySignals", {})

    instruction = sample_input.get("instruction", "")
    context = sample_input.get("context", "")
    evidence_summary = sample_input.get("evidenceSummary", "")
    output_text = target_output.get("text", "")

    return {
        "sampleId": record.get("sampleId"),
        "sampleType": record.get("sampleType"),
        "instruction": instruction,
        "input": "\n".join(part for part in (context, evidence_summary) if part),
        "output": output_text,
        "metadata": {
            "sourceEventId": record.get("sourceEventId"),
            "sourceJudgementId": record.get("sourceJudgementId"),
            "sourceActionId": record.get("sourceActionId"),
            "aetherSeedModel": lineage.get("aetherSeedModel"),
            "aetherworldModules": lineage.get("aetherworldModules", []),
            "acceptedByUser": quality.get("acceptedByUser"),
            "verified": quality.get("verified"),
            "confidence": quality.get("confidence"),
        },
    }


def build_dataset(log_path: Path, out_path: Path, dry_run: bool) -> dict[str, Any]:
    rows: list[dict[str, Any]] = []
    skipped: list[dict[str, Any]] = []

    for line_no, wrapper in iter_jsonl(log_path) or []:
        record = get_record(wrapper)
        exportable, reason = is_exportable_feedback(record)
        if exportable:
            rows.append(to_training_row(record))
        else:
            skipped.append({
                "line": line_no,
                "schemaVersion": record.get("schemaVersion"),
                "id": record.get("sampleId") or record.get("eventId") or record.get("judgementId") or record.get("actionId"),
                "reason": reason,
            })

    manifest = {
        "sourceLog": str(log_path),
        "output": str(out_path),
        "exportedSamples": len(rows),
        "skippedRecords": len(skipped),
        "skipped": skipped[:50],
    }

    if not dry_run:
        out_path.parent.mkdir(parents=True, exist_ok=True)
        with out_path.open("w", encoding="utf-8") as f:
            for row in rows:
                f.write(json.dumps(row, ensure_ascii=False, sort_keys=True) + "\n")

        manifest_path = out_path.with_suffix(out_path.suffix + ".manifest.json")
        with manifest_path.open("w", encoding="utf-8") as f:
            json.dump(manifest, f, ensure_ascii=False, indent=2, sort_keys=True)
        manifest["manifestPath"] = str(manifest_path)

    return manifest


def main() -> int:
    parser = argparse.ArgumentParser(description="Build exportable AetherSeed feedback training JSONL from kernel records.")
    parser.add_argument("--log", default=str(DEFAULT_LOG), help="Input kernel JSONL log")
    parser.add_argument("--out", default=str(DEFAULT_OUT), help="Output training JSONL")
    parser.add_argument("--dry-run", action="store_true", help="Print manifest without writing dataset")
    args = parser.parse_args()

    manifest = build_dataset(Path(args.log), Path(args.out), dry_run=args.dry_run)
    print(json.dumps(manifest, ensure_ascii=False, indent=2, sort_keys=True))
    if manifest["exportedSamples"] == 0:
        print("No exportable feedback samples found.")
    else:
        print("AetherSeed feedback dataset build PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

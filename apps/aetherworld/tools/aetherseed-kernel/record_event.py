#!/usr/bin/env python3
"""Append AetherSeed Kernel records to a local JSONL log.

This is intentionally local-first and dependency-free. It does not execute
commands, does not scan the computer, and does not modify Aetherworld runtime.
It only appends already-prepared kernel records such as event, judgement,
next_action, and feedback_sample JSON objects.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent
DEFAULT_LOG = ROOT / "records" / "kernel_events.jsonl"
SUPPORTED_SCHEMA_VERSIONS = {
    "aetherseed.event.v1",
    "aetherseed.judgement.v1",
    "aetherseed.next_action.v1",
    "aetherseed.feedback_sample.v1",
}

REQUIRED_KEYS_BY_SCHEMA = {
    "aetherseed.event.v1": ["eventId", "eventType", "createdAt", "source", "permissionLevel", "summary"],
    "aetherseed.judgement.v1": ["judgementId", "eventId", "createdAt", "model", "conclusion"],
    "aetherseed.next_action.v1": ["actionId", "eventId", "judgementId", "createdAt", "permissionLevel", "title", "status"],
    "aetherseed.feedback_sample.v1": ["sampleId", "createdAt", "sourceEventId", "sourceJudgementId", "input", "targetOutput", "safetyProfile"],
}


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def load_json(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, dict):
        raise ValueError(f"{path} must contain a JSON object")
    return data


def canonical_hash(data: dict[str, Any]) -> str:
    encoded = json.dumps(data, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def validate_basic(record: dict[str, Any]) -> None:
    schema_version = record.get("schemaVersion")
    if schema_version not in SUPPORTED_SCHEMA_VERSIONS:
        raise ValueError(f"Unsupported schemaVersion: {schema_version!r}")

    missing = [key for key in REQUIRED_KEYS_BY_SCHEMA[schema_version] if key not in record]
    if missing:
        raise ValueError(f"Missing required keys for {schema_version}: {', '.join(missing)}")

    if schema_version == "aetherseed.feedback_sample.v1":
        safety = record.get("safetyProfile", {})
        sensitive = any(
            bool(safety.get(flag))
            for flag in ("containsSecrets", "containsFull60", "containsFounderOnly")
        )
        if sensitive and safety.get("exportAllowed") is not False:
            raise ValueError(
                "Invalid feedback sample: sensitive material requires exportAllowed=false"
            )


def wrap_record(record: dict[str, Any], source_path: Path | None) -> dict[str, Any]:
    content_hash = canonical_hash(record)
    return {
        "recordedAt": utc_now(),
        "recordHash": content_hash,
        "sourcePath": str(source_path) if source_path else None,
        "record": record,
    }


def append_jsonl(path: Path, item: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as f:
        f.write(json.dumps(item, ensure_ascii=False, sort_keys=True) + "\n")


def main() -> int:
    parser = argparse.ArgumentParser(description="Append an AetherSeed Kernel JSON record to a local JSONL log.")
    parser.add_argument("--input", required=True, help="Path to event/judgement/next_action/feedback_sample JSON")
    parser.add_argument("--log", default=str(DEFAULT_LOG), help="Output JSONL log path")
    parser.add_argument("--dry-run", action="store_true", help="Validate and print the wrapped record without writing")
    args = parser.parse_args()

    input_path = Path(args.input)
    log_path = Path(args.log)
    record = load_json(input_path)
    validate_basic(record)
    wrapped = wrap_record(record, input_path)

    if args.dry_run:
        print(json.dumps(wrapped, ensure_ascii=False, indent=2, sort_keys=True))
        print("AetherSeed record dry-run PASS")
        return 0

    append_jsonl(log_path, wrapped)
    print(f"Appended {record['schemaVersion']} to {log_path}")
    print(f"recordHash={wrapped['recordHash']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

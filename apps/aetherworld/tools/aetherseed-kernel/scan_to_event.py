#!/usr/bin/env python3
"""Convert a local scan summary into an AetherSeed Kernel event.

The adapter is intentionally conservative and format-tolerant. It accepts a JSON
summary produced by a local scanner and emits an `aetherseed.event.v1` object.
It does not scan the filesystem, execute commands, or read extra files.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

DEFAULT_OUT = Path("tools/aetherseed-kernel/generated/scan_event.json")

SENSITIVE_RISK_WORDS = (
    "secret",
    "secrets",
    "token",
    "credential",
    "credentials",
    ".env",
    "private",
    "full60",
    "founder",
)


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def load_json(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, dict):
        raise ValueError(f"{path} must contain a JSON object")
    return data


def stable_hash(data: Any) -> str:
    encoded = json.dumps(data, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def summarize_scan(scan: dict[str, Any]) -> str:
    root = scan.get("root") or scan.get("scanRoot") or scan.get("projectRoot") or "unknown root"
    projects = scan.get("projects")
    if isinstance(projects, list):
        return f"Read-only local scan summary for {root}. Project count: {len(projects)}."
    return f"Read-only local scan summary for {root}."


def collect_observations(scan: dict[str, Any], max_items: int) -> list[str]:
    observations: list[str] = []

    for key in ("summary", "scanSummary", "notes"):
        value = scan.get(key)
        if isinstance(value, str) and value.strip():
            observations.append(value.strip())

    projects = scan.get("projects")
    if isinstance(projects, list):
        for project in projects[:max_items]:
            if not isinstance(project, dict):
                continue
            path = project.get("projectPath") or project.get("path") or project.get("root") or "unknown project"
            project_type = project.get("projectType") or project.get("type") or "unknown type"
            risk_flags = project.get("riskFlags") or []
            candidate_tasks = project.get("candidateTasks") or []
            observations.append(
                f"Project {path} type={project_type}; riskFlags={len(risk_flags) if isinstance(risk_flags, list) else 'unknown'}; candidateTasks={len(candidate_tasks) if isinstance(candidate_tasks, list) else 'unknown'}."
            )

    candidate_tasks = scan.get("candidateTasks")
    if isinstance(candidate_tasks, list):
        for task in candidate_tasks[:max_items]:
            if isinstance(task, dict):
                title = task.get("title") or task.get("name") or task.get("summary") or "untitled task"
                observations.append(f"Candidate task: {title}")
            elif isinstance(task, str):
                observations.append(f"Candidate task: {task}")

    return observations[:max_items]


def normalize_risk_flags(scan: dict[str, Any]) -> list[str]:
    raw_flags: list[str] = []

    def walk(value: Any) -> None:
        if isinstance(value, dict):
            flags = value.get("riskFlags")
            if isinstance(flags, list):
                raw_flags.extend(str(flag) for flag in flags)
            for nested in value.values():
                walk(nested)
        elif isinstance(value, list):
            for item in value:
                walk(item)

    walk(scan)

    joined = " ".join(raw_flags).lower()
    flags: set[str] = set()
    if any(word in joined for word in SENSITIVE_RISK_WORDS):
        flags.add("MAY_CONTAIN_SECRETS")
    if "full60" in joined:
        flags.add("FULL60_RELATED")
    if "founder" in joined:
        flags.add("FOUNDER_ONLY")
    if "model" in joined or "checkpoint" in joined or "gguf" in joined:
        flags.add("MODEL_WEIGHTS")
    if "private" in joined or "repo" in joined:
        flags.add("PRIVATE_REPO")
    if "large" in joined:
        flags.add("LARGE_FILES")
    if not flags:
        flags.add("UNKNOWN_RISK")
    return sorted(flags)


def build_evidence_refs(scan_path: Path, scan: dict[str, Any]) -> list[dict[str, Any]]:
    refs: list[dict[str, Any]] = [
        {
            "id": "evref_scan_summary",
            "kind": "report",
            "label": "local scan summary JSON",
            "path": str(scan_path),
            "safeExcerpt": summarize_scan(scan),
            "hash": stable_hash(scan),
        }
    ]

    projects = scan.get("projects")
    if isinstance(projects, list):
        for index, project in enumerate(projects[:10], start=1):
            if not isinstance(project, dict):
                continue
            path = project.get("projectPath") or project.get("path") or project.get("root")
            label = project.get("name") or project.get("projectType") or f"project {index}"
            refs.append(
                {
                    "id": f"evref_project_{index}",
                    "kind": "directory",
                    "label": str(label),
                    "path": str(path) if path else "",
                    "safeExcerpt": f"Project metadata entry from scan summary index {index}.",
                }
            )
    return refs


def build_event(scan_path: Path, scan: dict[str, Any], event_id: str | None, max_observations: int) -> dict[str, Any]:
    root = scan.get("root") or scan.get("scanRoot") or scan.get("projectRoot") or ""
    generated_id = event_id or "evt_scan_" + stable_hash(scan)[:12]
    return {
        "schemaVersion": "aetherseed.event.v1",
        "eventId": generated_id,
        "eventType": "LOCAL_SCAN",
        "createdAt": utc_now(),
        "source": {
            "kind": "scanner",
            "label": "AetherSeed local scan summary",
            "path": str(scan_path),
            "hash": stable_hash(scan),
        },
        "permissionLevel": "READ_ONLY",
        "summary": summarize_scan(scan),
        "observations": collect_observations(scan, max_observations),
        "evidenceRefs": build_evidence_refs(scan_path, scan),
        "riskFlags": normalize_risk_flags(scan),
        "redactionNotes": [
            "This event was built from a scanner summary. It should not include raw secret contents.",
            "AetherSeed may analyze this evidence but must not claim direct computer access."
        ],
        "lineage": {
            "parentEventIds": [],
            "aetherworldModuleIds": ["aetherseed-local-bridge", "aetherseed-kernel"],
            "aetherSeedModel": "aetherseed-tiny"
        }
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Convert a scanner JSON summary into an aetherseed.event.v1 record.")
    parser.add_argument("--scan", required=True, help="Input scanner summary JSON")
    parser.add_argument("--out", default=str(DEFAULT_OUT), help="Output event JSON path")
    parser.add_argument("--event-id", default=None, help="Optional explicit eventId")
    parser.add_argument("--max-observations", type=int, default=20, help="Maximum observation strings to include")
    parser.add_argument("--dry-run", action="store_true", help="Print event JSON without writing")
    args = parser.parse_args()

    scan_path = Path(args.scan)
    scan = load_json(scan_path)
    event = build_event(scan_path, scan, args.event_id, args.max_observations)

    if args.dry_run:
        print(json.dumps(event, ensure_ascii=False, indent=2, sort_keys=True))
        print("AetherSeed scan_to_event dry-run PASS")
        return 0

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(event, ensure_ascii=False, indent=2, sort_keys=True), encoding="utf-8")
    print(f"Wrote AetherSeed event to {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

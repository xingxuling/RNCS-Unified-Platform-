#!/usr/bin/env python3
"""Build an AetherSeed/Ollama prompt from a kernel event record.

This script does not call Ollama by itself. It only converts a validated event
JSON object into a prompt that can be pasted into `ollama run aetherseed-tiny`
or redirected into a local client.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent
DEFAULT_OUT = ROOT / "prompts" / "event_prompt.txt"


def load_json(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, dict):
        raise ValueError(f"{path} must contain a JSON object")
    return data


def validate_event(event: dict[str, Any]) -> None:
    if event.get("schemaVersion") != "aetherseed.event.v1":
        raise ValueError("prompt_from_event.py expects schemaVersion=aetherseed.event.v1")
    for key in ("eventId", "eventType", "createdAt", "source", "permissionLevel", "summary"):
        if key not in event:
            raise ValueError(f"Missing required event key: {key}")


def compact_event(event: dict[str, Any], max_evidence_excerpt_chars: int) -> dict[str, Any]:
    safe_event = dict(event)
    evidence_refs = []
    for ref in safe_event.get("evidenceRefs", []):
        if not isinstance(ref, dict):
            continue
        safe_ref = dict(ref)
        excerpt = safe_ref.get("safeExcerpt")
        if isinstance(excerpt, str) and len(excerpt) > max_evidence_excerpt_chars:
            safe_ref["safeExcerpt"] = excerpt[:max_evidence_excerpt_chars] + "..."
        evidence_refs.append(safe_ref)
    safe_event["evidenceRefs"] = evidence_refs
    return safe_event


def build_prompt(event: dict[str, Any], language: str, include_schema_hint: bool) -> str:
    validate_event(event)
    event_json = json.dumps(compact_event(event, 800), ensure_ascii=False, indent=2, sort_keys=True)

    if language == "zh":
        instruction = """你是 AetherSeed Tiny，本地运行的 Aetherworld 结构判断模型。

你只能基于下面提供的 AetherSeed Kernel event JSON 进行分析。不要声称你直接扫描了电脑、读取了 GitHub、执行了命令或访问了未提供的文件。若信息不足，请给出可验证假设和下一步 dry-run 动作。

请按以下结构输出：
1. 结论
2. 依据
3. 可验证假设
4. 风险
5. 下一步动作
6. 是否适合形成 feedback_sample
"""
    else:
        instruction = """You are AetherSeed Tiny, a local Aetherworld structural judgement model.

You may only analyze the AetherSeed Kernel event JSON provided below. Do not claim that you directly scanned the computer, read GitHub, executed commands, or accessed files that are not present in the evidence. If information is insufficient, return verifiable assumptions and next dry-run actions.

Return:
1. Conclusion
2. Evidence
3. Verifiable assumptions
4. Risks
5. Next actions
6. Whether this is suitable for a feedback_sample
"""

    schema_hint = """

When possible, make your judgement compatible with `aetherseed.judgement.v1`:
- conclusion
- evidence[] with evidenceRefIds
- verifiableAssumptions[]
- risks[]
- recommendedNextActions[]
- confidence
""" if include_schema_hint else ""

    return f"{instruction}{schema_hint}\n\nAetherSeed Kernel event JSON:\n\n```json\n{event_json}\n```\n"


def main() -> int:
    parser = argparse.ArgumentParser(description="Build an AetherSeed prompt from an event JSON record.")
    parser.add_argument("--event", required=True, help="Path to an aetherseed.event.v1 JSON object")
    parser.add_argument("--out", default=None, help="Optional output prompt path. If omitted, print to stdout.")
    parser.add_argument("--language", choices=["en", "zh"], default="zh", help="Prompt language")
    parser.add_argument("--no-schema-hint", action="store_true", help="Do not include judgement schema compatibility hints")
    args = parser.parse_args()

    event = load_json(Path(args.event))
    prompt = build_prompt(event, language=args.language, include_schema_hint=not args.no_schema_hint)

    if args.out:
        out_path = Path(args.out)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(prompt, encoding="utf-8")
        print(f"Wrote AetherSeed prompt to {out_path}")
    else:
        print(prompt)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

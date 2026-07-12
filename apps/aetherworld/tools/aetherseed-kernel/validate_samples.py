#!/usr/bin/env python3
"""Validate AetherSeed Kernel schema/sample wiring.

This script intentionally avoids adding project dependencies. If `jsonschema` is
available in the local Python environment, it performs Draft 2020-12 validation.
It always performs the kernel-specific safety and join checks that matter for the
Phase 2.5 contracts.
"""

from __future__ import annotations

import argparse
import copy
import json
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent
SCHEMAS = ROOT / "schemas"
SAMPLES = ROOT / "samples"

SCHEMA_SAMPLE_PAIRS = [
    ("event.schema.json", "event.sample.json"),
    ("judgement.schema.json", "judgement.sample.json"),
    ("next_action.schema.json", "next_action.sample.json"),
    ("feedback_sample.schema.json", "feedback_sample.sample.json"),
]


def load_json(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def try_jsonschema_validate(schema: dict[str, Any], sample: dict[str, Any], label: str) -> str:
    try:
        from jsonschema import Draft202012Validator  # type: ignore
    except Exception:
        return f"SKIP jsonschema validation for {label}: package not installed"

    validator = Draft202012Validator(schema)
    errors = sorted(validator.iter_errors(sample), key=lambda error: list(error.path))
    if errors:
        details = "; ".join(f"{list(error.path)}: {error.message}" for error in errors)
        raise AssertionError(f"{label} failed Draft 2020-12 validation: {details}")
    return f"PASS jsonschema validation for {label}"


def assert_feedback_export_safety(sample: dict[str, Any]) -> None:
    safety = sample.get("safetyProfile", {})
    has_sensitive = any(
        bool(safety.get(flag))
        for flag in ("containsSecrets", "containsFull60", "containsFounderOnly")
    )
    if has_sensitive and safety.get("exportAllowed") is not False:
        raise AssertionError(
            "feedback_sample safety violation: sensitive material requires exportAllowed=false"
        )


def assert_malicious_feedback_rejected(sample: dict[str, Any]) -> None:
    malicious = copy.deepcopy(sample)
    malicious["safetyProfile"]["containsSecrets"] = True
    malicious["safetyProfile"]["exportAllowed"] = True

    try:
        assert_feedback_export_safety(malicious)
    except AssertionError:
        return
    raise AssertionError(
        "malicious feedback sample was not rejected: containsSecrets=true + exportAllowed=true"
    )


def assert_action_join(judgement: dict[str, Any], next_action: dict[str, Any]) -> None:
    next_actions = judgement.get("recommendedNextActions", [])
    action_ids = [
        item.get("actionId")
        for item in next_actions
        if isinstance(item, dict) and item.get("kind") == "ACTION_ID"
    ]
    if not action_ids:
        raise AssertionError("judgement sample has no ACTION_ID recommended next action")

    expected = next_action.get("actionId")
    if expected not in action_ids:
        raise AssertionError(
            f"judgement recommendedNextActions do not join next_action actionId: {expected}"
        )


def assert_lineage_join(
    event: dict[str, Any],
    judgement: dict[str, Any],
    next_action: dict[str, Any],
    feedback: dict[str, Any],
) -> None:
    if judgement.get("eventId") != event.get("eventId"):
        raise AssertionError("judgement.eventId does not match event.eventId")
    if next_action.get("eventId") != event.get("eventId"):
        raise AssertionError("next_action.eventId does not match event.eventId")
    if next_action.get("judgementId") != judgement.get("judgementId"):
        raise AssertionError("next_action.judgementId does not match judgement.judgementId")
    if feedback.get("sourceEventId") != event.get("eventId"):
        raise AssertionError("feedback.sourceEventId does not match event.eventId")
    if feedback.get("sourceJudgementId") != judgement.get("judgementId"):
        raise AssertionError("feedback.sourceJudgementId does not match judgement.judgementId")
    if feedback.get("sourceActionId") != next_action.get("actionId"):
        raise AssertionError("feedback.sourceActionId does not match next_action.actionId")


def run_validation(require_jsonschema: bool) -> list[str]:
    messages: list[str] = []
    loaded_samples: dict[str, dict[str, Any]] = {}

    for schema_name, sample_name in SCHEMA_SAMPLE_PAIRS:
        schema = load_json(SCHEMAS / schema_name)
        sample = load_json(SAMPLES / sample_name)
        loaded_samples[sample_name] = sample
        message = try_jsonschema_validate(schema, sample, sample_name)
        if require_jsonschema and message.startswith("SKIP"):
            raise AssertionError("jsonschema package is required but not installed")
        messages.append(message)

    event = loaded_samples["event.sample.json"]
    judgement = loaded_samples["judgement.sample.json"]
    next_action = loaded_samples["next_action.sample.json"]
    feedback = loaded_samples["feedback_sample.sample.json"]

    assert_feedback_export_safety(feedback)
    messages.append("PASS feedback export safety fixture")

    assert_malicious_feedback_rejected(feedback)
    messages.append("PASS malicious feedback sample rejected")

    assert_action_join(judgement, next_action)
    messages.append("PASS judgement -> next_action join")

    assert_lineage_join(event, judgement, next_action, feedback)
    messages.append("PASS event/judgement/action/feedback lineage join")

    return messages


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate AetherSeed Kernel schema/sample contracts.")
    parser.add_argument(
        "--require-jsonschema",
        action="store_true",
        help="Fail if the optional jsonschema package is not installed.",
    )
    args = parser.parse_args()

    messages = run_validation(require_jsonschema=args.require_jsonschema)
    for message in messages:
        print(message)
    print("AetherSeed Kernel sample validation PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

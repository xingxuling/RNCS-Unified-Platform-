from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator

from .errors import HNACError
from .util import safe_logical_path, version_tuple

SUPPORTED_FORMATS = {"0.1", "0.2", "0.3", "0.4", "0.5", "0.6", "0.7", "0.8"}


def _schema_path(fmt: str) -> Path:
    return Path(__file__).resolve().parent / "schemas" / f"hnac-manifest-{fmt}.schema.json"


def execution_candidates(manifest: dict[str, Any]) -> list[dict[str, Any]]:
    execution = manifest["execution"]
    if manifest["format_version"] == "0.1":
        values = [execution["primary"], *execution.get("alternatives", [])]
        return [{"profile": value, "entry": manifest["app"]["entry"]} for value in values]
    return [execution["primary"], *execution.get("alternatives", [])]


def validate_manifest(manifest: dict[str, Any], *, schema_path: Path | None = None) -> None:
    fmt = manifest.get("format_version")
    if fmt not in SUPPORTED_FORMATS:
        raise HNACError(f"Unsupported format_version: {fmt}")

    if fmt in {"0.2", "0.3", "0.4", "0.5", "0.6", "0.7", "0.8"}:
        path = schema_path or _schema_path(fmt)
        schema = json.loads(path.read_text("utf-8"))
        errors = sorted(Draft202012Validator(schema).iter_errors(manifest), key=lambda e: list(e.path))
        if errors:
            details = "; ".join(f"{'.'.join(map(str, e.path)) or '<root>'}: {e.message}" for e in errors[:8])
            raise HNACError(f"Manifest schema validation failed: {details}")
    else:
        required = {"format_version", "app", "execution", "capabilities", "security", "compatibility"}
        missing = sorted(required - manifest.keys())
        if missing:
            raise HNACError(f"Manifest missing fields: {', '.join(missing)}")
        for key in ("id", "name", "version", "entry"):
            if not isinstance(manifest["app"].get(key), str) or not manifest["app"][key]:
                raise HNACError(f"Invalid app.{key}")

    if manifest["security"].get("sandbox") != "deny-by-default":
        raise HNACError("HNAC requires security.sandbox=deny-by-default")
    if version_tuple(manifest["compatibility"]["min_runtime"]) > version_tuple("0.8.0"):
        raise HNACError("Capsule requires a newer runtime")

    seen: set[str] = set()
    for cap in manifest["capabilities"]:
        cap_id = cap.get("id")
        if cap_id in seen:
            raise HNACError(f"Duplicate capability declaration: {cap_id}")
        seen.add(cap_id)

    for candidate in execution_candidates(manifest):
        safe_logical_path(candidate["entry"])
        if "contract" in candidate:
            safe_logical_path(candidate["contract"])
        if candidate.get("profile") == "wasm-component@1" and not candidate.get("world"):
            raise HNACError("wasm-component@1 requires execution world metadata")

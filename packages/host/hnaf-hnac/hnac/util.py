from __future__ import annotations

import hashlib
import json
from pathlib import PurePosixPath
from typing import Any

from .errors import HNACError


def canonical_json(value: Any) -> bytes:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def safe_logical_path(name: str) -> str:
    path = PurePosixPath(name)
    if path.is_absolute() or ".." in path.parts or name.endswith("/"):
        raise HNACError(f"Unsafe logical path: {name}")
    normalized = str(path)
    if normalized in ("", "."):
        raise HNACError(f"Invalid logical path: {name}")
    return normalized


def version_tuple(value: str) -> tuple[int, ...]:
    core = value.split("+", 1)[0].split("-", 1)[0]
    try:
        return tuple(int(part) for part in core.split("."))
    except ValueError as exc:
        raise HNACError(f"Invalid numeric version: {value}") from exc

from __future__ import annotations

import json
import platform
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any

from .errors import HNACError


@dataclass
class HostProfile:
    id: str
    family: str
    execution_profiles: list[str]
    capabilities: dict[str, list[str]]
    interaction_modes: list[str] = field(default_factory=list)
    resources: dict[str, Any] = field(default_factory=dict)
    policies: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

    @classmethod
    def load(cls, path: Path) -> "HostProfile":
        try:
            raw = json.loads(path.read_text("utf-8"))
            return cls(
                id=str(raw["id"]),
                family=str(raw["family"]),
                execution_profiles=list(raw["execution_profiles"]),
                capabilities={key: list(value) for key, value in raw["capabilities"].items()},
                interaction_modes=list(raw.get("interaction_modes", [])),
                resources=dict(raw.get("resources", {})),
                policies=dict(raw.get("policies", {})),
            )
        except (OSError, KeyError, TypeError, ValueError, json.JSONDecodeError) as exc:
            raise HNACError(f"Invalid host profile: {path}") from exc


def default_host_profile() -> HostProfile:
    system = platform.system().lower() or "unknown"
    family = "desktop" if system in {"windows", "darwin", "linux"} else "unknown"
    return HostProfile(
        id=f"hnaf.reference.{system}",
        family=family,
        execution_profiles=["wasm-component@1", "wasm-core@1", "declarative-v0"],
        capabilities={
            "host.log": ["1"],
            "host.clock": ["1"],
            "environment.summary": ["1"],
            "storage.kv": ["1", "2"],
            "storage.state": ["1"],
        },
        interaction_modes=["cli", "keyboard", "pointer"],
        resources={
            "system": platform.system(),
            "release": platform.release(),
            "machine": platform.machine(),
            "memory_class": "host-managed",
        },
        policies={"require_signature": False, "network_default": "deny"},
    )

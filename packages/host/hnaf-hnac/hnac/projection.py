from __future__ import annotations

import datetime as dt
import json
import shutil
from pathlib import Path
from typing import Any

from .errors import HNACError
from .trust import verify
from .util import canonical_json, sha256_bytes

PROJECTION_VERSION = "0.8"


def project_web(capsule: Path, output: Path, *, autorun: bool = False, require_signature: bool = False) -> dict[str, Any]:
    verified = verify(capsule, require_signature=require_signature)
    template = Path(__file__).resolve().parent / "templates" / "web-host"
    if not template.is_dir():
        raise HNACError("Installed package is missing the web-host template")
    if output.exists() and any(output.iterdir()):
        raise HNACError(f"Projection target is not empty: {output}")
    output.mkdir(parents=True, exist_ok=True)
    shutil.copytree(template, output, dirs_exist_ok=True)
    capsule_name = "application.hnac"
    shutil.copy2(capsule, output / capsule_name)
    (output / "config.json").write_text(
        json.dumps({
            "capsule": f"./{capsule_name}",
            "autorun": autorun,
            "gateway_url": "./api",
            "default_intent_payload": {"amount": 2},
        }, ensure_ascii=False, indent=2, sort_keys=True),
        "utf-8",
    )
    root = sha256_bytes(capsule.read_bytes())
    provenance = {
        "version": PROJECTION_VERSION,
        "kind": "pwa-host-projection",
        "source": {
            "capsule": capsule_name,
            "capsule_sha256": root,
            "app": verified["manifest"]["app"],
            "integrity_index_sha256": sha256_bytes(canonical_json(verified["integrity"])),
            "signature": verified["signature"],
        },
        "projection": {
            "canonical_application": False,
            "host": "hnaf.javascript.browser",
            "execution_profiles": ["wasm-core@1", "declarative-v0"],
            "state_fabric": "hnaf.portable-state.v0.5",
            "interface_fabric": f"hnaf.adaptive-interface.v{verified['manifest'].get('interface', {}).get('version', '0.6')}",
            "capability_binding": f"hnaf.intent-capability-binding.v{verified['manifest'].get('capability_binding', {}).get('version', 'none')}",
            "execution_fabric": f"hnaf.remote-execution.v{verified['manifest'].get('format_version', 'none')}" if verified["manifest"].get("execution_fabric") else None,
            "created_utc": dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat(),
        },
    }
    (output / "projection.json").write_text(json.dumps(provenance, ensure_ascii=False, indent=2, sort_keys=True), "utf-8")
    return {
        "output": str(output),
        "app": verified["manifest"]["app"],
        "capsule_sha256": root,
        "signature": verified["signature"],
        "files": sorted(path.name for path in output.iterdir()),
    }

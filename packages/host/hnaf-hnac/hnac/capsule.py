from __future__ import annotations

import json
import os
import zipfile
from pathlib import Path
from typing import Any

from .errors import HNACError
from .manifest import execution_candidates, validate_manifest
from .adaptive_interface import interface_from_capsule_files
from .util import canonical_json, safe_logical_path, sha256_bytes

EXCLUDED_PREFIXES = ("integrity/", "signatures/", "attestations/")


def read_zip_unique(path: Path) -> dict[str, bytes]:
    files: dict[str, bytes] = {}
    try:
        with zipfile.ZipFile(path, "r") as archive:
            for info in archive.infolist():
                if info.is_dir():
                    continue
                name = safe_logical_path(info.filename)
                if name in files:
                    raise HNACError(f"Duplicate logical path: {name}")
                files[name] = archive.read(info)
    except zipfile.BadZipFile as exc:
        raise HNACError(f"Invalid HNAC container: {path}") from exc
    return files


def deterministic_zip_write(path: Path, files: dict[str, bytes]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    with zipfile.ZipFile(tmp, "w", compression=zipfile.ZIP_DEFLATED, allowZip64=True) as archive:
        for name, data in sorted(files.items()):
            safe_logical_path(name)
            info = zipfile.ZipInfo(name, date_time=(1980, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o644 << 16
            archive.writestr(info, data)
    os.replace(tmp, path)


def collect_source(source: Path) -> tuple[dict[str, bytes], dict[str, Any]]:
    if not source.is_dir():
        raise HNACError(f"Source directory not found: {source}")
    files: dict[str, bytes] = {}
    for path in sorted(item for item in source.rglob("*") if item.is_file()):
        logical = safe_logical_path(path.relative_to(source).as_posix())
        if logical.startswith(EXCLUDED_PREFIXES):
            continue
        files[logical] = path.read_bytes()
    if "hnac.json" not in files:
        raise HNACError("Source must contain hnac.json")
    try:
        manifest = json.loads(files["hnac.json"].decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise HNACError("hnac.json must be valid UTF-8 JSON") from exc
    validate_manifest(manifest)
    for candidate in execution_candidates(manifest):
        if candidate["entry"] not in files:
            raise HNACError(f"Execution entry not found: {candidate['entry']}")
        contract = candidate.get("contract")
        if contract and contract not in files:
            raise HNACError(f"Execution contract not found: {contract}")
    migration_graph = manifest.get("state", {}).get("migration_graph")
    if migration_graph:
        migration_graph = safe_logical_path(migration_graph)
        if migration_graph not in files:
            raise HNACError(f"State migration graph not found: {migration_graph}")
    interface = manifest.get("interface") or {}
    graph_path = interface.get("graph")
    if graph_path:
        graph_path = safe_logical_path(graph_path)
        if graph_path not in files:
            raise HNACError(f"Adaptive interface graph not found: {graph_path}")
        if interface.get("version") in {"0.6", "0.7"}:
            interface_from_capsule_files(manifest, files)
    return files, manifest


def make_integrity_index(files: dict[str, bytes]) -> dict[str, Any]:
    return {
        "version": "0.3",
        "algorithm": "sha256",
        "root_model": "canonical-file-map",
        "files": {
            name: {"sha256": sha256_bytes(data), "size": len(data)}
            for name, data in sorted(files.items())
        },
    }


def pack(source: Path, output: Path) -> dict[str, Any]:
    payload, manifest = collect_source(source)
    index = make_integrity_index(payload)
    all_files = dict(payload)
    all_files["integrity/index.json"] = canonical_json(index)
    deterministic_zip_write(output, all_files)
    return {"output": str(output), "files": len(payload), "app": manifest["app"]}

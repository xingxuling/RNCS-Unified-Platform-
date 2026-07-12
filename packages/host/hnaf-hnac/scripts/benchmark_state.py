from __future__ import annotations

import json
import platform
import statistics
import tempfile
import time
from pathlib import Path

from hnac.state_fabric import PortableStateStore


def measure(callable_, count: int) -> dict[str, float]:
    samples = []
    for _ in range(count):
        started = time.perf_counter_ns()
        callable_()
        samples.append((time.perf_counter_ns() - started) / 1_000_000)
    ordered = sorted(samples)
    return {
        "count": count,
        "mean_ms": round(statistics.fmean(samples), 6),
        "median_ms": round(statistics.median(samples), 6),
        "p95_ms": round(ordered[min(len(ordered) - 1, int(len(ordered) * 0.95))], 6),
        "min_ms": round(min(samples), 6),
        "max_ms": round(max(samples), 6),
    }


def main() -> None:
    with tempfile.TemporaryDirectory() as directory:
        root = Path(directory)
        store = PortableStateStore(root / "state", "org.taowind.benchmark", schema_version="1", replica_id="benchmark")
        counter = {"value": 0}

        def write() -> None:
            counter["value"] += 1
            store.set(f"key-{counter['value'] % 64}", {"value": counter["value"], "text": "现实原生状态"})

        writes = measure(write, 300)
        roots = measure(store.state_root, 1000)
        snapshots = measure(lambda: store.snapshot(label="benchmark"), 60)
        bundle = root / "state.json"
        store.export_bundle(bundle, include_cache=True)
        verifies = measure(lambda: PortableStateStore.verify_bundle(bundle), 500)
        result = {
            "benchmark": "HNAC Portable State Fabric v0.5.0",
            "environment": {
                "python": platform.python_version(),
                "platform": platform.platform(),
                "processor": platform.processor(),
            },
            "state_keys": store.status()["partition_keys"],
            "operations": {
                "portable_set_with_root": writes,
                "full_state_root": roots,
                "snapshot_four_partitions": snapshots,
                "bundle_verify": verifies,
            },
        }
        print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()

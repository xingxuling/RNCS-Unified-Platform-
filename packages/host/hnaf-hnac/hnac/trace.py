from __future__ import annotations

import datetime as dt
import json
from pathlib import Path
from typing import Any


class TraceRecorder:
    def __init__(self, path: Path | None = None):
        self.path = path
        self.events: list[dict[str, Any]] = []
        if path is not None:
            path.parent.mkdir(parents=True, exist_ok=True)

    def emit(self, event: str, **fields: Any) -> None:
        record = {
            "time": dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat(),
            "event": event,
            **fields,
        }
        self.events.append(record)
        if self.path is not None:
            with self.path.open("a", encoding="utf-8") as stream:
                stream.write(json.dumps(record, ensure_ascii=False, sort_keys=True) + "\n")

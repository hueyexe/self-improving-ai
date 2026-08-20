#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
import sys


def enabled(name: str) -> bool:
    return os.environ.get(name, "").lower() in {"1", "true", "yes", "on"}


def main() -> int:
    try:
        payload = json.load(sys.stdin)
    except (json.JSONDecodeError, TypeError):
        return 0
    if payload.get("stop_hook_active"):
        return 0

    state_root = os.environ.get("CLAUDE_PLUGIN_DATA", "/tmp/self-improving-ai-claude")
    digest = hashlib.sha256(str(payload.get("session_id", "unknown")).encode()).hexdigest()
    marker = Path(state_root) / "reviewed" / digest
    if marker.exists():
        return 0

    try:
        minimum = max(0, int(os.environ.get("SELF_IMPROVING_MIN_TRANSCRIPT_BYTES", "12000")))
    except ValueError:
        minimum = 12000
    transcript = payload.get("transcript_path")
    if minimum > 0:
        try:
            if not transcript or Path(transcript).stat().st_size < minimum:
                return 0
        except OSError:
            return 0

    root = Path(__file__).resolve().parent
    prompt = (root / "prompt.md").read_text(encoding="utf-8").strip()
    if enabled("SELF_IMPROVING_GBRAIN"):
        prompt += (root / "gbrain.md").read_text(encoding="utf-8").rstrip()
    marker.parent.mkdir(parents=True, exist_ok=True)
    marker.touch(exist_ok=True)
    print(json.dumps({"decision": "block", "reason": prompt}), file=sys.stderr)
    return 2


if __name__ == "__main__":
    raise SystemExit(main())

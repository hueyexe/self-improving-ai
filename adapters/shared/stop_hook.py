#!/usr/bin/env python3
"""Emit one guarded self-improvement continuation for Claude Code or Codex."""

from __future__ import annotations

import json
import hashlib
import os
from pathlib import Path
import sys
from typing import Any


DEFAULT_MIN_TRANSCRIPT_BYTES = 12_000


def enabled(name: str) -> bool:
    return os.environ.get(name, "").lower() in {"1", "true", "yes", "on"}


def build_prompt(root: Path) -> str:
    prompt = (root / "prompt.md").read_text(encoding="utf-8").strip()
    if enabled("SELF_IMPROVING_GBRAIN"):
        prompt += (root / "gbrain.md").read_text(encoding="utf-8").rstrip()
    return prompt


def marker_path(payload: dict[str, Any]) -> Path:
    state_root = (
        os.environ.get("SELF_IMPROVING_STATE_DIR")
        or os.environ.get("PLUGIN_DATA")
        or os.environ.get("CLAUDE_PLUGIN_DATA")
        or "/tmp/self-improving-ai"
    )
    session_id = str(payload.get("session_id", "unknown"))
    digest = hashlib.sha256(session_id.encode()).hexdigest()
    return Path(state_root) / "reviewed" / digest


def transcript_is_substantial(payload: dict[str, Any]) -> bool:
    raw_minimum = os.environ.get(
        "SELF_IMPROVING_MIN_TRANSCRIPT_BYTES", str(DEFAULT_MIN_TRANSCRIPT_BYTES)
    )
    try:
        minimum = max(0, int(raw_minimum))
    except ValueError:
        minimum = DEFAULT_MIN_TRANSCRIPT_BYTES

    transcript = payload.get("transcript_path")
    if not transcript:
        return minimum == 0
    try:
        return Path(transcript).stat().st_size >= minimum
    except OSError:
        return minimum == 0


def main() -> int:
    try:
        payload = json.load(sys.stdin)
    except (json.JSONDecodeError, TypeError):
        return 0

    marker = marker_path(payload)
    if payload.get("stop_hook_active") or marker.exists() or not transcript_is_substantial(payload):
        return 0

    prompt = build_prompt(Path(__file__).resolve().parent)
    marker.parent.mkdir(parents=True, exist_ok=True)
    marker.touch(exist_ok=True)
    result = {"decision": "block", "reason": prompt}

    if os.environ.get("SELF_IMPROVING_HOOK_HOST") == "claude":
        print(json.dumps(result), file=sys.stderr)
        return 2

    print(json.dumps(result))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

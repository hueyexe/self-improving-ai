#!/usr/bin/env python3

from __future__ import annotations

import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest


SCRIPT = Path(__file__).with_name("stop_hook.py")
ROOT = Path(__file__).parents[2]
CLAUDE_SCRIPT = ROOT / "plugins/claude-code/adapters/shared/stop_hook.py"
CODEX_SCRIPT = ROOT / "plugins/self-improving/adapters/shared/stop_hook.py"


class StopHookTest(unittest.TestCase):
    def run_hook(self, payload: dict[str, object], **environment: str) -> subprocess.CompletedProcess[str]:
        env = os.environ.copy()
        env.update(environment)
        env["PLUGIN_ROOT"] = str(ROOT)
        with tempfile.TemporaryDirectory() as state_dir:
            env["SELF_IMPROVING_STATE_DIR"] = state_dir
            return subprocess.run(
                ["python3", str(SCRIPT)],
                input=json.dumps(payload),
                capture_output=True,
                check=False,
                env=env,
                text=True,
            )

    def test_skips_recursive_stop(self) -> None:
        result = self.run_hook({"stop_hook_active": True})
        self.assertEqual(result.returncode, 0)
        self.assertEqual(result.stdout, "")

    def test_skips_short_transcript(self) -> None:
        with tempfile.NamedTemporaryFile() as transcript:
            transcript.write(b"short")
            transcript.flush()
            result = self.run_hook(
                {"stop_hook_active": False, "transcript_path": transcript.name},
                SELF_IMPROVING_MIN_TRANSCRIPT_BYTES="100",
            )
        self.assertEqual(result.returncode, 0)
        self.assertEqual(result.stdout, "")

    def test_codex_blocks_once_without_gbrain_by_default(self) -> None:
        result = self.run_hook(
            {"stop_hook_active": False, "transcript_path": None},
            SELF_IMPROVING_MIN_TRANSCRIPT_BYTES="0",
        )
        output = json.loads(result.stdout)
        self.assertEqual(result.returncode, 0)
        self.assertEqual(output["decision"], "block")
        self.assertNotIn("GBrain is enabled", output["reason"])

    def test_claude_uses_blocking_exit_and_optional_gbrain(self) -> None:
        result = self.run_hook(
            {"stop_hook_active": False, "transcript_path": None},
            SELF_IMPROVING_GBRAIN="1",
            SELF_IMPROVING_HOOK_HOST="claude",
            SELF_IMPROVING_MIN_TRANSCRIPT_BYTES="0",
        )
        output = json.loads(result.stderr)
        self.assertEqual(result.returncode, 2)
        self.assertIn("GBrain is enabled", output["reason"])

    def test_marker_prevents_a_second_review(self) -> None:
        with tempfile.TemporaryDirectory() as state_dir:
            environment = os.environ.copy()
            environment.update(
                PLUGIN_ROOT=str(ROOT),
                SELF_IMPROVING_MIN_TRANSCRIPT_BYTES="0",
                SELF_IMPROVING_STATE_DIR=state_dir,
            )
            payload = json.dumps({"session_id": "same-session", "stop_hook_active": False})
            first = subprocess.run(
                ["python3", str(SCRIPT)], input=payload, capture_output=True, env=environment, text=True
            )
            second = subprocess.run(
                ["python3", str(SCRIPT)], input=payload, capture_output=True, env=environment, text=True
            )
        self.assertNotEqual(first.stdout, "")
        self.assertEqual(second.stdout, "")

    def test_packaged_hooks_use_their_native_output_contracts(self) -> None:
        payload = json.dumps({"session_id": "packaged", "stop_hook_active": False})
        with tempfile.TemporaryDirectory() as claude_data, tempfile.TemporaryDirectory() as codex_data:
            claude_env = os.environ | {
                "CLAUDE_PLUGIN_DATA": claude_data,
                "SELF_IMPROVING_MIN_TRANSCRIPT_BYTES": "0",
            }
            codex_env = os.environ | {
                "PLUGIN_DATA": codex_data,
                "SELF_IMPROVING_MIN_TRANSCRIPT_BYTES": "0",
            }
            claude = subprocess.run(
                ["python3", str(CLAUDE_SCRIPT)],
                input=payload,
                capture_output=True,
                env=claude_env,
                text=True,
            )
            codex = subprocess.run(
                ["python3", str(CODEX_SCRIPT)],
                input=payload,
                capture_output=True,
                env=codex_env,
                text=True,
            )
        self.assertEqual(claude.returncode, 2)
        self.assertEqual(json.loads(claude.stderr)["decision"], "block")
        self.assertEqual(codex.returncode, 0)
        self.assertEqual(json.loads(codex.stdout)["decision"], "block")


if __name__ == "__main__":
    unittest.main()

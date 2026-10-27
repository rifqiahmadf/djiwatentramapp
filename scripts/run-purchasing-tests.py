#!/usr/bin/env python3
"""Run legacy purchasing tests without letting them delete checkout data."""
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

source = Path(__file__).resolve().parents[1] / "yumi-purchasing-agent"
env = os.environ.copy()
env.setdefault("NINEROUTER_BASE_URL", "http://test.invalid/v1")
with tempfile.TemporaryDirectory(prefix="purchasing-unit-tests-") as directory:
    # Copy only executable first-party modules, never env, session, or user data.
    for module in source.glob("*.py"):
        shutil.copy2(module, Path(directory) / module.name)
    result = subprocess.run([sys.executable, "test_marketlist.py"], cwd=directory, env=env)
sys.exit(result.returncode)

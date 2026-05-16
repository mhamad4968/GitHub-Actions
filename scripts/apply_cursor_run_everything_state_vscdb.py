#!/usr/bin/env python3
"""
Flip Cursor reactive storage: composerState.yoloEnableRunEverything -> True.

Reads/writes: %APPDATA%\\Cursor\\User\\globalStorage\\state.vscdb (ItemTable).

CEO/CIO: Prefer running while Cursor is **fully quit** to avoid WAL lock /
state mismatch. Always backs up DB first.

Usage:
  python scripts/apply_cursor_run_everything_state_vscdb.py
  python scripts/apply_cursor_run_everything_state_vscdb.py --dry-run
"""
from __future__ import annotations

import argparse
import json
import os
import shutil
import sqlite3
import sys
import time
from pathlib import Path

KEY = "src.vs.platform.reactivestorage.browser.reactiveStorageServiceImpl.persistentStorage.applicationUser"


def db_path() -> Path:
    appdata = Path(os.environ.get("APPDATA", ""))
    return appdata / "Cursor" / "User" / "globalStorage" / "state.vscdb"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    p = db_path()
    if not p.is_file():
        print(f"[apply-run-everything] missing: {p}", file=sys.stderr)
        return 2

    ts = time.strftime("%Y%m%d-%H%M%S")
    backup = p.with_name(f"state.vscdb.backup-yolo-{ts}")
    shutil.copy2(p, backup)
    print(f"[apply-run-everything] backup -> {backup}")

    conn = sqlite3.connect(str(p), timeout=5.0)
    try:
        cur = conn.cursor()
        cur.execute("SELECT value FROM ItemTable WHERE key = ?", (KEY,))
        row = cur.fetchone()
        if not row:
            print(f"[apply-run-everything] key not found: {KEY}", file=sys.stderr)
            return 2
        raw = row[0]
        text = raw if isinstance(raw, str) else raw.decode("utf-8", "replace")
        data = json.loads(text)
        cs = data.get("composerState")
        if not isinstance(cs, dict):
            print("[apply-run-everything] composerState missing or not dict", file=sys.stderr)
            return 2
        before = cs.get("yoloEnableRunEverything")
        cs["yoloEnableRunEverything"] = True
        after = cs.get("yoloEnableRunEverything")
        print(f"[apply-run-everything] yoloEnableRunEverything: {before!r} -> {after!r}")

        if args.dry_run:
            conn.rollback()
            print("[apply-run-everything] dry-run: no write")
            return 0

        new_text = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
        cur.execute("UPDATE ItemTable SET value = ? WHERE key = ?", (new_text, KEY))
        conn.commit()
        print("[apply-run-everything] OK committed - restart Cursor to reload reactive storage")
        return 0
    except sqlite3.OperationalError as e:
        if "locked" in str(e).lower():
            print(
                "[apply-run-everything] DB locked — quit Cursor fully, then re-run this script.",
                file=sys.stderr,
            )
            print(f"[apply-run-everything] restore if needed: copy {backup} -> {p}", file=sys.stderr)
        else:
            print(f"[apply-run-everything] sqlite error: {e}", file=sys.stderr)
        return 1
    finally:
        conn.close()


if __name__ == "__main__":
    sys.exit(main())

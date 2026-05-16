"""Read-only probe of Cursor state.vscdb for agent/autorun related keys."""
import os
import re
import sqlite3
from pathlib import Path

home = Path(os.environ.get("APPDATA", ""))
db_path = home / "Cursor" / "User" / "globalStorage" / "state.vscdb"
if not db_path.is_file():
    raise SystemExit(f"missing db: {db_path}")

needle = re.compile(r"auto|run|sandbox|agent|composer|yolo|everything", re.I)

conn = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True)
cur = conn.cursor()
cur.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
tables = [r[0] for r in cur.fetchall()]
print("tables:", ", ".join(tables))

for name in tables:
    cur.execute(f'PRAGMA table_info("{name}")')
    cols = cur.fetchall()
    col_names = [c[1] for c in cols]
    key_col = next((c for c in col_names if c.lower() == "key"), None)
    val_col = next((c for c in col_names if c.lower() == "value"), None)
    if not key_col or not val_col:
        continue
    cur.execute(f'SELECT "{key_col}", "{val_col}" FROM "{name}"')
    for k, v in cur.fetchall():
        ks, vs = str(k or ""), str(v or "")
        if needle.search(ks) or needle.search(vs[:800]):
            head = vs[:300].replace("\n", " ")
            print(f"\n[{name}] {ks}\n  v(head)={head}")

conn.close()


def main_keys_only():
    """Print ItemTable keys matching SQL LIKE patterns (for CIO Run-mode hunt)."""
    conn = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True)
    cur = conn.cursor()
    patterns = [
        "%autoRun%",
        "%AutoRun%",
        "%runMode%",
        "%RunMode%",
        "%sandbox%",
        "%Sandbox%",
        "%yolo%",
        "%everything%",
        "%terminalExecution%",
        "%agentSecurity%",
        "%toolApproval%",
        "cursor/%agent%",
        "cursor/%Agent%",
    ]
    for pat in patterns:
        cur.execute("SELECT key FROM ItemTable WHERE key LIKE ? LIMIT 50", (pat,))
        rows = [r[0] for r in cur.fetchall()]
        if rows:
            print(f"\n=== LIKE {pat!r} ({len(rows)}) ===")
            for k in rows:
                print(k)
    conn.close()


if __name__ == "__main__" and os.environ.get("CURSOR_PROBE_KEYS") == "1":
    main_keys_only()

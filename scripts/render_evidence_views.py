from __future__ import annotations

import html
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "output" / "doc" / "evidence" / "views"

SOURCES = {
    "docker-services": ROOT / "output" / "doc" / "validation" / "docker-compose-ps-initial.txt",
    "https-health": ROOT / "output" / "doc" / "validation" / "docker-compose-runtime-check.txt",
    "sql-central-records": ROOT / "output" / "doc" / "evidence" / "sql" / "EV-31-sql-records.txt",
    "backup-restore": ROOT / "output" / "doc" / "evidence" / "logs" / "backup-test.txt",
}

STYLE = """
body {
  font-family: Menlo, Consolas, monospace;
  background: #0f172a;
  color: #e2e8f0;
  margin: 0;
  padding: 24px;
}
h1 {
  font-family: Arial, sans-serif;
  font-size: 24px;
  margin: 0 0 16px;
  color: #93c5fd;
}
.meta {
  font-family: Arial, sans-serif;
  color: #94a3b8;
  margin: 0 0 20px;
}
pre {
  white-space: pre-wrap;
  word-break: break-word;
  background: #111827;
  border: 1px solid #334155;
  border-radius: 14px;
  padding: 18px;
  line-height: 1.45;
  font-size: 15px;
}
"""


def render_view(name: str, source_path: Path) -> None:
    title = name.replace("-", " ").title()
    body = source_path.read_text(encoding="utf-8")
    page = (
        "<!doctype html><html><head><meta charset='utf-8'>"
        f"<title>{title}</title><style>{STYLE}</style></head><body>"
        f"<h1>{title}</h1><p class='meta'>Fuente: {html.escape(str(source_path.relative_to(ROOT)))}</p>"
        f"<pre>{html.escape(body)}</pre></body></html>"
    )
    (OUTPUT_DIR / f"{name}.html").write_text(page, encoding="utf-8")


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for name, source_path in SOURCES.items():
        render_view(name, source_path)


if __name__ == "__main__":
    main()

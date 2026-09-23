#!/usr/bin/env python3
from pathlib import Path
import re, subprocess, sys

ROOT=Path(__file__).resolve().parents[1]
COACH=ROOT/"products"/"coach"
errors=[]

required=[
    COACH/"index.html",
    COACH/"coach-smart-intake-preview-v1.js",
    COACH/"README.md",
]
for p in required:
    if not p.exists():
        errors.append(f"MISSING: {p.relative_to(ROOT)}")

for p in ROOT.rglob("*"):
    if not p.is_file() or ".git" in p.parts:
        continue
    if p.name=="team-trial-config.example.js":
        continue
    if p.suffix.lower() not in {".html",".js",".json",".md",".py",".txt",".env"}:
        continue
    text=p.read_text(encoding="utf-8",errors="ignore")
    if re.search(r'mmh_[A-Za-z0-9_-]{12,}',text):
        errors.append(f"POSSIBLE HUB TOKEN: {p.relative_to(ROOT)}")
    if re.search(r'(?i)DEEPSEEK_API_KEY\s*=\s*\S+',text):
        errors.append(f"POSSIBLE PROVIDER KEY: {p.relative_to(ROOT)}")

tracked=subprocess.run(["git","ls-files"],cwd=ROOT,capture_output=True,text=True).stdout.splitlines()
if "products/coach/team-trial-config.js" in tracked:
    errors.append("PRIVATE TOKEN CONFIG IS TRACKED")

diff=subprocess.run(["git","diff","--check"],cwd=ROOT,capture_output=True,text=True)
if diff.returncode:
    errors.append("GIT DIFF CHECK FAILED:\\n"+diff.stdout+diff.stderr)

print("=== A2HUB COACH PRE-PUSH AUDIT ===")
if errors:
    for e in errors:
        print("FAIL:",e)
    print("PRE_GIT_AUDIT=FAIL")
    sys.exit(1)

print("SECRETS_IN_REPO=NONE_DETECTED")
print("PRIVATE_TRIAL_CONFIG_TRACKED=NO")
print("COACH_REQUIRED_FILES=PASS")
print("GIT_DIFF_CHECK=PASS")
print("PRE_GIT_AUDIT=PASS")

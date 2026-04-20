#!/usr/bin/env python3
"""
Katalyst LMS — Security Credential Rotation
Rotates what can be automated; guides manual steps for everything else.

Usage:
  python3 scripts/rotate-secrets.py            # rotate due secrets
  python3 scripts/rotate-secrets.py --force    # rotate all now
  python3 scripts/rotate-secrets.py --dry-run  # preview only
  python3 scripts/rotate-secrets.py --status   # show rotation ages

Schedule (weekly, macOS launchd):
  python3 scripts/rotate-secrets.py --install-cron
"""

import argparse
import json
import os
import re
import secrets
import string
import subprocess
import sys
from datetime import datetime, timedelta
from pathlib import Path

# ── Config ────────────────────────────────────────────────────────────────────

REPO_ROOT      = Path(__file__).parent.parent
TRACKING_FILE  = Path.home() / ".lms-secret-rotation.json"
LAUNCHD_PLIST  = Path.home() / "Library/LaunchAgents/today.learnkloud.rotate-secrets.plist"
ROTATION_DAYS  = 7   # rotate weekly
WARN_DAYS      = 5   # warn at 5 days old

VERCEL_PROJECT = "lms"
GITHUB_REPO    = "schinchli/katalyst-lms-web"
GITHUB_MOBILE  = "schinchli/katalyst-mobile"

# ANSI colours
R = "\033[31m"; Y = "\033[33m"; G = "\033[32m"; C = "\033[36m"; B = "\033[1m"; X = "\033[0m"

# ── Helpers ───────────────────────────────────────────────────────────────────

def run(cmd: list[str], capture=True, check=True) -> subprocess.CompletedProcess:
    return subprocess.run(cmd, capture_output=capture, text=True, check=check)

def gen_token(length=48) -> str:
    alphabet = string.ascii_letters + string.digits
    return "lk-" + "".join(secrets.choice(alphabet) for _ in range(length))

def load_tracking() -> dict:
    if TRACKING_FILE.exists():
        return json.loads(TRACKING_FILE.read_text())
    return {}

def save_tracking(data: dict):
    TRACKING_FILE.write_text(json.dumps(data, indent=2))
    TRACKING_FILE.chmod(0o600)

def age_days(iso_str: str) -> float:
    dt = datetime.fromisoformat(iso_str)
    return (datetime.now() - dt).total_seconds() / 86400

def now_iso() -> str:
    return datetime.now().isoformat()

def header(title: str):
    print(f"\n{B}{'─'*60}{X}")
    print(f"{B}{C}  {title}{X}")
    print(f"{B}{'─'*60}{X}")

def ok(msg):   print(f"  {G}✓{X}  {msg}")
def warn(msg): print(f"  {Y}⚠{X}  {msg}")
def err(msg):  print(f"  {R}✗{X}  {msg}")
def info(msg): print(f"  {C}→{X}  {msg}")

# ── Vercel helpers ────────────────────────────────────────────────────────────

def vercel_set(name: str, value: str, envs: list[str], dry_run: bool):
    """Remove + re-add a Vercel env var across specified environments."""
    for env in envs:
        if not dry_run:
            subprocess.run(
                ["vercel", "env", "rm", name, env, "--yes"],
                capture_output=True, text=True
            )
            proc = subprocess.run(
                ["vercel", "env", "add", name, env],
                input=value + "\n",
                capture_output=True, text=True
            )
            if proc.returncode != 0:
                raise RuntimeError(f"vercel env add failed: {proc.stderr.strip()}")
    ok(f"Vercel {name} updated in {', '.join(envs)}")

# ── GitHub helpers ────────────────────────────────────────────────────────────

def github_set(repo: str, name: str, value: str, dry_run: bool):
    if not dry_run:
        proc = run(["gh", "secret", "set", name, "--repo", repo, "--body", value])
        if proc.returncode != 0:
            raise RuntimeError(proc.stderr.strip())
    ok(f"GitHub secret {name} updated in {repo}")

# ── Auto-rotation tasks ───────────────────────────────────────────────────────

def rotate_setup_token(tracking: dict, dry_run: bool, force: bool) -> bool:
    key = "SETUP_TOKEN"
    last = tracking.get(key)
    age  = age_days(last) if last else 999

    if not force and last and age < ROTATION_DAYS:
        info(f"{key}: {age:.1f}d old — not due yet (rotates every {ROTATION_DAYS}d)")
        return False

    new_val = gen_token()
    try:
        vercel_set(key, new_val, ["production", "preview", "development"], dry_run)
        if not dry_run:
            tracking[key] = now_iso()
        ok(f"{key} rotated {'(dry-run)' if dry_run else ''}")
        return True
    except Exception as e:
        err(f"{key} rotation failed: {e}")
        return False


def rotate_jwt_secret(tracking: dict, dry_run: bool, force: bool) -> bool:
    """Internal signing secret used for any custom JWTs (not Supabase's own JWT)."""
    key = "INTERNAL_JWT_SECRET"
    last = tracking.get(key)
    age  = age_days(last) if last else 999

    if not force and last and age < ROTATION_DAYS:
        info(f"{key}: {age:.1f}d old — not due yet")
        return False

    new_val = secrets.token_hex(64)
    try:
        vercel_set(key, new_val, ["production", "preview"], dry_run)
        if not dry_run:
            tracking[key] = now_iso()
        ok(f"{key} rotated {'(dry-run)' if dry_run else ''}")
        return True
    except Exception as e:
        err(f"{key} rotation failed: {e}")
        return False

# ── Manual-rotation guidance ──────────────────────────────────────────────────

MANUAL_SECRETS = [
    {
        "name":    "SUPABASE_SERVICE_ROLE_KEY",
        "service": "Supabase",
        "steps": [
            "Go to supabase.com → Project → Settings → API",
            "Click 'Reset JWT Secret' (WARNING: invalidates all active sessions)",
            "Copy the new service_role key",
            "Update in Vercel: Dashboard → Settings → Env Vars",
            "Update in GitHub Secrets: SUPABASE_SERVICE_ROLE_KEY",
            "Update apps/web/.env.local locally",
        ],
    },
    {
        "name":    "SUPABASE_ACCESS_TOKEN",
        "service": "Supabase",
        "steps": [
            "Go to supabase.com → Account → Access Tokens",
            "Delete the current token",
            "Generate a new one",
            "Update SUPABASE_ACCESS_TOKEN in apps/web/.env.local",
        ],
    },
    {
        "name":    "STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET",
        "service": "Stripe",
        "steps": [
            "Go to dashboard.stripe.com → Developers → API Keys",
            "Roll the secret key",
            "Go to Developers → Webhooks → select endpoint → reveal signing secret",
            "Update STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET in Vercel env vars",
            "Update in apps/web/.env.local locally",
        ],
    },
    {
        "name":    "RECAPTCHA_SECRET_KEY",
        "service": "Google reCAPTCHA",
        "steps": [
            "Go to console.cloud.google.com → reCAPTCHA Enterprise",
            "Create a new key pair",
            "Update NEXT_PUBLIC_RECAPTCHA_SITE_KEY and RECAPTCHA_SECRET_KEY in Vercel",
            "Update in GitHub Secrets and apps/web/.env.local",
        ],
    },
    {
        "name":    "RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET",
        "service": "Razorpay",
        "steps": [
            "Go to dashboard.razorpay.com → Settings → API Keys",
            "Generate a new key pair",
            "Update RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in Supabase secrets vault",
            "Update in Vercel env vars",
        ],
    },
    {
        "name":    "EXPO_TOKEN",
        "service": "EAS / Expo",
        "steps": [
            "Go to expo.dev → Account → Access Tokens",
            "Revoke the current token",
            "Create a new one",
            "Update EXPO_TOKEN in GitHub Secrets",
        ],
    },
    {
        "name":    "GOOGLE_SERVICE_ACCOUNT_KEY",
        "service": "Google Play",
        "steps": [
            "Go to console.cloud.google.com → IAM → Service Accounts",
            "Select the Play Store service account",
            "Keys → Add Key → Create New Key (JSON)",
            "Update GOOGLE_SERVICE_ACCOUNT_KEY in GitHub Secrets",
        ],
    },
]

# ── Status report ─────────────────────────────────────────────────────────────

def show_status(tracking: dict):
    header("Rotation Status")
    auto_keys = ["SETUP_TOKEN", "INTERNAL_JWT_SECRET"]
    for k in auto_keys:
        last = tracking.get(k)
        if last:
            age = age_days(last)
            due = max(0, ROTATION_DAYS - age)
            colour = R if age >= ROTATION_DAYS else (Y if age >= WARN_DAYS else G)
            print(f"  {colour}{k}{X}: {age:.1f}d old, due in {due:.1f}d")
        else:
            print(f"  {R}{k}{X}: never rotated")

    print()
    warn("Manual secrets (check dashboard for rotation dates):")
    for s in MANUAL_SECRETS:
        print(f"    {Y}•{X} {s['name']}  [{s['service']}]")

# ── Main ──────────────────────────────────────────────────────────────────────

def install_cron():
    """Install a macOS launchd plist to run this script weekly (Sundays 9am)."""
    script_path = Path(__file__).resolve()
    plist = f"""<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>today.learnkloud.rotate-secrets</string>
    <key>ProgramArguments</key>
    <array>
        <string>{sys.executable}</string>
        <string>{script_path}</string>
    </array>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Weekday</key><integer>0</integer>
        <key>Hour</key><integer>9</integer>
        <key>Minute</key><integer>0</integer>
    </dict>
    <key>StandardOutPath</key>
    <string>{Path.home()}/.lms-rotate-secrets.log</string>
    <key>StandardErrorPath</key>
    <string>{Path.home()}/.lms-rotate-secrets.error.log</string>
    <key>RunAtLoad</key><false/>
</dict>
</plist>"""

    LAUNCHD_PLIST.parent.mkdir(parents=True, exist_ok=True)
    LAUNCHD_PLIST.write_text(plist)
    subprocess.run(["launchctl", "load", str(LAUNCHD_PLIST)], check=False)
    ok(f"Cron installed → {LAUNCHD_PLIST}")
    ok("Runs every Sunday at 9:00am")
    info(f"Logs → ~/.lms-rotate-secrets.log")


def main():
    parser = argparse.ArgumentParser(description="Katalyst LMS secret rotation")
    parser.add_argument("--force",        action="store_true", help="Rotate all secrets now regardless of age")
    parser.add_argument("--dry-run",      action="store_true", help="Preview changes without applying")
    parser.add_argument("--status",       action="store_true", help="Show rotation ages and exit")
    parser.add_argument("--install-cron", action="store_true", help="Install weekly macOS launchd job")
    args = parser.parse_args()

    tracking = load_tracking()

    if args.install_cron:
        install_cron()
        return

    if args.status:
        show_status(tracking)
        return

    header(f"Katalyst LMS — Secret Rotation {'(DRY RUN)' if args.dry_run else ''}")
    print(f"  {C}Rotation threshold:{X} {ROTATION_DAYS} days")
    print(f"  {C}Force:{X}            {args.force}")

    # ── Auto-rotatable ────────────────────────────────────────────────────────
    header("Auto-Rotating (Vercel env vars)")
    rotated = 0
    rotated += rotate_setup_token(tracking, args.dry_run, args.force)
    rotated += rotate_jwt_secret(tracking,  args.dry_run, args.force)

    if not args.dry_run:
        save_tracking(tracking)

    # ── Manual guidance ───────────────────────────────────────────────────────
    header("Manual Rotation Required")
    print(f"  {Y}The following secrets cannot be rotated automatically.{X}")
    print(f"  {Y}Review each service and rotate on a regular schedule.{X}\n")

    for secret in MANUAL_SECRETS:
        print(f"  {B}{secret['name']}{X}  [{C}{secret['service']}{X}]")
        for i, step in enumerate(secret["steps"], 1):
            print(f"    {i}. {step}")
        print()

    # ── Summary ───────────────────────────────────────────────────────────────
    header("Summary")
    if args.dry_run:
        warn(f"Dry-run complete — no changes applied")
    else:
        ok(f"{rotated} secret(s) auto-rotated")
    info("Run with --status to see rotation ages")
    info("Run with --install-cron to schedule weekly rotation")
    print()


if __name__ == "__main__":
    main()

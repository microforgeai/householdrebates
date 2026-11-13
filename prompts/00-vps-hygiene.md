# Prompt 00 — VPS hygiene: fix certbot renewal, dry-run, check disk, memory and backups

> Paste everything below the line into Antigravity. Run this **before** any other prompt touches the VPS. It works on the live server that hosts six sites, so it is split into a **read-only audit** and a **fix** stage with a hard stop between them.

---

## Context

- VPS: Hostinger, IP `72.61.117.132`, nginx, serves spinradio.app, agenorit.com.au, plantdoctor.io, microforgeai.com, havenlyescape.com.au (Next.js) and netpayworldwide.com (Astro). Static sites live in `/var/www/<site>/`; SSL is Let's Encrypt.
- Known problems (Websites Desk, 13 Nov 2026, read-only): the agenorit.com.au certificate expired on 16 Jun 2026 and plantdoctor.io's on 24 Sep 2026, so auto-renewal is broken. microforgeai.com has returned 502. VPS plan, spare capacity and backups are unknown.
- Next we'll add householdrebates.com.au (static Astro site + a small Node service on 127.0.0.1:8787 using about 50–200 MB RAM and a SQLite file). This prompt makes sure the box can take it.

## Rules for this session

1. Stage A is **read-only**. Don't change, restart, reload, install or delete anything in Stage A.
2. Never print private keys, `.env` contents or passwords into the chat or logs. Redact them.
3. Before every Stage B command that changes the server, show the exact command and wait for Guri to type **yes**.
4. Back up any file before you edit it: `sudo cp -a FILE FILE.bak-$(date +%Y%m%d-%H%M%S)`.
5. Always run `sudo nginx -t` before any nginx reload. Never `restart` nginx; use `reload`.
6. Don't touch DNS, Hostinger hPanel settings or billing. If something needs those, write it down for Guri.

## Goal

A written report (`ops/reports/00-vps-audit-<date>.md` in the householdrebates repo if it exists yet, otherwise `~/householdrebates-vps-audit-<date>.md` on Guri's machine) plus, after approval: certbot renewing every certificate that still points at this VPS, a passing `certbot renew --dry-run`, an nginx reload hook, and known disk/memory/backup headroom.

## Stage A — read-only audit

Connect with Guri's usual SSH user. Run and record the output (redacted):

```bash
# System
hostnamectl; uptime; cat /etc/os-release | head -4
nproc; free -m; swapon --show
df -hT /; df -i /
sudo du -xh --max-depth=1 /var 2>/dev/null | sort -h | tail -15
sudo journalctl --disk-usage
ls /var/run/reboot-required 2>/dev/null && echo "REBOOT REQUIRED"

# Processes
ps -eo pid,user,%mem,%cpu,rss,cmd --sort=-rss | head -15
systemctl list-units --type=service --state=running --no-pager | head -60
command -v pm2 && pm2 ls

# Web stack
nginx -v 2>&1; sudo nginx -t
ls -la /etc/nginx/sites-enabled/ /etc/nginx/conf.d/
sudo grep -rhoE "log_format\s+\S+|limit_req_zone[^;]+|map\s+\S+\s+\S+" /etc/nginx/ | sort -u
command -v node && node -v && readlink -f "$(command -v node)"
command -v php && php -v | head -1
command -v sqlite3 && sqlite3 --version
sudo ss -ltnp | grep -E ':(80|443|3000|8787|8080)\b'

# Firewall / hardening
sudo ufw status verbose 2>/dev/null || sudo iptables -S | head -30
systemctl is-active fail2ban unattended-upgrades 2>/dev/null

# Certbot
command -v certbot; certbot --version 2>&1
snap list certbot 2>/dev/null; dpkg -l | grep -i certbot
systemctl list-timers --all --no-pager | grep -iE "certbot|snap.certbot"
sudo crontab -l 2>/dev/null | grep -i certbot; grep -ri certbot /etc/cron* 2>/dev/null
sudo certbot certificates
sudo ls -la /etc/letsencrypt/renewal/ /etc/letsencrypt/renewal-hooks/*/
for f in /etc/letsencrypt/renewal/*.conf; do echo "== $f"; sudo grep -E "authenticator|installer|webroot_path|server|account" "$f"; done
sudo tail -n 80 /var/log/letsencrypt/letsencrypt.log

# Does each certificate's domain still resolve to this VPS?
for d in $(sudo certbot certificates 2>/dev/null | awk '/Domains:/{for(i=2;i<=NF;i++)print $i}'); do
  printf "%-35s %s\n" "$d" "$(dig +short A "$d" | tr '\n' ' ')"
done

# Live certificate dates as browsers see them
for d in agenorit.com.au plantdoctor.io microforgeai.com spinradio.app havenlyescape.com.au netpayworldwide.com; do
  printf "%-25s " "$d"; echo | openssl s_client -servername "$d" -connect "$d:443" 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null || echo "no cert / no answer"
done

# microforgeai.com 502 (diagnose only)
curl -sI https://microforgeai.com | head -5
sudo grep -l "microforgeai" /etc/nginx/sites-enabled/* | xargs -r sudo grep -nE "proxy_pass|root"
sudo tail -n 30 /var/log/nginx/error.log | grep -i microforge

# Backups
sudo ls -la /var/backups/ | head; sudo crontab -l 2>/dev/null; ls /etc/cron.d/
```

Then write the report with these headings:

1. **Summary table:** OS, uptime, CPU, RAM total/used/available, swap, disk used/free on `/`, inodes, reboot pending.
2. **Headroom verdict:** OK if **≥ 500 MB RAM available** (not counting cache) and **≥ 5 GB disk free**; otherwise say what to free or upgrade.
3. **Certbot diagnosis:** how certbot is installed (snap/apt/pip), whether a timer or cron exists and is enabled, each certificate's expiry, authenticator (`nginx` or `webroot`) and webroot path, and **the specific reason renewal failed** from `letsencrypt.log` (common: no timer; webroot path wrong; port 80 blocked; domain no longer points here; nginx config error; rate limit). List any certificate whose domain no longer resolves to 72.61.117.132.
4. **Node/PHP:** versions and paths; whether Node is system-wide (`/usr/bin/node`) or in a user's nvm.
5. **nginx names already in use:** `log_format`, `map` variables, `limit_req_zone` names (so later prompts avoid clashes); whether `/etc/letsencrypt/options-ssl-nginx.conf` exists.
6. **microforgeai.com 502:** likely cause (upstream down? which port?). Diagnose only.
7. **Backups:** what exists on the box. Write: "Guri to check hPanel → VPS → Backups/Snapshots and confirm schedule and retention."
8. **Proposed fixes:** numbered, each with the exact command(s), risk, and how to undo.

## STOP — Guri must approve

Show the report. Ask: "Approve fixes 1–N? (yes / pick numbers / no)". Do nothing else until he answers.

## Stage B — fixes (only those Guri approved)

Typical fixes (adapt to what Stage A found):

1. **Timer:** for snap certbot `sudo systemctl enable --now snap.certbot.renew.timer`; for apt `sudo systemctl enable --now certbot.timer`. If neither exists, add `/etc/cron.d/certbot-renew`: `17 3,15 * * * root certbot renew --quiet`.
2. **Reload hook** (so renewed certs are served): create `/etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh`:
   ```bash
   #!/bin/sh
   nginx -t && systemctl reload nginx
   ```
   `sudo chmod 755` it.
3. **Broken renewal config:** fix `webroot_path` or switch `authenticator` to match how each site's nginx block is set up (back up the `.conf` first).
4. **Domains that no longer point here:** don't delete anything; list them for Guri to decide (`certbot delete --cert-name X` only after his yes).
5. **Renew the expired certificates now** (agenorit.com.au, plantdoctor.io), one at a time: `sudo certbot renew --cert-name <name>`; then `sudo nginx -t && sudo systemctl reload nginx`.
6. **Create the ACME webroot** used by the new site later: `sudo mkdir -p /var/www/letsencrypt/.well-known/acme-challenge && sudo chown -R www-data:www-data /var/www/letsencrypt` (harmless, empty).
7. Disk: if < 5 GB free, propose `sudo journalctl --vacuum-time=14d` and old-release clean-ups. Ask first.
8. Memory: if no swap and < 1 GB RAM free, propose a 1 GB swapfile. Ask first.

## Acceptance checks (all must pass)

```bash
sudo certbot renew --dry-run
# expect: "Congratulations, all simulated renewals succeeded" and no "failed" lines
systemctl list-timers --all --no-pager | grep -iE "certbot"
# expect: one enabled timer with a NEXT time in the next 12 h (or the cron file present)
ls -l /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
# expect: -rwxr-xr-x
sudo nginx -t
# expect: "syntax is ok" and "test is successful"
for d in agenorit.com.au plantdoctor.io; do echo | openssl s_client -servername $d -connect $d:443 2>/dev/null | openssl x509 -noout -enddate; done
# expect: notAfter dates ~90 days from today (only for domains that still point here)
free -m; df -h /
# expect: available RAM ≥ 500 MB, free disk ≥ 5 GB (or a written plan agreed with Guri)
```

## What to test

- Every site in the list still loads over HTTPS after the reload (`curl -sI https://<site> | head -1` → `HTTP/2 200` or the site's normal redirect).
- No new errors in `sudo tail -n 50 /var/log/nginx/error.log`.

## Done when

The report is saved, approved fixes are applied, every acceptance check passes, and the report lists the leftovers for Guri (hPanel backups, domains no longer pointing here, microforgeai.com 502).

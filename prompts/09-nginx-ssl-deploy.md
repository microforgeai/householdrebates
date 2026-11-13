# Prompt 09 — DNS, nginx, SSL, systemd and deploy scripts (pre-launch, password-protected)

> This prompt touches the **live VPS and DNS**. Prompt 00 must be complete (certbot renewal fixed and dry-run passing). Every stage ends with a STOP for Guri's yes. The site goes up **behind a password and `noindex`** for QA; it is not public until prompt 14. The lead form stays off.

---

## Context

- VPS `72.61.117.132` (Hostinger), nginx, six other live sites. Static sites live in `/var/www/<site>/`; Let's Encrypt for SSL.
- Household Rebates: static Astro build → `/var/www/householdrebates/releases/<ts>-<sha>/`, `current` symlink; lead API → `/opt/householdrebates-api/releases/…`, systemd `hr-leads.service` on `127.0.0.1:8787`, SQLite at `/var/lib/householdrebates/leads.db`, env at `/etc/householdrebates/api.env`.
- Exact config text: `docs/solution-design.md` §8 (http-context file, headers snippet, server blocks, systemd unit, logrotate, backups) and §9 (deploy layout and scripts). Use the names from prompt 00's report to avoid clashes.

## Rules

1. Show every server-changing command before running it; wait for **yes** at each STOP.
2. Back up any existing file before editing. Never edit another site's config.
3. `sudo nginx -t` before every reload; `reload`, never `restart`.
4. Secrets are typed by Guri directly on the server (`sudoedit /etc/householdrebates/api.env`). Never echo them, never paste them into chat, never commit them.

## Stage 1 — repo files (local, no server)

1. Fill `ops/` from solution-design §8–9:
   - `ops/nginx/householdrebates-http.conf` (maps, log formats, `hr_api` and `hr_api_read` zones).
   - `ops/nginx/householdrebates-headers.conf` (snippet).
   - `ops/nginx/householdrebates-prelaunch.conf` (snippet): `auth_basic "Household Rebates — preview"; auth_basic_user_file /etc/nginx/householdrebates.htpasswd; add_header X-Robots-Tag "noindex, nofollow" always;`
   - `ops/nginx/householdrebates.com.au.http-only.conf` (port 80 only: ACME webroot + a 503 "coming soon" for everything else) — used to obtain the certificate.
   - `ops/nginx/householdrebates.com.au.conf` — full config from §8.3 with `include snippets/householdrebates-prelaunch.conf;` inside the main `server { … }` and in `location /`, `/_astro/`, images, API locations (because each sets its own headers). Use `listen 443 ssl http2;` instead of `http2 on;` if prompt 00 found nginx < 1.25.1. Only `include /etc/letsencrypt/options-ssl-nginx.conf` if it exists.
   - `ops/systemd/hr-leads.service`, `hr-backup.service`, `hr-backup.timer` (OnCalendar `*-*-* 02:30:00 Australia/Melbourne`), `hr-purge.service`, `hr-purge.timer` (03:15).
   - `ops/logrotate/householdrebates` (30 days; 180 for `householdrebates.ai.log`).
   - `ops/deploy-site.sh`, `ops/deploy-api.sh`, `ops/rollback.sh`, `ops/backup.sh`, `ops/ai-report.sh` per §9 and §8.5. `set -euo pipefail`; target host/user from `ops/deploy.env` (git-ignored; `deploy.env.example` committed).
2. `shellcheck ops/*.sh` → no warnings. Commit.

## STOP A — DNS (Guri)

Guri, in Hostinger hPanel → Domains → householdrebates.com.au → DNS: add `A @ 72.61.117.132` and `A www 72.61.117.132` (or `CNAME www → householdrebates.com.au`), TTL 300. **Don't change MX/TXT here** (that's prompt 11). Confirm with:
```bash
dig +short A householdrebates.com.au; dig +short A www.householdrebates.com.au
# expect: 72.61.117.132 for both (may take minutes to hours)
```

## Stage 2 — server prep (after Guri's yes)

```bash
# Users and folders
sudo adduser --system --group --no-create-home --shell /usr/sbin/nologin hrapi
sudo adduser --disabled-password --gecos "" deploy            # skip if prompt 00 found an existing deploy user to reuse
sudo install -d -o deploy -g www-data -m 2755 /var/www/householdrebates/releases
sudo install -d -o deploy -g hrapi    -m 2750 /opt/householdrebates-api/releases
sudo install -d -o hrapi  -g hrapi    -m 0700 /var/lib/householdrebates
sudo install -d -o root   -g hrapi    -m 0750 /etc/householdrebates
sudo install -d -o root   -g root     -m 0700 /var/backups/householdrebates
# Deploy key: Guri adds his public key to /home/deploy/.ssh/authorized_keys (key only)
# Limited sudo for deploy:
echo 'deploy ALL=(root) NOPASSWD: /usr/bin/systemctl restart hr-leads, /usr/sbin/nginx -t, /usr/bin/systemctl reload nginx' | sudo tee /etc/sudoers.d/householdrebates-deploy
sudo chmod 440 /etc/sudoers.d/householdrebates-deploy && sudo visudo -cf /etc/sudoers.d/householdrebates-deploy
# Tools
sudo apt-get install -y sqlite3 age apache2-utils     # only those missing (prompt 00 report)
# Node: use system Node at /usr/bin/node (prompt 00). If missing, install Node LTS from NodeSource — ask first.
```
Preview password: `sudo htpasswd -c /etc/nginx/householdrebates.htpasswd guri` (Guri types the password).

## Stage 3 — certificate

First copy the config files to the server (from Guri's machine): `ssh <admin-user>@72.61.117.132 mkdir -p hr-ops && rsync -az ops api/.env.example <admin-user>@72.61.117.132:hr-ops/` — then on the server `cd ~/hr-ops` and run the commands below as written (`ops/…` paths resolve there).

```bash
sudo cp ops/nginx/householdrebates.com.au.http-only.conf /etc/nginx/sites-available/householdrebates.com.au.conf
sudo ln -s /etc/nginx/sites-available/householdrebates.com.au.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
curl -sI http://householdrebates.com.au/ | head -1          # expect: HTTP/1.1 503
sudo certbot certonly --webroot -w /var/www/letsencrypt -d householdrebates.com.au -d www.householdrebates.com.au \
  --email <<GURI_EMAIL>> --agree-tos --no-eff-email
sudo certbot renew --dry-run --cert-name householdrebates.com.au     # expect: success
```

## Stage 4 — full nginx config, site and API (form OFF)

```bash
# nginx
sudo cp ops/nginx/householdrebates-http.conf /etc/nginx/conf.d/
sudo cp ops/nginx/householdrebates-headers.conf ops/nginx/householdrebates-prelaunch.conf /etc/nginx/snippets/
sudo cp ops/nginx/householdrebates.com.au.conf /etc/nginx/sites-available/householdrebates.com.au.conf
sudo nginx -t && sudo systemctl reload nginx
sudo cp ops/logrotate/householdrebates /etc/logrotate.d/ && sudo logrotate -d /etc/logrotate.d/householdrebates

# API env (Guri types secrets; LEADS_ENABLED=false)
sudo install -o root -g hrapi -m 0640 ~/hr-ops/.env.example /etc/householdrebates/api.env
sudoedit /etc/householdrebates/api.env
# generate secrets on the server, paste only into the file:  openssl rand -base64 48

# systemd
sudo cp ops/systemd/hr-*.service ops/systemd/hr-*.timer /etc/systemd/system/
sudo systemctl daemon-reload

# Deploy (from Guri's machine)
PUBLIC_LEADS_ENABLED=false ./ops/deploy-site.sh
./ops/deploy-api.sh                    # installs deps, migrates, swaps symlink, restarts, health check
sudo systemctl enable --now hr-leads hr-backup.timer hr-purge.timer
```

## Acceptance checks

```bash
curl -sI http://householdrebates.com.au/ | grep -iE "^HTTP|^location"
# expect: 301 → https://householdrebates.com.au/
curl -sI https://www.householdrebates.com.au/ | grep -iE "^HTTP|^location"
# expect: 301 → https://householdrebates.com.au/
curl -sI https://householdrebates.com.au/ | grep -iE "^HTTP|www-authenticate|x-robots-tag"
# expect: HTTP/2 401, WWW-Authenticate: Basic, X-Robots-Tag: noindex, nofollow
curl -s -u guri:<pw> -D - https://householdrebates.com.au/ -o /dev/null | grep -iE "^HTTP|strict-transport|content-security|x-content-type|referrer-policy|cache-control"
# expect: HTTP/2 200 + all five headers; cache-control: no-cache
curl -s -u guri:<pw> -I https://householdrebates.com.au/_astro/$(ssh deploy@72.61.117.132 'ls /var/www/householdrebates/current/_astro | head -1') | grep -i cache-control
# expect: public, max-age=31536000, immutable
curl -s -u guri:<pw> https://householdrebates.com.au/api/health
# expect: {"ok":true,"db":"ok","leadsEnabled":false}
curl -s -u guri:<pw> -o /dev/null -w "%{http_code}\n" -X POST https://householdrebates.com.au/api/leads -d "x=1"
# expect: 503 (form closed) — or 403 if the Origin check runs first
curl -s -u guri:<pw> -o /dev/null -w "%{http_code}\n" https://householdrebates.com.au/api/anything
# expect: 404
systemctl is-active hr-leads; systemctl list-timers | grep -E "hr-(backup|purge)"
# expect: active; two timers listed
sudo -u hrapi test -w /var/lib/householdrebates && echo writable          # expect: writable
sudo ss -ltnp | grep 8787                                                  # expect: 127.0.0.1:8787 only
echo | openssl s_client -servername householdrebates.com.au -connect householdrebates.com.au:443 2>/dev/null | openssl x509 -noout -issuer -enddate
# expect: Let's Encrypt issuer; notAfter ~90 days out
for s in agenorit.com.au plantdoctor.io spinradio.app havenlyescape.com.au netpayworldwide.com; do printf "%s " $s; curl -s -o /dev/null -w "%{http_code}\n" https://$s/; done
# expect: each site's normal status (unchanged from prompt 00)
./ops/rollback.sh site && ./ops/deploy-site.sh       # expect: rollback then re-deploy both succeed
sudo systemctl start hr-backup.service && sudo ls -l /var/backups/householdrebates/   # expect: one .age file
sudo tail -n 3 /var/log/nginx/householdrebates.access.log                   # expect: lines with ai_ref= ai_bot= fields
```

## What to test

- SSL Labs (https://www.ssllabs.com/ssltest/) → A or better.
- securityheaders.com → A (CSP present).
- Browser console on 3 pages: no CSP violations.

## STOP points recap

A: DNS records. Stage 2: users/sudoers/packages. Stage 3: certificate. Stage 4: nginx, systemd, first deploy. Each needs Guri's **yes**. The site stays password-protected and `noindex`; going public is prompt 14.

# Household Rebates – Go-Live Checklist

Last updated: 15 Nov 2026. Tick with [x] as you go.

## Done (local branches, not pushed)
- [x] 24 Election notice
- [x] 34 Import corrections
- [x] 25 Figure labels
- [x] 26 Text defects
- [x] 27 FAQ dedupe
- [x] 35a Checker engine
- [x] 35b Checker UI
- [x] 36 Postcode page + bundle trim
- [x] 28 Business hub + 4 pages
- [x] 29a Email alerts back end (flags off)
- [x] 29b Alerts sign-up (hidden)
- [x] 30 Battery, solar, other VEU pages
- [x] 31 Help in your language
- [x] 32 Author/schema (no bio, author page hidden)

## Antigravity – in order
- [x] 32 follow-up: no-bio decision committed (b693038)
- [x] 37 North-west corridor page (384a7cc)
- [x] 38 Council pages: Macedon Ranges, Mitchell, Latrobe Valley, Mildura (c59c5da)
- [x] 39 Metro hubs + Melbourne rescope, containment now a hard gate (34b1209)
- [x] 33 Internal links, footer, LPG homes page (9262dd7)
- [x] 40 Legal fixes #1-#28, facts held as <<...>> placeholders (48147b0)

## Guri – hand checks
- [ ] Midday Power Saver page matches copy (1 Oct 2026, free 11am–2pm, opt in via retailer)
- [ ] Energy Victoria translations page lists 11 languages
- [ ] Punjabi label reads right: ਸੋਲਰ ਹੋਮਜ਼ ਪ੍ਰੋਗਰਾਮ
- [ ] Confirm the 8 Energy Victoria pages from 35a were hand-checked
- [ ] Remove the Macedon bulk-buy closed note after 30 Nov 2026

## Waiting on others
- [x] Venture Architect legal review received (docs/legal/legal-review-2026-11-15.md)
- [x] Legal fixes applied

## Before go-live (each needs Guri's yes)
- [ ] Decide: review enough, or short fixed-fee lawyer check
- [ ] Confirm VPS country in hPanel (review says Kuala Lumpur, not AU): move to AU server or name the country (fills <<SERVER_COUNTRY>>)
- [ ] Pick mailbox retention period + set auto-delete (suggest 24 months; fills <<MAILBOX_RETENTION_PERIOD>>)
- [ ] Alerts sender postal address: PO box or registered office, never home (fills <<ALERTS_SENDER_ADDRESS>>)
- [ ] Decide: opt Agenor in to the Privacy Act (free OAIC form)
- [ ] Pick email provider for alerts (alerts stay off until then)
- [ ] Post-election re-check of rules and figures
- [ ] Create `/opt/householdrebates-api` owned by the deploy user before lead-form / API go-live
- [ ] Merge branches
- [ ] Push to GitHub
- [ ] Deploy to VPS

## After go-live
- [x] Weekly watcher on official source pages (set up, Mondays ~8am)
- [ ] Switch on alerts (only after legal + provider)

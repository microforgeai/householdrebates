"""Render prompts 24+ (business review 14 Nov 2026 + 64-URL pack) from tpl2/.

Unlike gen.py (which asserts the original 53-row map and rewrites prompts 15-23),
this reads the current url-map.csv (74 rows since 14 Nov 2026; Wave 4 = rows 65-74) and only writes the files in tpl2/.
It never touches prompts 00-23. Placeholders:
  {{BLOCK:<name>}}  -> blocks/<name>.md
  {{PAGES:a-b}}     -> one page block per url-map.csv row a..b (same layout as gen.py)
The old {{ADDROWS}}/{{NEWPAGES}} placeholders (additions.py) are retired: rows 65-74
are in the master map, and url-map-additions-2026-11-14.csv is superseded.
"""
import csv, re, sys, pathlib
HERE = pathlib.Path(__file__).parent
BASE = HERE.parent
rows = list(csv.DictReader(open(BASE / 'url-map.csv', newline='')))
assert len(rows) >= 74, len(rows)  # 74-row master map (Wave 4 merged 14 Nov 2026)
BLOCKS = {p.stem: p.read_text() for p in (HERE / 'blocks').glob('*.md')}

def file_for(r):
    s = r['url_slug'].strip('/').split('/')[-1]
    tpl = r['page_type_template']
    if r['url_slug'].startswith('/about/'):
        return f'`site/src/content/pages/about-{s}.mdx` (served at `{r["url_slug"]}` by a new `site/src/pages/about/[slug].astro`)'
    if tpl.startswith('Area'):
        return f'`site/src/content/areas/vic/{s}.mdx`'
    if tpl.startswith('Tool'):
        return f'`{s}.mdx`, in the same collection and folder as `eligibility-checker.mdx` (prompt 07), with `ToolLayout`, served at `/victoria/{s}/` by the same route'
    return f'`site/src/content/guides/vic/{s}.mdx`'

def page_block(i):
    r = rows[i - 1]
    facts = [f.strip() for f in r['key_verified_facts_with_source_urls'].split(' | ') if f.strip()]
    il = [l.strip() for l in r['internal_links'].split(';') if l.strip()]
    out = [f"### Row {i}: `{r['url_slug']}`", "",
           f"- **File:** {file_for(r)}",
           f"- **Template (map):** {r['page_type_template']}",
           f"- **Primary question (build the H1 and answer block on it):** {r['primary_target_question']}",
           f"- **Secondary questions (a section or FAQ item each):** {r['secondary_questions'].replace(' | ', ' · ')}",
           f"- **Priority / intent:** {r['priority_and_intent']}",
           f"- **CTA:** {r['cta']}",
           "- **Verified facts you may use (checked " + r['facts_checked_on'] + "; re-open each source while writing):**"]
    out += [f"  - {f}" for f in facts]
    out.append("- **Internal links (each one is required once its target is enabled in `rollout.json`; `check-urlmap` fails without them):** " + " · ".join(f"`{l}`" for l in il))
    out.append(f"- **Map notes (follow them; anything UNVERIFIED or ASSUMPTION is handled as the rules say):** {r['notes']}")
    return "\n".join(out)

def render(text):
    text = re.sub(r'\{\{PAGES:(\d+)-(\d+)\}\}', lambda m: "\n\n".join(page_block(i) for i in range(int(m.group(1)), int(m.group(2)) + 1)), text)
    text = re.sub(r'\{\{BLOCK:([a-z0-9-]+)\}\}', lambda m: BLOCKS[m.group(1)].strip(), text)
    assert '{{' not in text, 'unresolved placeholder'
    return text

if __name__ == '__main__':
    for t in sorted((HERE / 'tpl2').glob('*.md')):
        (BASE / 'prompts' / t.name).write_text(render(t.read_text()))
        print('wrote', t.name)

import csv, re, sys, pathlib
BASE = pathlib.Path('/workspace/ventures/niche-sites/household-rebates')
rows = list(csv.DictReader(open(BASE/'url-map.csv', newline='')))
assert len(rows) == 53, len(rows)
sys.path.insert(0, str(BASE/'.url-map-generator'))
from sources import S
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from extras import E
BLOCKS = {p.stem: p.read_text() for p in (pathlib.Path(__file__).parent/'blocks').glob('*.md')}

def links(t):
    t = re.sub(r'\[\[(\w+)\]\]', lambda m: f'(source: <{S[m.group(1)][1]}>)', t)
    return re.sub(r'<(https?://[^>]+)>', lambda m: f'<{m.group(1)}>', t)

def file_for(r):
    s = r['url_slug'].strip('/').split('/')[-1]
    tpl = r['page_type_template']
    if r['url_slug'] == '/victoria/':
        return '`site/src/content/pages/victoria.mdx` (rendered by the new `site/src/pages/victoria/index.astro`)'
    if tpl.startswith('Area'):
        return f'`site/src/content/areas/vic/{s}.mdx`'
    if tpl.startswith('Tool'):
        return f'`{s}.mdx`, in the same collection and folder as `eligibility-checker.mdx` (prompt 07), with `ToolLayout`, served at `/victoria/{s}/` by the same route'
    return f'`site/src/content/guides/vic/{s}.mdx`'

def page_block(i):
    r = rows[i-1]
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
    out += [f"  - {links(f)}" for f in facts]
    out.append("- **Internal links (every one required; `check-urlmap` fails without them):** " + " · ".join(f"`{l}`" for l in il))
    out.append(f"- **Map notes (follow them; anything UNVERIFIED stays off the page):** {links(r['notes'])}")
    out += [f"- {x}" for x in E.get(i, [])]
    return "\n".join(out)

def render(text):
    def pages(m):
        a, b = map(int, m.group(1).split('-'))
        return "\n\n".join(page_block(i) for i in range(a, b+1))
    text = re.sub(r'\{\{PAGES:(\d+-\d+)\}\}', pages, text)
    text = re.sub(r'\{\{BLOCK:([a-z0-9-]+)\}\}', lambda m: BLOCKS[m.group(1)].strip(), text)
    assert '{{' not in text, 'unresolved placeholder'
    return text

if __name__ == '__main__':
    for t in sorted((pathlib.Path(__file__).parent/'tpl').glob('*.md')):
        (BASE/'prompts'/t.name).write_text(render(t.read_text()))
        print('wrote', t.name)

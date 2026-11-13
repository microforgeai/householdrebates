import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import {
  assess,
  decodeCompactPostcodes,
  type CheckerAnswers,
  type PostcodeLookup,
} from '../../src/lib/eligibility';
import { VIC_ELIGIBILITY_RULES } from '../../src/data/eligibility/vic-rules';
import { ELIGIBILITY_NOTES } from '../../src/data/eligibility/notes';
import { RESULT_LINKS } from '../../src/data/eligibility/result-links';
import type { FigureData } from '../../src/lib/figures';
import postcodesJson from '../../src/data/postcodes.json';

const siteRoot = path.resolve(__dirname, '../..');
const figuresYaml = fs.readFileSync(
  path.join(siteRoot, 'src/content/figures/vic-veu.yaml'),
  'utf8',
);
const FIGURES = YAML.parse(figuresYaml) as FigureData[];
const FIGURE_IDS = new Set(FIGURES.map((f) => f.id));
const POSTCODES = postcodesJson.rows as PostcodeLookup;

const BASE_ANSWERS: CheckerAnswers = {
  q1State: 'vic',
  q2Activities: ['rcac'],
  q3WorkStage: 'no',
  q4PropertyType: 'home',
  q5Tenure: 'own',
  q6BuildingOver2Years: 'yes',
  q7aCurrentHeating: 'room-gas',
  q7bTargetHeating: 'split',
  q8aCurrentHotWater: 'mains-gas',
  q8bPreviousHotWaterUpgrades: '0',
  q9aPostcode: '3000',
  q9bCeilingNow: 'none',
  q9cUnsafeCeiling: 'no',
  q10aCooktopNow: 'gas',
  q10bClaimedBefore: 'no',
  q10cCooktopTarget: 'builtin_or_freestanding',
  q11aHomeType: 'house',
  q11bOpenFluedGas: 'no',
};

const BANNED_OUTPUT_PHRASES = [
  'you will get',
  'you qualify',
  'guaranteed',
  'free air con',
  'free air-con',
  'government rebate approved',
  'claim now',
];

describe('Eligibility Checker — assess()', () => {
  // --- Original 15 baseline cases ---
  it('1. returns OUT_OF_AREA when property is outside Victoria', () => {
    const res = assess({ ...BASE_ANSWERS, q1State: 'other' }, VIC_ELIGIBILITY_RULES, FIGURES, POSTCODES);
    expect(res.overallStatus).toBe('OUT_OF_AREA');
    expect(res.allowForm).toBe(false);
    expect(res.externalLink?.url).toContain('energy.gov.au');
  });

  it('2. returns BUSINESS when property is a business', () => {
    const res = assess(
      { ...BASE_ANSWERS, q4PropertyType: 'business' },
      VIC_ELIGIBILITY_RULES,
      FIGURES,
      POSTCODES,
    );
    expect(res.overallStatus).toBe('BUSINESS');
    expect(res.allowForm).toBe(false);
  });

  it('3. returns RETRO when heating/cooling system is already installed or work has started', () => {
    const res = assess(
      { ...BASE_ANSWERS, q3WorkStage: 'installed_or_started' },
      VIC_ELIGIBILITY_RULES,
      FIGURES,
      POSTCODES,
    );
    expect(res.overallStatus).toBe('RETRO');
    expect(res.allowForm).toBe(false);
    expect(res.resultLinks).toContain('retro');
  });

  it('4. flags productBoughtFlag and cautionBanner when RCAC product is bought but not installed', () => {
    const res = assess(
      { ...BASE_ANSWERS, q3WorkStage: 'bought_not_installed' },
      VIC_ELIGIBILITY_RULES,
      FIGURES,
      POSTCODES,
    );
    expect(res.overallStatus).toBe('LIKELY');
    expect(res.allowForm).toBe(true);
    expect(res.productBoughtFlag).toBe(true);
    expect(res.cautionBanner).toContain('retrospective discounts are typically not possible');
  });

  it('5. maps room gas -> split RCAC to the $630 to $1,610 range figure', () => {
    const res = assess(BASE_ANSWERS, VIC_ELIGIBILITY_RULES, FIGURES, POSTCODES);
    expect(res.overallStatus).toBe('LIKELY');
    expect(res.items[0].figureIds).toEqual(['vic-veu-rcac-room-gas']);
    expect(res.summary).toContain('$630 to $1,610');
  });

  it('6. maps ducted gas -> ducted RCAC to all three capacity rows (10, 16, 22.4 kW)', () => {
    const res = assess(
      {
        ...BASE_ANSWERS,
        q7aCurrentHeating: 'ducted-gas',
        q7bTargetHeating: 'ducted',
      },
      VIC_ELIGIBILITY_RULES,
      FIGURES,
      POSTCODES,
    );
    expect(res.items[0].figureIds).toEqual([
      'vic-veu-rcac-ducted-gas-10kw',
      'vic-veu-rcac-ducted-gas-16kw',
      'vic-veu-rcac-ducted-gas-22kw',
    ]);
  });

  it('7. returns LIKELY_NOT with no-decommission path when building <2 years old is replacing a heater', () => {
    const res = assess(
      {
        ...BASE_ANSWERS,
        q6BuildingOver2Years: 'no',
        q7aCurrentHeating: 'room-gas',
      },
      VIC_ELIGIBILITY_RULES,
      FIGURES,
      POSTCODES,
    );
    expect(res.overallStatus).toBe('LIKELY_NOT');
    expect(res.allowForm).toBe(false);
    expect(res.items[0].figureIds).toContain('vic-veu-rcac-room-no-decomm');
  });

  it('8. distinguishes mains gas ($560) vs electric ($630) hot water to heat pump', () => {
    const gasRes = assess(
      {
        ...BASE_ANSWERS,
        q2Activities: ['hotwater'],
        q8aCurrentHotWater: 'mains-gas',
      },
      VIC_ELIGIBILITY_RULES,
      FIGURES,
      POSTCODES,
    );
    expect(gasRes.overallStatus).toBe('LIKELY');
    expect(gasRes.summary).toContain('$560');
    expect(gasRes.items[0].notes.join(' ')).toContain('1 March 2027');

    const elecRes = assess(
      {
        ...BASE_ANSWERS,
        q2Activities: ['hotwater'],
        q8aCurrentHotWater: 'electric',
      },
      VIC_ELIGIBILITY_RULES,
      FIGURES,
      POSTCODES,
    );
    expect(elecRes.overallStatus).toBe('LIKELY');
    expect(elecRes.summary).toContain('$630');
  });

  it('9. returns LIKELY_NOT when hot water current system is none', () => {
    const res = assess(
      { ...BASE_ANSWERS, q2Activities: ['hotwater'], q8aCurrentHotWater: 'none' },
      VIC_ELIGIBILITY_RULES,
      FIGURES,
      POSTCODES,
    );
    expect(res.items[0].status).toBe('LIKELY_NOT');
  });

  it('10. returns LIKELY_NOT when hot water building is under 2 years old', () => {
    const res = assess(
      { ...BASE_ANSWERS, q2Activities: ['hotwater'], q6BuildingOver2Years: 'no' },
      VIC_ELIGIBILITY_RULES,
      FIGURES,
      POSTCODES,
    );
    expect(res.items[0].status).toBe('LIKELY_NOT');
  });

  it('11. returns LIKELY_NOT when 2+ hot water systems have already been upgraded at the address', () => {
    const res = assess(
      { ...BASE_ANSWERS, q2Activities: ['hotwater'], q8bPreviousHotWaterUpgrades: '2_plus' },
      VIC_ELIGIBILITY_RULES,
      FIGURES,
      POSTCODES,
    );
    expect(res.items[0].status).toBe('LIKELY_NOT');
  });

  it('12. returns POSSIBLE for broken solar hot water with provider category note', () => {
    const res = assess(
      { ...BASE_ANSWERS, q2Activities: ['hotwater'], q8aCurrentHotWater: 'broken-solar' },
      VIC_ELIGIBILITY_RULES,
      FIGURES,
      POSTCODES,
    );
    expect(res.items[0].status).toBe('POSSIBLE');
    expect(res.items[0].noteIds).toContain('hw-broken-solar');
  });

  it('13. returns POSSIBLE when target heating is not_sure and lists household rows', () => {
    const res = assess(
      { ...BASE_ANSWERS, q7bTargetHeating: 'not_sure' },
      VIC_ELIGIBILITY_RULES,
      FIGURES,
      POSTCODES,
    );
    expect(res.items[0].status).toBe('POSSIBLE');
    expect(res.items[0].figureIds.length).toBeGreaterThan(5);
  });

  it('14. supports legacy q2Upgrade="both" compatibility', () => {
    const res = assess(
      { ...BASE_ANSWERS, q2Activities: undefined, q2Upgrade: 'both' },
      VIC_ELIGIBILITY_RULES,
      FIGURES,
      POSTCODES,
    );
    expect(res.items).toHaveLength(2);
  });

  it('15. includes renter and landlord notes and never uses banned phrases', () => {
    const res = assess(
      {
        ...BASE_ANSWERS,
        q2Activities: ['rcac', 'hotwater'],
        q5Tenure: 'rent',
      },
      VIC_ELIGIBILITY_RULES,
      FIGURES,
      POSTCODES,
    );
    expect(res.sharedNotes.join(' ')).toContain("landlord's approval");
    expect(res.sharedNotes.join(' ')).toContain('1 March 2027');

    const serialized = JSON.stringify(res).toLowerCase();
    for (const banned of BANNED_OUTPUT_PHRASES) {
      expect(serialized).not.toContain(banned);
    }
  });

  // --- Prompt 16 new cases (20+ tests) ---
  it('16. ducted gas -> ducted shows LIKELY and copay-hc with vic-veu-copay-ducted', () => {
    const res = assess(
      {
        ...BASE_ANSWERS,
        q7aCurrentHeating: 'ducted-gas',
        q7bTargetHeating: 'ducted',
      },
      VIC_ELIGIBILITY_RULES,
      FIGURES,
      POSTCODES,
    );
    expect(res.items[0].status).toBe('LIKELY');
    const copay = res.items[0].noteItems.find((n) => n.id === 'copay-hc');
    expect(copay).toBeDefined();
    expect(copay?.figureIds).toEqual(['vic-veu-copay-ducted']);
  });

  it('17. ducted gas -> splits includes multi-split >=10kW, <10kW, and single split <10kW co-payments', () => {
    const res = assess(
      {
        ...BASE_ANSWERS,
        q7aCurrentHeating: 'ducted-gas',
        q7bTargetHeating: 'split',
      },
      VIC_ELIGIBILITY_RULES,
      FIGURES,
      POSTCODES,
    );
    const copay = res.items[0].noteItems.find((n) => n.id === 'copay-hc');
    expect(copay?.figureIds).toContain('vic-veu-copay-multisplit-10kw-plus');
    expect(copay?.figureIds).toContain('vic-veu-copay-multisplit-under-10kw');
    expect(copay?.figureIds).toContain('vic-veu-copay-split-under-10kw');
  });

  it('18. room gas -> split includes vic-veu-copay-split-under-10kw and nonducted-10kw-plus', () => {
    const res = assess(BASE_ANSWERS, VIC_ELIGIBILITY_RULES, FIGURES, POSTCODES);
    const copay = res.items[0].noteItems.find((n) => n.id === 'copay-hc');
    expect(copay?.figureIds).toContain('vic-veu-copay-split-under-10kw');
    expect(copay?.figureIds).toContain('vic-veu-copay-nonducted-10kw-plus');
  });

  it('19. hot water LPG returns POSSIBLE, empty figureIds, and lpg-provider-confirms + lpg-not-covered', () => {
    const res = assess(
      {
        ...BASE_ANSWERS,
        q2Activities: ['hotwater'],
        q8aCurrentHotWater: 'lpg',
      },
      VIC_ELIGIBILITY_RULES,
      FIGURES,
      POSTCODES,
    );
    expect(res.items[0].status).toBe('POSSIBLE');
    expect(res.items[0].figureIds).toEqual([]);
    expect(res.items[0].noteIds).toContain('lpg-provider-confirms');
    expect(res.items[0].noteIds).toContain('lpg-not-covered');
  });

  it('20. insulation in 3350 (Regional + Cold), none, no halogens -> LIKELY, regional highlighted, insulation-postcode', () => {
    const res = assess(
      {
        ...BASE_ANSWERS,
        q2Activities: ['insulation'],
        q9aPostcode: '3350',
        q9bCeilingNow: 'none',
        q9cUnsafeCeiling: 'no',
      },
      VIC_ELIGIBILITY_RULES,
      FIGURES,
      POSTCODES,
    );
    const item = res.items[0];
    expect(item.status).toBe('LIKELY');
    expect(item.figureIds).toEqual([
      'vic-veu-insulation-metro',
      'vic-veu-insulation-regional',
      'vic-veu-copay-insulation',
    ]);
    expect(item.highlightedFigureIds).toEqual(['vic-veu-insulation-regional']);
    expect(item.noteIds).toContain('insulation-postcode');
    expect(res.allowForm).toBe(false);
  });

  it('21. insulation in 3216 (Geelong: Regional + Mild) -> LIKELY, both figures, NEITHER highlighted', () => {
    const res = assess(
      {
        ...BASE_ANSWERS,
        q2Activities: ['insulation'],
        q9aPostcode: '3216',
        q9bCeilingNow: 'thin',
        q9cUnsafeCeiling: 'no',
      },
      VIC_ELIGIBILITY_RULES,
      FIGURES,
      POSTCODES,
    );
    const item = res.items[0];
    expect(item.status).toBe('LIKELY');
    expect(item.figureIds).toContain('vic-veu-insulation-metro');
    expect(item.figureIds).toContain('vic-veu-insulation-regional');
    expect(item.highlightedFigureIds).toEqual([]);
    expect(item.notes.join(' ')).toContain('accredited provider confirms which amount applies');
  });

  it('22. insulation in 3000 (Metropolitan + Mild) -> metro row highlighted', () => {
    const res = assess(
      {
        ...BASE_ANSWERS,
        q2Activities: ['insulation'],
        q9aPostcode: '3000',
        q9bCeilingNow: 'none',
        q9cUnsafeCeiling: 'no',
      },
      VIC_ELIGIBILITY_RULES,
      FIGURES,
      POSTCODES,
    );
    expect(res.items[0].highlightedFigureIds).toEqual(['vic-veu-insulation-metro']);
  });

  it('23. insulation with halogen downlights Yes -> LIKELY_NOT with insulation-safety-fix-first', () => {
    const res = assess(
      {
        ...BASE_ANSWERS,
        q2Activities: ['insulation'],
        q9cUnsafeCeiling: 'yes',
      },
      VIC_ELIGIBILITY_RULES,
      FIGURES,
      POSTCODES,
    );
    expect(res.items[0].status).toBe('LIKELY_NOT');
    expect(res.items[0].noteIds).toContain('insulation-safety-fix-first');
  });

  it('24. insulation with Thicker ceiling -> LIKELY_NOT with insulation-r2', () => {
    const res = assess(
      {
        ...BASE_ANSWERS,
        q2Activities: ['insulation'],
        q9bCeilingNow: 'thicker',
      },
      VIC_ELIGIBILITY_RULES,
      FIGURES,
      POSTCODES,
    );
    expect(res.items[0].status).toBe('LIKELY_NOT');
    expect(res.items[0].noteIds).toContain('insulation-r2');
  });

  it('25. insulation with postcode 2000 -> POSSIBLE with postcode-unknown', () => {
    const res = assess(
      {
        ...BASE_ANSWERS,
        q2Activities: ['insulation'],
        q9aPostcode: '2000',
      },
      VIC_ELIGIBILITY_RULES,
      FIGURES,
      POSTCODES,
    );
    expect(res.items[0].status).toBe('POSSIBLE');
    expect(res.items[0].noteIds).toContain('postcode-unknown');
  });

  it('26. insulation does NOT apply building <= 2 years age rule', () => {
    const res = assess(
      {
        ...BASE_ANSWERS,
        q2Activities: ['insulation'],
        q6BuildingOver2Years: 'no',
        q9aPostcode: '3350',
        q9bCeilingNow: 'none',
        q9cUnsafeCeiling: 'no',
      },
      VIC_ELIGIBILITY_RULES,
      FIGURES,
      POSTCODES,
    );
    expect(res.items[0].status).toBe('LIKELY');
  });

  it('27. induction replacing gas, > 2y, not claimed, built-in -> LIKELY with vic-veu-induction, copay, induction-process', () => {
    const res = assess(
      {
        ...BASE_ANSWERS,
        q2Activities: ['induction'],
      },
      VIC_ELIGIBILITY_RULES,
      FIGURES,
      POSTCODES,
    );
    const item = res.items[0];
    expect(item.status).toBe('LIKELY');
    expect(item.figureIds).toEqual(['vic-veu-induction', 'vic-veu-copay-induction']);
    expect(item.noteIds).toContain('induction-process');
    expect(res.allowForm).toBe(false);
  });

  it('28. induction with electric cooktop now -> LIKELY_NOT with induction-must-replace-gas', () => {
    const res = assess(
      {
        ...BASE_ANSWERS,
        q2Activities: ['induction'],
        q10aCooktopNow: 'electric',
      },
      VIC_ELIGIBILITY_RULES,
      FIGURES,
      POSTCODES,
    );
    expect(res.items[0].status).toBe('LIKELY_NOT');
    expect(res.items[0].noteIds).toContain('induction-must-replace-gas');
  });

  it('29. induction with portable target -> LIKELY_NOT with induction-product-rules', () => {
    const res = assess(
      {
        ...BASE_ANSWERS,
        q2Activities: ['induction'],
        q10cCooktopTarget: 'portable',
      },
      VIC_ELIGIBILITY_RULES,
      FIGURES,
      POSTCODES,
    );
    expect(res.items[0].status).toBe('LIKELY_NOT');
    expect(res.items[0].noteIds).toContain('induction-product-rules');
  });

  it('30. induction bought_not_installed shows NO retro caution banner', () => {
    const res = assess(
      {
        ...BASE_ANSWERS,
        q2Activities: ['induction'],
        q3WorkStage: 'bought_not_installed',
      },
      VIC_ELIGIBILITY_RULES,
      FIGURES,
      POSTCODES,
    );
    expect(res.items[0].status).toBe('LIKELY');
    expect(res.cautionBanner).toBeUndefined();
    expect(res.productBoughtFlag).toBe(false);
  });

  it('31. induction installed_or_started returns POSSIBLE (not RETRO) with retro note', () => {
    const res = assess(
      {
        ...BASE_ANSWERS,
        q2Activities: ['induction'],
        q3WorkStage: 'installed_or_started',
      },
      VIC_ELIGIBILITY_RULES,
      FIGURES,
      POSTCODES,
    );
    expect(res.overallStatus).toBe('POSSIBLE');
    expect(res.items[0].status).toBe('POSSIBLE');
    expect(res.items[0].noteIds).toContain('induction-process');
    expect(res.items[0].noteIds).toContain('retro');
  });

  it('32. sealing on house with no open-flued heaters -> LIKELY with the two house rows', () => {
    const res = assess(
      {
        ...BASE_ANSWERS,
        q2Activities: ['sealing'],
        q11aHomeType: 'house',
        q11bOpenFluedGas: 'no',
      },
      VIC_ELIGIBILITY_RULES,
      FIGURES,
      POSTCODES,
    );
    expect(res.items[0].status).toBe('LIKELY');
    expect(res.items[0].figureIds).toEqual([
      'vic-veu-sealing-house-2yr',
      'vic-veu-sealing-house-5yr',
    ]);
  });

  it('33. sealing with open-flued heater Yes -> LIKELY_NOT with sealing-co-risk', () => {
    const res = assess(
      {
        ...BASE_ANSWERS,
        q2Activities: ['sealing'],
        q11bOpenFluedGas: 'yes',
      },
      VIC_ELIGIBILITY_RULES,
      FIGURES,
      POSTCODES,
    );
    expect(res.items[0].status).toBe('LIKELY_NOT');
    expect(res.items[0].noteIds).toContain('sealing-co-risk');
  });

  it('34. sealing for renter includes renter-sealing and rental-sealing-2027 notes', () => {
    const res = assess(
      {
        ...BASE_ANSWERS,
        q2Activities: ['sealing'],
        q5Tenure: 'rent',
      },
      VIC_ELIGIBILITY_RULES,
      FIGURES,
      POSTCODES,
    );
    expect(res.items[0].noteIds).toContain('renter-sealing');
    expect(res.items[0].noteIds).toContain('rental-sealing-2027');
  });

  it('35. all five activities selected returns five Result items', () => {
    const res = assess(
      {
        ...BASE_ANSWERS,
        q2Activities: ['rcac', 'hotwater', 'insulation', 'induction', 'sealing'],
      },
      VIC_ELIGIBILITY_RULES,
      FIGURES,
      POSTCODES,
    );
    expect(res.items).toHaveLength(5);
    expect(res.items.map((i) => i.activity)).toEqual([
      'rcac',
      'hotwater',
      'insulation',
      'induction',
      'sealing',
    ]);
  });

  // --- Data & integrity guards ---
  it('36. every figureId in rules and notes exists in vic-veu.yaml and no note contains $', () => {
    for (const [noteId, def] of Object.entries(ELIGIBILITY_NOTES)) {
      expect(def.text, `Note ${noteId} must not contain $`).not.toContain('$');
      for (const fid of def.figureIds ?? []) {
        expect(FIGURE_IDS.has(fid), `Missing figure ${fid} in note ${noteId}`).toBe(true);
      }
    }

    for (const ids of Object.values(VIC_ELIGIBILITY_RULES.heatingCoolingFigureMap)) {
      for (const fid of ids) expect(FIGURE_IDS.has(fid)).toBe(true);
    }
    for (const ids of Object.values(VIC_ELIGIBILITY_RULES.heatingCoolingCopayMap)) {
      for (const fid of ids) expect(FIGURE_IDS.has(fid)).toBe(true);
    }
    for (const ids of Object.values(VIC_ELIGIBILITY_RULES.hotWaterFigureMap)) {
      for (const fid of ids) expect(FIGURE_IDS.has(fid)).toBe(true);
    }
    for (const ids of Object.values(VIC_ELIGIBILITY_RULES.sealingFigureMap)) {
      for (const fid of ids) expect(FIGURE_IDS.has(fid)).toBe(true);
    }
  });

  it('37. every RESULT_LINKS.internal points to an existing content page (and built HTML when dist exists)', () => {
    const guideSlugs = fs
      .readdirSync(path.join(siteRoot, 'src/content/guides/vic'))
      .filter((f) => f.endsWith('.mdx'))
      .map((f) => `/victoria/${f.replace(/\.mdx$/, '')}/`);
    const areaSlugs = fs
      .readdirSync(path.join(siteRoot, 'src/content/areas/vic'))
      .filter((f) => f.endsWith('.mdx'))
      .map((f) => `/victoria/${f.replace(/\.mdx$/, '')}/`);
    const pageSlugs = fs
      .readdirSync(path.join(siteRoot, 'src/content/pages'))
      .filter((f) => f.endsWith('.mdx'))
      .map((f) => {
        const raw = fs.readFileSync(path.join(siteRoot, 'src/content/pages', f), 'utf8');
        const fm = YAML.parse(raw.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '{}');
        if (fm.slug === 'home') return '/';
        if (fm.slug === 'victoria') return '/victoria/';
        if (fm.state === 'vic' && fm.section === 'tools') return `/victoria/${fm.slug}/`;
        return `/${fm.slug}/`;
      });
    const knownUrls = new Set([...guideSlugs, ...areaSlugs, ...pageSlugs]);

    const distDir = path.join(siteRoot, 'dist');
    const hasDist = fs.existsSync(distDir);

    for (const [key, entry] of Object.entries(RESULT_LINKS)) {
      if (entry.internal) {
        expect(knownUrls.has(entry.internal), `RESULT_LINKS.${key}.internal (${entry.internal}) does not match any content file`).toBe(true);
        if (hasDist) {
          const htmlPath = path.join(distDir, entry.internal.replace(/^\//, ''), 'index.html');
          expect(fs.existsSync(htmlPath), `Built HTML missing for ${entry.internal}`).toBe(true);
        }
      }
    }
  });

  it('38. decodeCompactPostcodes round-trips SPEC25 compact codes accurately', () => {
    const decoded = decodeCompactPostcodes({ '3350': 'R1C5', '3000': 'M1M4', '3515': 'R0C4' });
    expect(decoded['3350']).toEqual({
      area: 'Regional',
      reticulatedGas: true,
      climaticRegion: 'Cold',
      hpZone: 5,
    });
    expect(decoded['3000']).toEqual({
      area: 'Metropolitan',
      reticulatedGas: true,
      climaticRegion: 'Mild',
      hpZone: 4,
    });
    expect(decoded['3515'].reticulatedGas).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { assess, type CheckerAnswers } from '../../src/lib/eligibility';
import { VIC_ELIGIBILITY_RULES } from '../../src/data/eligibility/vic-rules';
import type { FigureData } from '../../src/lib/figures';

const figuresYaml = fs.readFileSync(
  path.resolve(__dirname, '../../src/content/figures/vic-veu.yaml'),
  'utf8',
);
const FIGURES = YAML.parse(figuresYaml) as FigureData[];

const BASE_ANSWERS: CheckerAnswers = {
  q1State: 'vic',
  q2Upgrade: 'rcac',
  q3WorkStage: 'no',
  q4PropertyType: 'home',
  q5Tenure: 'own',
  q6BuildingOver2Years: 'yes',
  q7aCurrentHeating: 'room-gas',
  q7bTargetHeating: 'split',
  q8aCurrentHotWater: 'mains-gas',
  q8bPreviousHotWaterUpgrades: '0',
};

const BANNED_OUTPUT_PHRASES = [
  'you will get',
  'you qualify',
  'guaranteed',
  'free',
  'government rebate approved',
  'claim now',
];

describe('Eligibility Checker — assess()', () => {
  it('returns OUT_OF_AREA when property is outside Victoria', () => {
    const res = assess({ ...BASE_ANSWERS, q1State: 'other' }, VIC_ELIGIBILITY_RULES, FIGURES);
    expect(res.overallStatus).toBe('OUT_OF_AREA');
    expect(res.allowForm).toBe(false);
    expect(res.externalLink?.url).toContain('energy.gov.au');
  });

  it('returns BUSINESS when property is a business', () => {
    const res = assess(
      { ...BASE_ANSWERS, q4PropertyType: 'business' },
      VIC_ELIGIBILITY_RULES,
      FIGURES,
    );
    expect(res.overallStatus).toBe('BUSINESS');
    expect(res.allowForm).toBe(false);
  });

  it('returns RETRO when system is already installed or work has started', () => {
    const res = assess(
      { ...BASE_ANSWERS, q3WorkStage: 'installed_or_started' },
      VIC_ELIGIBILITY_RULES,
      FIGURES,
    );
    expect(res.overallStatus).toBe('RETRO');
    expect(res.allowForm).toBe(false);
  });

  it('flags productBoughtFlag and cautionBanner when product is bought but not installed', () => {
    const res = assess(
      { ...BASE_ANSWERS, q3WorkStage: 'bought_not_installed' },
      VIC_ELIGIBILITY_RULES,
      FIGURES,
    );
    expect(res.overallStatus).toBe('LIKELY');
    expect(res.allowForm).toBe(true);
    expect(res.productBoughtFlag).toBe(true);
    expect(res.cautionBanner).toContain('retrospective discounts are typically not possible');
  });

  it('maps room gas -> split RCAC to the $630 to $1,610 range figure', () => {
    const res = assess(BASE_ANSWERS, VIC_ELIGIBILITY_RULES, FIGURES);
    expect(res.overallStatus).toBe('LIKELY');
    expect(res.items[0].matchedFigures.map((f) => f.id)).toEqual(['vic-veu-rcac-room-gas']);
    expect(res.summary).toContain('$630 to $1,610');
  });

  it('maps ducted gas -> ducted RCAC to all three capacity rows (10, 16, 22.4 kW)', () => {
    const res = assess(
      {
        ...BASE_ANSWERS,
        q7aCurrentHeating: 'ducted-gas',
        q7bTargetHeating: 'ducted',
      },
      VIC_ELIGIBILITY_RULES,
      FIGURES,
    );
    expect(res.items[0].matchedFigures.map((f) => f.id)).toEqual([
      'vic-veu-rcac-ducted-gas-10kw',
      'vic-veu-rcac-ducted-gas-16kw',
      'vic-veu-rcac-ducted-gas-22kw',
    ]);
  });

  it('returns LIKELY_NOT with no-decommission path when building <2 years old is replacing a heater', () => {
    const res = assess(
      {
        ...BASE_ANSWERS,
        q6BuildingOver2Years: 'no',
        q7aCurrentHeating: 'room-gas',
      },
      VIC_ELIGIBILITY_RULES,
      FIGURES,
    );
    expect(res.overallStatus).toBe('LIKELY_NOT');
    expect(res.allowForm).toBe(false);
    expect(res.items[0].matchedFigures.map((f) => f.id)).toContain('vic-veu-rcac-room-no-decomm');
  });

  it('distinguishes mains gas ($560) vs electric ($630) hot water to heat pump', () => {
    const gasRes = assess(
      {
        ...BASE_ANSWERS,
        q2Upgrade: 'hotwater',
        q8aCurrentHotWater: 'mains-gas',
      },
      VIC_ELIGIBILITY_RULES,
      FIGURES,
    );
    expect(gasRes.overallStatus).toBe('LIKELY');
    expect(gasRes.summary).toContain('$560');
    expect(gasRes.items[0].notes.join(' ')).toContain('1 March 2027');

    const elecRes = assess(
      {
        ...BASE_ANSWERS,
        q2Upgrade: 'hotwater',
        q8aCurrentHotWater: 'electric',
      },
      VIC_ELIGIBILITY_RULES,
      FIGURES,
    );
    expect(elecRes.overallStatus).toBe('LIKELY');
    expect(elecRes.summary).toContain('$630');
  });

  it('includes renter and landlord notes and never uses banned phrases', () => {
    const res = assess(
      {
        ...BASE_ANSWERS,
        q2Upgrade: 'both',
        q5Tenure: 'rent',
      },
      VIC_ELIGIBILITY_RULES,
      FIGURES,
    );
    expect(res.sharedNotes.join(' ')).toContain("landlord's approval");
    expect(res.sharedNotes.join(' ')).toContain('1 March 2027');

    const serialized = JSON.stringify(res).toLowerCase();
    for (const banned of BANNED_OUTPUT_PHRASES) {
      expect(serialized).not.toContain(banned);
    }
  });
});

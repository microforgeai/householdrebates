import { describe, expect, it } from 'vitest';
import postcodesData from '../../src/data/postcodes.json';

type PostcodeRow = {
  postcode: string;
  area: 'Metropolitan' | 'Regional';
  reticulatedGas: boolean;
  climaticRegion: 'Mild' | 'Cold' | 'Hot';
  hpZone: 4 | 5;
  localities: string;
  primary_lga: string;
  primary_lga_share_pct: number | null;
  other_lgas: { lga: string; pct: number }[];
  dwellings_2021: number;
};

const rows = postcodesData.rows as Record<string, PostcodeRow>;

describe('VEU Specifications v25.0 Table A postcodes (from postcodes.csv)', () => {
  it('contains exactly 719 Victorian postcodes with metadata and all 12 columns', () => {
    expect(postcodesData.source).toBe('vic-veu-spec-v25');
    expect(postcodesData.specVersion).toBe('25.0');
    expect(postcodesData.checkedOn).toBe('2026-11-14');
    expect(Object.keys(rows).length).toBe(719);
    expect(rows['3004'].other_lgas).toEqual([{ lga: 'Melbourne', pct: 20 }]);
    expect(typeof rows['3000'].dwellings_2021).toBe('number');
    expect(rows['3001'].primary_lga_share_pct).toBeNull();
  });

  it('matches all spot-checked fixture postcodes from the URL map', () => {
    expect(rows['3350']).toMatchObject({
      area: 'Regional',
      reticulatedGas: true,
      climaticRegion: 'Cold',
      hpZone: 5,
      primary_lga: 'Ballarat',
    });
    expect(rows['3630']).toMatchObject({
      area: 'Regional',
      reticulatedGas: true,
      climaticRegion: 'Cold',
      hpZone: 4,
      primary_lga: 'Greater Shepparton',
    });
    expect(rows['3632']).toMatchObject({
      area: 'Regional',
      reticulatedGas: false,
    });
    expect(rows['3515']).toMatchObject({
      area: 'Regional',
      reticulatedGas: false,
      primary_lga: 'Greater Bendigo',
    });
    expect(rows['3523']).toMatchObject({
      area: 'Regional',
      reticulatedGas: false,
      primary_lga: 'Greater Bendigo',
    });
    expect(rows['3216']).toMatchObject({
      area: 'Regional',
      reticulatedGas: true,
      climaticRegion: 'Mild',
      primary_lga: 'Greater Geelong',
    });
    for (const pc of ['3024', '3029', '3030']) {
      expect(rows[pc]).toMatchObject({
        area: 'Metropolitan',
        reticulatedGas: true,
        climaticRegion: 'Mild',
        primary_lga: 'Wyndham',
      });
    }
    expect(rows['3770']).toMatchObject({
      area: 'Metropolitan',
      climaticRegion: 'Cold',
      hpZone: 5,
    });
    expect(rows['3799']).toMatchObject({
      area: 'Regional',
    });
    expect(rows['3000']).toMatchObject({
      area: 'Metropolitan',
      reticulatedGas: true,
      climaticRegion: 'Mild',
      hpZone: 4,
    });
  });
});

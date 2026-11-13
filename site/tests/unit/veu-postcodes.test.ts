import { describe, expect, it } from 'vitest';
import postcodesData from '../../src/data/vic-veu-postcodes.json';

type PostcodeRow = {
  area: 'Metropolitan' | 'Regional';
  reticulatedGas: boolean;
  climaticRegion: 'Mild' | 'Cold' | 'Hot';
  hpZone: 4 | 5;
};

const rows = postcodesData.rows as Record<string, PostcodeRow>;

describe('VEU Specifications v25.0 Table A postcodes', () => {
  it('contains exactly 719 Victorian postcodes with metadata', () => {
    expect(postcodesData.source).toBe('vic-veu-spec-v25');
    expect(postcodesData.specVersion).toBe('25.0');
    expect(Object.keys(rows).length).toBe(719);
  });

  it('matches all spot-checked fixture postcodes from the URL map', () => {
    expect(rows['3350']).toEqual({
      area: 'Regional',
      reticulatedGas: true,
      climaticRegion: 'Cold',
      hpZone: 5,
    });
    expect(rows['3630']).toEqual({
      area: 'Regional',
      reticulatedGas: true,
      climaticRegion: 'Cold',
      hpZone: 4,
    });
    expect(rows['3632']).toMatchObject({
      area: 'Regional',
      reticulatedGas: false,
    });
    expect(rows['3515']).toMatchObject({
      area: 'Regional',
      reticulatedGas: false,
    });
    expect(rows['3523']).toMatchObject({
      area: 'Regional',
      reticulatedGas: false,
    });
    expect(rows['3216']).toMatchObject({
      area: 'Regional',
      reticulatedGas: true,
      climaticRegion: 'Mild',
    });
    for (const pc of ['3024', '3029', '3030']) {
      expect(rows[pc]).toMatchObject({
        area: 'Metropolitan',
        reticulatedGas: true,
        climaticRegion: 'Mild',
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
    expect(rows['3000']).toEqual({
      area: 'Metropolitan',
      reticulatedGas: true,
      climaticRegion: 'Mild',
      hpZone: 4,
    });
  });
});

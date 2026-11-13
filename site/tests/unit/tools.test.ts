import { describe, it, expect } from 'vitest';
import sizeGuideData from '../../src/data/tools/hw-size-guide.json';
import postcodesJson from '../../src/data/postcodes.json';
import {
  RUNNING_COST_SCENARIOS,
  resolveRunningCostScenario,
  filterHwSizeRows,
  lookupPostcodeHpZone,
  evaluateGasExitSelection,
} from '../../src/lib/tools';

const compactPostcodes: Record<string, string> = {};
for (const [pc, row] of Object.entries(postcodesJson.rows)) {
  const areaChar = row.area === 'Metropolitan' ? 'M' : 'R';
  const gasChar = row.reticulatedGas ? '1' : '0';
  const climChar = row.climaticRegion === 'Mild' ? 'M' : row.climaticRegion === 'Cold' ? 'C' : 'H';
  compactPostcodes[pc] = `${areaChar}${gasChar}${climChar}${row.hpZone}`;
}

describe('Wave 2b tools pure logic', () => {
  describe('RunningCostsPicker logic', () => {
    it('exposes the 4 published Energy Victoria scenarios and falls back safely', () => {
      expect(RUNNING_COST_SCENARIOS).toHaveLength(4);
      expect(resolveRunningCostScenario('ducted-heating').figureIds).toEqual([
        'vic-running-ducted-gas-to-rcac',
      ]);
      expect(resolveRunningCostScenario('all-electric').figureIds).toEqual([
        'vic-existing-home-electric-saving',
        'vic-existing-home-electric-solar-saving',
        'vic-gas-supply-saving',
      ]);
      expect(resolveRunningCostScenario('unknown-key').key).toBe('hot-water');
    });
  });

  describe('HwSizeGuide logic', () => {
    it('filters bedroom rows from hw-size-guide.json accurately', () => {
      expect(filterHwSizeRows(sizeGuideData.rows, 'all')).toHaveLength(3);
      expect(filterHwSizeRows(sizeGuideData.rows, '1–2')).toEqual([
        { bedrooms: '1–2', litres: '150–225' },
      ]);
      expect(filterHwSizeRows(sizeGuideData.rows, '3')).toEqual([
        { bedrooms: '3', litres: '225–300' },
      ]);
      expect(filterHwSizeRows(sizeGuideData.rows, '4 or more')).toEqual([
        { bedrooms: '4 or more', litres: 'more than 300' },
      ]);
    });

    it('looks up heat pump climatic zones 4 and 5 and rejects non-Victorian postcodes', () => {
      expect(lookupPostcodeHpZone('', compactPostcodes)).toEqual({ status: 'empty' });
      expect(lookupPostcodeHpZone('2000', compactPostcodes).status).toBe('invalid');

      const ballarat = lookupPostcodeHpZone('3350', compactPostcodes);
      expect(ballarat.status).toBe('found');
      if (ballarat.status === 'found') {
        expect(ballarat.hpZone).toBe(5);
        expect(ballarat.frostAdvice).toBe(true);
        expect(ballarat.note).toBe(
          'In the VEU postcode table, 3350 is in heat pump climatic zone 5.',
        );
      }

      const melbourne = lookupPostcodeHpZone('3000', compactPostcodes);
      expect(melbourne.status).toBe('found');
      if (melbourne.status === 'found') {
        expect(melbourne.hpZone).toBe(4);
      }
    });
  });

  describe('GasExitPlanner logic', () => {
    it('returns matching appliance steps and shows abolishment when appliances are selected', () => {
      const none = evaluateGasExitSelection([]);
      expect(none.activeSteps).toHaveLength(0);
      expect(none.showAbolishment).toBe(false);
      expect(none.allFourTicked).toBe(false);

      const two = evaluateGasExitSelection(['hotwater', 'cooktop']);
      expect(two.activeSteps.map((s) => s.key)).toEqual(['hotwater', 'cooktop']);
      expect(two.showAbolishment).toBe(true);
      expect(two.allFourTicked).toBe(false);

      const all = evaluateGasExitSelection(['hotwater', 'room', 'ducted', 'cooktop']);
      expect(all.activeSteps).toHaveLength(4);
      expect(all.showAbolishment).toBe(true);
      expect(all.allFourTicked).toBe(true);
    });
  });
});

import { describe, expect, it } from 'vitest';

import calcAccuracy from './calc-accuracy';
import calcGeoDistance from './calc-geo-distance';
import calcPoints from './calc-points';
import genRandomCoords from '../random/gen-random-coords';

describe('round calculations', () => {
  it('measures a known one-degree distance', () => {
    expect(calcGeoDistance([0, 0], [0, 1])).toBeCloseTo(111_195, -2);
  });

  it('awards the maximum score for an instant exact guess', () => {
    expect(calcAccuracy(0)).toBe(1);
    expect(calcPoints(1, 0)).toBe(25_000);
    expect(calcPoints(1, 60)).toBeLessThan(25_000);
  });

  it('generates valid coordinates for every configured region', () => {
    for (const region of ['wrl', 'nam', 'sam', 'eur', 'asi', 'afr', 'oce']) {
      const [lat, lng] = genRandomCoords(region);
      expect(Number.isFinite(lat)).toBe(true);
      expect(Number.isFinite(lng)).toBe(true);
      expect(lat).toBeGreaterThanOrEqual(-90);
      expect(lat).toBeLessThanOrEqual(90);
      expect(lng).toBeGreaterThanOrEqual(-180);
      expect(lng).toBeLessThanOrEqual(180);
    }
  });
});

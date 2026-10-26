import { describe, expect, it } from 'vitest';
import { BASE_DAY_DURATION_MS } from '../../hooks/useGameState';
import { getProjectedTravelHeading, interpolateGreatCircle } from '../travel';

describe('travel marker geometry', () => {
  it('interpolates positions along the great-circle route', () => {
    const midpoint = interpolateGreatCircle([0, 0], [60, 60], 0.5);

    expect(midpoint[0]).toBeCloseTo(19.11, 1);
    expect(midpoint[1]).toBeCloseTo(33.21, 1);
  });

  it('derives forward and reverse headings from projected route positions', () => {
    const project = ([longitude, latitude]: [number, number]): [number, number] => [longitude, -latitude];

    expect(getProjectedTravelHeading(project, [-30, 0], [30, 0], 0.5, false)).toBeCloseTo(0);
    expect(getProjectedTravelHeading(project, [-30, 0], [30, 0], 0.5, true)).toBeCloseTo(180);
  });
});

describe('simulation day duration', () => {
  it('advances one day every eight seconds at normal speed', () => {
    expect(BASE_DAY_DURATION_MS).toBe(8_000);
  });
});

export type GeoCoordinates = [number, number];

export function interpolateGreatCircle(
  from: GeoCoordinates,
  to: GeoCoordinates,
  progress: number
): GeoCoordinates {
  const amount = Math.max(0, Math.min(1, progress));
  if (amount === 0) return from;
  if (amount === 1) return to;

  const toVector = ([longitude, latitude]: GeoCoordinates): [number, number, number] => {
    const lambda = longitude * Math.PI / 180;
    const phi = latitude * Math.PI / 180;
    return [Math.cos(phi) * Math.cos(lambda), Math.cos(phi) * Math.sin(lambda), Math.sin(phi)];
  };

  const fromVector = toVector(from);
  const toVectorValue = toVector(to);
  const dot = Math.max(-1, Math.min(1,
    fromVector[0] * toVectorValue[0] +
    fromVector[1] * toVectorValue[1] +
    fromVector[2] * toVectorValue[2]
  ));
  const angle = Math.acos(dot);
  const sine = Math.sin(angle);

  if (Math.abs(sine) < 1e-6) {
    return [
      from[0] + (to[0] - from[0]) * amount,
      from[1] + (to[1] - from[1]) * amount,
    ];
  }

  const fromWeight = Math.sin((1 - amount) * angle) / sine;
  const toWeight = Math.sin(amount * angle) / sine;
  const x = fromVector[0] * fromWeight + toVectorValue[0] * toWeight;
  const y = fromVector[1] * fromWeight + toVectorValue[1] * toWeight;
  const z = fromVector[2] * fromWeight + toVectorValue[2] * toWeight;

  return [
    Math.atan2(y, x) * 180 / Math.PI,
    Math.atan2(z, Math.hypot(x, y)) * 180 / Math.PI,
  ];
}

export function getProjectedTravelHeading(
  project: (coordinates: GeoCoordinates) => GeoCoordinates | null,
  from: GeoCoordinates,
  to: GeoCoordinates,
  progress: number,
  reverse: boolean
): number | null {
  const amount = Math.max(0, Math.min(1, progress));
  const before = interpolateGreatCircle(from, to, Math.max(0, amount - 0.001));
  const after = interpolateGreatCircle(from, to, Math.min(1, amount + 0.001));
  const projectedBefore = project(before);
  const projectedAfter = project(after);

  if (!projectedBefore || !projectedAfter) return null;

  const dx = projectedAfter[0] - projectedBefore[0];
  const dy = projectedAfter[1] - projectedBefore[1];
  if (Math.hypot(dx, dy) < 1e-6) return null;

  return Math.atan2(dy, dx) * 180 / Math.PI + (reverse ? 180 : 0);
}

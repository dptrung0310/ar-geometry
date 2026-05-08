export function getDistance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;

  return Math.sqrt(dx * dx + dy * dy);
}

export function smooth(current, target, factor = 0.15) {
  return current + (target - current) * factor;
}

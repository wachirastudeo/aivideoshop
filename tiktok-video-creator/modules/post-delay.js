export function normalizePostDelay(value, fallback) {
  if (value === "" || value === null || value === undefined) return fallback;
  const minutes = Number(value);
  return Number.isInteger(minutes) && minutes >= 0 && minutes <= 1440 ? minutes : fallback;
}

export function postDelayMs(minMinutes, maxMinutes, random = Math.random) {
  const min = normalizePostDelay(minMinutes, 10);
  const max = Math.max(min, normalizePostDelay(maxMinutes, 12));
  return (min + Math.floor(Math.min(Math.max(random(), 0), 0.999999999) * (max - min + 1))) * 60_000;
}

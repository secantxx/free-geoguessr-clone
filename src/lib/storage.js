import storageConfig from '../config/storage.json';

export const STORAGE_VERSION = 1;

const REGION_IDS = new Set(['wrl', 'nam', 'sam', 'eur', 'asi', 'afr', 'oce']);

function isCoordinate(value) {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    value.every(Number.isFinite) &&
    value[0] >= -90 &&
    value[0] <= 90 &&
    value[1] >= -180 &&
    value[1] <= 180
  );
}

export function normalizeRound(value) {
  if (!value || typeof value !== 'object') return null;

  const round = {
    rg: String(value.rg || ''),
    gp: value.gp,
    rp: value.rp,
    tm: Number(value.tm),
    dt: Number(value.dt),
  };

  if (
    !REGION_IDS.has(round.rg) ||
    !isCoordinate(round.gp) ||
    !isCoordinate(round.rp) ||
    !Number.isFinite(round.tm) ||
    round.tm < 0 ||
    !Number.isFinite(round.dt) ||
    round.dt <= 0
  ) {
    return null;
  }

  return round;
}

function getStorage() {
  return globalThis.localStorage;
}

export function getHistory() {
  try {
    const parsed = JSON.parse(getStorage().getItem(storageConfig.hist) || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeRound).filter(Boolean);
  } catch {
    return [];
  }
}

export function replaceHistory(history) {
  const normalized = history.map(normalizeRound);
  if (normalized.some((round) => !round)) {
    throw new Error('The file contains an invalid round.');
  }
  getStorage().setItem(storageConfig.hist, JSON.stringify(normalized));
  return normalized;
}

export function saveRound(round) {
  const normalized = normalizeRound(round);
  if (!normalized) throw new Error('Cannot save an invalid round.');
  return replaceHistory([...getHistory(), normalized]);
}

export function clearHistory() {
  getStorage().removeItem(storageConfig.hist);
}

export function getPreferences() {
  try {
    const value = JSON.parse(getStorage().getItem(storageConfig.pref) || '{}');
    return { pauseProgress: Boolean(value?.pauseProgress) };
  } catch {
    return { pauseProgress: false };
  }
}

export function setPreferences(preferences) {
  const next = { pauseProgress: Boolean(preferences.pauseProgress) };
  getStorage().setItem(storageConfig.pref, JSON.stringify(next));
  return next;
}

export function serializeHistory(history) {
  return JSON.stringify(
    {
      version: STORAGE_VERSION,
      exportedAt: new Date().toISOString(),
      rounds: history,
    },
    null,
    2,
  );
}

export function parseHistoryFile(contents) {
  let parsed;
  try {
    parsed = JSON.parse(contents);
  } catch {
    throw new Error('This is not a valid JSON export.');
  }

  const rounds = Array.isArray(parsed) ? parsed : parsed?.rounds;
  if (!Array.isArray(rounds)) {
    throw new Error('This file does not contain a round history.');
  }
  if (rounds.length > 10_000) {
    throw new Error('This export is too large to import safely.');
  }

  const normalized = rounds.map(normalizeRound);
  if (normalized.some((round) => !round)) {
    throw new Error('This export contains malformed round data.');
  }
  return normalized;
}

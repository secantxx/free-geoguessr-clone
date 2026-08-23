import { beforeEach, describe, expect, it } from 'vitest';

import {
  clearHistory,
  getHistory,
  normalizeRound,
  parseHistoryFile,
  replaceHistory,
} from './storage';

const validRound = {
  rg: 'wrl',
  gp: [27.7172, 85.324],
  rp: [48.8566, 2.3522],
  tm: 42,
  dt: 1_700_000_000_000,
};

beforeEach(() => {
  const values = new Map();
  globalThis.localStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
});

describe('history storage', () => {
  it('normalizes a valid round and rejects bad coordinates', () => {
    expect(normalizeRound(validRound)).toEqual(validRound);
    expect(normalizeRound({ ...validRound, gp: [95, 10] })).toBeNull();
  });

  it('round-trips valid history without clearing unrelated storage', () => {
    localStorage.setItem('unrelated', 'keep');
    replaceHistory([validRound]);
    expect(getHistory()).toEqual([validRound]);

    clearHistory();
    expect(getHistory()).toEqual([]);
    expect(localStorage.getItem('unrelated')).toBe('keep');
  });

  it('accepts legacy arrays and rejects malformed exports', () => {
    expect(parseHistoryFile(JSON.stringify([validRound]))).toEqual([validRound]);
    expect(() => parseHistoryFile('{bad json')).toThrow('valid JSON');
    expect(() => parseHistoryFile(JSON.stringify([{ ...validRound, rg: 'moon' }]))).toThrow(
      'malformed',
    );
  });
});

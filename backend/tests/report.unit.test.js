const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { formatDay } = require('../services/reportService');

describe('reportService.formatDay', () => {
  it('formats a Date using local calendar components (no UTC shift)', () => {
    const d = new Date(2026, 6, 15, 0, 0, 0); // 15 Jul 2026 local midnight
    assert.equal(formatDay(d), '2026-07-15');
  });

  it('handles a YYYY-MM-DD string input', () => {
    assert.equal(formatDay('2026-01-05'), '2026-01-05');
  });

  it('returns empty string for null/undefined', () => {
    assert.equal(formatDay(null), '');
    assert.equal(formatDay(undefined), '');
  });

  it('zero-pads single-digit months and days', () => {
    const d = new Date(2026, 0, 3, 12, 0, 0); // 3 Jan 2026
    assert.equal(formatDay(d), '2026-01-03');
  });
});

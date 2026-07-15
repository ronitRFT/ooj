const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { parseCsvToObjects, toCsv, parseCsvRows } = require('../utils/csv');

describe('parseCsvToObjects', () => {
  it('parses a simple CSV with a header row', () => {
    const csv = 'full_name,email,phone\nJohn Doe,john@test.com,9876543210';
    assert.deepEqual(parseCsvToObjects(csv), [
      { full_name: 'John Doe', email: 'john@test.com', phone: '9876543210' },
    ]);
  });

  it('lowercases and trims headers', () => {
    const csv = ' Full_Name , Email \nAlice,alice@test.com';
    assert.deepEqual(parseCsvToObjects(csv), [
      { full_name: 'Alice', email: 'alice@test.com' },
    ]);
  });

  it('handles quoted fields with commas and escaped quotes', () => {
    const csv = 'full_name,organization\n"Doe, John","Acme ""Inc"""';
    assert.deepEqual(parseCsvToObjects(csv), [
      { full_name: 'Doe, John', organization: 'Acme "Inc"' },
    ]);
  });

  it('handles quoted fields spanning newlines', () => {
    const csv = 'full_name,note\n"Jane","line1\nline2"';
    assert.deepEqual(parseCsvToObjects(csv), [
      { full_name: 'Jane', note: 'line1\nline2' },
    ]);
  });

  it('skips fully blank lines', () => {
    const csv = 'full_name\nAlice\n\n\nBob';
    assert.deepEqual(parseCsvToObjects(csv), [
      { full_name: 'Alice' },
      { full_name: 'Bob' },
    ]);
  });

  it('returns empty array for empty input', () => {
    assert.deepEqual(parseCsvToObjects(''), []);
    assert.deepEqual(parseCsvToObjects('   '), []);
  });

  it('tolerates CRLF line endings', () => {
    const csv = 'full_name,email\r\nBob,bob@test.com\r\n';
    assert.deepEqual(parseCsvToObjects(csv), [
      { full_name: 'Bob', email: 'bob@test.com' },
    ]);
  });

  it('fills missing trailing columns with empty strings', () => {
    const csv = 'full_name,email,phone\nBob,bob@test.com';
    assert.deepEqual(parseCsvToObjects(csv), [
      { full_name: 'Bob', email: 'bob@test.com', phone: '' },
    ]);
  });
});

describe('toCsv', () => {
  const columns = [
    { key: 'full_name', label: 'Full Name' },
    { key: 'email', label: 'Email' },
  ];

  it('serializes rows with a header', () => {
    const rows = [{ full_name: 'John', email: 'john@test.com' }];
    assert.equal(toCsv(rows, columns), 'Full Name,Email\r\nJohn,john@test.com');
  });

  it('quotes values containing commas, quotes, and newlines', () => {
    const rows = [{ full_name: 'Doe, John', email: 'a"b\nc' }];
    assert.equal(toCsv(rows, columns), 'Full Name,Email\r\n"Doe, John","a""b\nc"');
  });

  it('renders null/undefined as empty', () => {
    const rows = [{ full_name: null, email: undefined }];
    assert.equal(toCsv(rows, columns), 'Full Name,Email\r\n,');
  });

  it('round-trips through parseCsvToObjects', () => {
    const rows = [{ full_name: 'Doe, John', email: 'john@test.com' }];
    const csv = toCsv(rows, [
      { key: 'full_name', label: 'full_name' },
      { key: 'email', label: 'email' },
    ]);
    assert.deepEqual(parseCsvToObjects(csv), rows);
  });
});

describe('parseCsvRows', () => {
  it('returns raw rows including the header', () => {
    assert.deepEqual(parseCsvRows('a,b\n1,2'), [
      ['a', 'b'],
      ['1', '2'],
    ]);
  });
});

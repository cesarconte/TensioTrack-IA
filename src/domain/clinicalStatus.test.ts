import { describe, expect, it } from 'vitest';
import { getClinicalStatus } from './clinicalStatus';

describe('getClinicalStatus', () => {
  it('returns danger only for hypertensive crisis values', () => {
    expect(getClinicalStatus(180, 90)).toBe('danger');
    expect(getClinicalStatus(120, 120)).toBe('danger');
  });

  it('returns high for AMPA high values that are not crisis', () => {
    expect(getClinicalStatus(135, 84)).toBe('high');
    expect(getClinicalStatus(114, 85)).toBe('high');
  });

  it('returns warning for elevated values below AMPA high threshold', () => {
    expect(getClinicalStatus(130, 79)).toBe('warning');
    expect(getClinicalStatus(129, 80)).toBe('warning');
  });

  it('returns low for values below lower bound', () => {
    expect(getClinicalStatus(99, 70)).toBe('low');
    expect(getClinicalStatus(120, 59)).toBe('low');
  });

  it('returns normal for in-range values', () => {
    expect(getClinicalStatus(120, 75)).toBe('normal');
  });
});

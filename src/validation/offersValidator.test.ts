import { describe, it, expect } from 'vitest';
import { validateOffersSelection } from './offersValidator';

describe('validateOffersSelection', () => {
  it('returns valid when at least one offer id is selected', () => {
    const result = validateOffersSelection(['offer-1']);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('returns valid for multiple selections', () => {
    const result = validateOffersSelection(['a', 'b', 'c']);
    expect(result.valid).toBe(true);
  });

  it('returns invalid when no selection', () => {
    const result = validateOffersSelection([]);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('at least one');
  });

  it('returns invalid when array has empty strings only', () => {
    const result = validateOffersSelection(['', '']);
    expect(result.valid).toBe(false);
  });

  it('returns invalid when not an array', () => {
    const result = validateOffersSelection(null as unknown as string[]);
    expect(result.valid).toBe(false);
  });
});

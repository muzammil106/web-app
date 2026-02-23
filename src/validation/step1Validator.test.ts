import { describe, it, expect } from 'vitest';
import { validateStep1 } from './step1Validator';

describe('validateStep1', () => {
  it('valid when all fields filled', () => {
    const r = validateStep1({
      educationLevel: 'bachelor',
      hasInternetAccess: true,
      hasCertifications: false,
    });
    expect(r.valid).toBe(true);
  });

  it('invalid when education missing', () => {
    const r = validateStep1({
      educationLevel: undefined,
      hasInternetAccess: true,
      hasCertifications: true,
    });
    expect(r.valid).toBe(false);
    expect(r.errors.educationLevel).toBeDefined();
  });

  it('invalid when hasInternetAccess undefined', () => {
    const r = validateStep1({
      educationLevel: 'high_school',
      hasInternetAccess: undefined,
      hasCertifications: true,
    });
    expect(r.valid).toBe(false);
  });
});

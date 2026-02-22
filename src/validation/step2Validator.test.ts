import { describe, it, expect } from 'vitest';
import { validateStep2, toStep2Payload } from './step2Validator';

const valid = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  phone: '+92 330 4014980',
  address: '123 Main St',
  city: 'Karachi',
  state: 'TX',
  agreement: true,
};

describe('validateStep2', () => {
  it('valid when all fields correct', () => {
    expect(validateStep2(valid).valid).toBe(true);
  });

  it('invalid when email bad', () => {
    const r = validateStep2({ ...valid, email: 'x' });
    expect(r.valid).toBe(false);
    expect(r.errors.email).toBeDefined();
  });

  it('invalid when phone not Pakistan mobile', () => {
    const r = validateStep2({ ...valid, phone: '123' });
    expect(r.valid).toBe(false);
  });

  it('invalid when state invalid', () => {
    const r = validateStep2({ ...valid, state: 'XX' });
    expect(r.valid).toBe(false);
  });

  it('invalid when agreement false', () => {
    const r = validateStep2({ ...valid, agreement: false });
    expect(r.valid).toBe(false);
  });
});

describe('toStep2Payload', () => {
  it('trims and returns payload', () => {
    const p = toStep2Payload({
      ...valid,
      firstName: '  Jane  ',
    });
    expect(p.firstName).toBe('Jane');
    expect(p.agreement).toBe(true);
  });
});

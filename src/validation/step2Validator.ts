import type { Step2Payload, StateCode } from '../domain/types';
import { ALLOWED_STATES } from '../domain/types';

export interface Step2ValidationResult {
  valid: boolean;
  errors: Partial<Record<keyof Step2Payload, string>>;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?923\d{9}$/;

function sanitizeString(value: unknown): string {
  if (value === null || value === undefined) return '';
  const s = String(value).trim();
  return s.replace(/[<>]/g, '');
}

export function validateStep2(payload: Partial<Record<keyof Step2Payload, unknown>>): Step2ValidationResult {
  const errors: Step2ValidationResult['errors'] = {};

  const firstName = sanitizeString(payload.firstName);
  if (!firstName) errors.firstName = 'First name is required.';

  const lastName = sanitizeString(payload.lastName);
  if (!lastName) errors.lastName = 'Last name is required.';

  const email = sanitizeString(payload.email);
  if (!email) {
    errors.email = 'Email is required.';
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = 'Please enter a valid email address.';
  }

  const phone = sanitizeString(payload.phone).replace(/\s/g, '');
  if (!phone) {
    errors.phone = 'Phone number is required.';
  } else if (!PHONE_REGEX.test(phone)) {
    errors.phone = 'Enter a valid mobile number, e.g. +92 330 4014980';
  }

  const address = sanitizeString(payload.address);
  if (!address) errors.address = 'Address is required.';

  const city = sanitizeString(payload.city);
  if (!city) errors.city = 'City is required.';

  const state = payload.state;
  if (!state || typeof state !== 'string') {
    errors.state = 'State is required.';
  } else if (!ALLOWED_STATES.includes(state as StateCode)) {
    errors.state = 'Please select a valid state.';
  }

  const agreement = payload.agreement;
  if (!agreement) {
    errors.agreement = 'You must agree to the terms to continue.';
  } else if (agreement !== true) {
    errors.agreement = 'You must check the agreement box.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function toStep2Payload(raw: Partial<Record<keyof Step2Payload, unknown>>): Step2Payload {
  return {
    firstName: sanitizeString(raw.firstName),
    lastName: sanitizeString(raw.lastName),
    email: sanitizeString(raw.email),
    phone: sanitizeString(raw.phone),
    address: sanitizeString(raw.address),
    city: sanitizeString(raw.city),
    state: (raw.state as StateCode) ?? 'AL',
    agreement: raw.agreement === true,
  };
}

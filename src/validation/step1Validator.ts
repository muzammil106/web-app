import type { Step1Payload } from '../domain/types';

export interface Step1ValidationResult {
  valid: boolean;
  errors: Partial<Record<keyof Step1Payload, string>>;
}

const EDUCATION_VALUES: Step1Payload['educationLevel'][] = [
  'high_school', 'associate', 'bachelor', 'graduate',
];

export function validateStep1(payload: Partial<Step1Payload>): Step1ValidationResult {
  const errors: Step1ValidationResult['errors'] = {};

  if (
    payload.educationLevel === undefined ||
    payload.educationLevel === null ||
    payload.educationLevel === ''
  ) {
    errors.educationLevel = 'Please select your level of education.';
  } else if (!EDUCATION_VALUES.includes(payload.educationLevel as Step1Payload['educationLevel'])) {
    errors.educationLevel = 'Invalid education level.';
  }

  if (payload.hasInternetAccess === undefined || payload.hasInternetAccess === null) {
    errors.hasInternetAccess = 'Please select Yes or No for internet access.';
  } else if (typeof payload.hasInternetAccess !== 'boolean') {
    errors.hasInternetAccess = 'Invalid value.';
  }

  if (payload.hasCertifications === undefined || payload.hasCertifications === null) {
    errors.hasCertifications = 'Please select Yes or No for certifications.';
  } else if (typeof payload.hasCertifications !== 'boolean') {
    errors.hasCertifications = 'Invalid value.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

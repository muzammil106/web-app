
export const ALLOWED_STATES = [
  'AL', 'KY', 'MA', 'MN', 'NJ', 'NV', 'OR', 'SC', 'TX', 'WA',
] as const;
export type StateCode = (typeof ALLOWED_STATES)[number];

export const EDUCATION_LEVELS = [
  'high_school',
  'associate',
  'bachelor',
  'graduate',
] as const;
export type EducationLevel = (typeof EDUCATION_LEVELS)[number];

export interface Step1Payload {
  educationLevel: EducationLevel;
  hasInternetAccess: boolean;
  hasCertifications: boolean;
}

export interface Step2Payload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: StateCode;
  agreement: boolean;
}

export interface RegistrationDTO {
  step1: Step1Payload;
  step2: Step2Payload;
}

export interface UserSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  stateCode: string;
  educationLevel: string;
  hasInternetAccess: boolean;
  hasCertifications: boolean;
}

export interface Offer {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  stateCode: string | null; 
}

export interface State {
  id: string;
  code: string;
  name: string;
}

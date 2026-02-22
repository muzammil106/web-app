
export interface OffersValidationResult {
  valid: boolean;
  error?: string;
}

export function validateOffersSelection(selectedIds: string[]): OffersValidationResult {
  const ids = Array.isArray(selectedIds) ? selectedIds.filter((id) => typeof id === 'string' && id.length > 0) : [];
  if (ids.length === 0) {
    return { valid: false, error: 'Please select at least one offer.' };
  }
  return { valid: true };
}

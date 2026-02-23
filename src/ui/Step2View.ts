import type { ApiService } from '../services/api';
import type { Step1Payload, Step2Payload } from '../domain/types';
import { ALLOWED_STATES } from '../domain/types';
import { validateStep2, toStep2Payload } from '../validation/step2Validator';

const STEP1_STORAGE_KEY = 'offers_app_step1';
const STEP2_DRAFT_KEY = 'offers_app_step2_draft';
const USER_ID_KEY = 'offers_app_user_id';
const STATE_KEY = 'offers_app_state';

function escapeHtml(s: string): string {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

export class Step2View {
  constructor(
    private readonly container: HTMLElement,
    private readonly api: ApiService
  ) {}

  render(): void {
    let step1: Step1Payload | null = null;
    try {
      const raw = sessionStorage.getItem(STEP1_STORAGE_KEY);
      if (raw) step1 = JSON.parse(raw) as Step1Payload;
    } catch {
      // ignore
    }
    if (!step1) {
      window.location.href = '/';
      return;
    }
    const step1Payload = step1;

    this.container.innerHTML = '';
    const section = document.createElement('div');
    section.className = 'form-section';
    const stateOpts = ALLOWED_STATES.map((s) => '<option value="' + escapeHtml(s) + '">' + escapeHtml(s) + '</option>').join('');
    section.innerHTML = this.buildFormHtml(stateOpts);
    this.container.appendChild(section);

    const form = section.querySelector<HTMLFormElement>('#step2-form');
    if (!form) return;

    this.preFillFromDraft(form);
    const phoneInput = form.querySelector<HTMLInputElement>('#phone');
    if (phoneInput) {
      if (!phoneInput.value.trim().startsWith('+92')) phoneInput.value = '+92 ';
      phoneInput.addEventListener('input', () => this.formatPhoneInput(phoneInput));
      phoneInput.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && phoneInput.value === '+92 ') e.preventDefault();
      });
      phoneInput.addEventListener('focus', () => {
        if (!phoneInput.value.trim().startsWith('+92')) phoneInput.value = '+92 ';
      });
    }

    const backLink = section.querySelector<HTMLAnchorElement>('#step2-back');
    if (backLink) {
      backLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.saveDraftAndGoBack(form);
      });
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const raw: Partial<Record<keyof Step2Payload, unknown>> = {
        firstName: form.querySelector<HTMLInputElement>('[name="firstName"]')?.value,
        lastName: form.querySelector<HTMLInputElement>('[name="lastName"]')?.value,
        email: form.querySelector<HTMLInputElement>('[name="email"]')?.value,
        phone: form.querySelector<HTMLInputElement>('[name="phone"]')?.value,
        address: form.querySelector<HTMLInputElement>('[name="address"]')?.value,
        city: form.querySelector<HTMLInputElement>('[name="city"]')?.value,
        state: form.querySelector<HTMLSelectElement>('[name="state"]')?.value,
        agreement: form.querySelector<HTMLInputElement>('[name="agreement"]')?.checked ?? false,
      };
      this.clearSubmitError(section);
      const result = validateStep2(raw);
      this.showErrors(section, result.errors);
      if (!result.valid) {
        this.focusFirstInvalid(section, result.errors);
        return;
      }
      const step2 = toStep2Payload(raw);
      const btn = form.querySelector<HTMLButtonElement>('#step2-submit');
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Submitting…';
      }
      try {
        const { userId } = await this.api.register({ step1: step1Payload, step2 });
        sessionStorage.setItem(USER_ID_KEY, userId);
        sessionStorage.setItem(STATE_KEY, step2.state);
        try {
          sessionStorage.removeItem(STEP2_DRAFT_KEY);
        } catch {
          // ignore
        }
        window.location.href = '/results';
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Submission failed.';
        const displayMsg = msg === 'Failed to fetch' || msg.includes('fetch')
          ? 'Network error. Please check your connection and try again.'
          : msg;
        this.showSubmitError(section, displayMsg);
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'Submit';
        }
      }
    });
  }

  private static getDraftShape(): Record<string, string> {
    return { firstName: '', lastName: '', email: '', phone: '', address: '', city: '', state: '' };
  }

  private preFillFromDraft(form: HTMLFormElement): void {
    try {
      const raw = sessionStorage.getItem(STEP2_DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw) as Record<string, string>;
      const keys = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'state'];
      keys.forEach((key) => {
        const el = form.querySelector<HTMLInputElement | HTMLSelectElement>('[name="' + key + '"]');
        const val = draft[key];
        if (el && typeof val === 'string') el.value = val;
      });
    } catch {
      // ignore
    }
  }

  private saveDraftAndGoBack(form: HTMLFormElement): void {
    try {
      const draft = Step2View.getDraftShape();
      draft.firstName = form.querySelector<HTMLInputElement>('[name="firstName"]')?.value ?? '';
      draft.lastName = form.querySelector<HTMLInputElement>('[name="lastName"]')?.value ?? '';
      draft.email = form.querySelector<HTMLInputElement>('[name="email"]')?.value ?? '';
      draft.phone = form.querySelector<HTMLInputElement>('[name="phone"]')?.value ?? '';
      draft.address = form.querySelector<HTMLInputElement>('[name="address"]')?.value ?? '';
      draft.city = form.querySelector<HTMLInputElement>('[name="city"]')?.value ?? '';
      draft.state = form.querySelector<HTMLSelectElement>('[name="state"]')?.value ?? '';
      sessionStorage.setItem(STEP2_DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // ignore
    }
    window.location.href = '/';
  }

  private formatPhoneInput(input: HTMLInputElement): void {
    let raw = input.value.replace(/\D/g, '');
    if (raw.startsWith('92')) raw = raw.slice(2);
    raw = raw.slice(0, 10);
    const formatted = raw.length <= 3 ? raw : raw.slice(0, 3) + ' ' + raw.slice(3);
    const display = '+92 ' + (formatted ? formatted : '');
    if (input.value !== display) {
      const start = input.selectionStart ?? display.length;
      input.value = display;
      const newPos = Math.min(start, display.length);
      input.setSelectionRange(newPos, newPos);
    }
  }

  private buildFormHtml(stateOpts: string): string {
    return [
      '<div class="step-indicator"><span class="step-dot"></span><span class="step-dot active"></span></div>',
      '<p class="step-nav"><a href="/" class="link-back" id="step2-back">← Back to Step 1</a></p>',
      '<h1>Step 2 – Your details</h1><p>All fields are required.</p>',
      '<form id="step2-form" novalidate>',
      '<div class="form-group"><label for="firstName">First Name</label><input type="text" id="firstName" name="firstName" required autocomplete="given-name" placeholder="e.g. John" /><span id="firstName-error" class="error-message" aria-live="polite"></span></div>',
      '<div class="form-group"><label for="lastName">Last Name</label><input type="text" id="lastName" name="lastName" required autocomplete="family-name" placeholder="e.g. Doe" /><span id="lastName-error" class="error-message" aria-live="polite"></span></div>',
      '<div class="form-group"><label for="email">Email</label><input type="email" id="email" name="email" required autocomplete="email" placeholder="e.g. john@example.com" /><span id="email-error" class="error-message" aria-live="polite"></span></div>',
      '<div class="form-group"><label for="phone">Phone Number</label><input type="tel" id="phone" name="phone" required autocomplete="tel" value="+92 " maxlength="16" /><span id="phone-error" class="error-message" aria-live="polite"></span></div>',
      '<div class="form-group"><label for="address">Address</label><input type="text" id="address" name="address" required autocomplete="street-address" placeholder="e.g. 123 Main St, Block A" /><span id="address-error" class="error-message" aria-live="polite"></span></div>',
      '<div class="form-group"><label for="city">City</label><input type="text" id="city" name="city" required autocomplete="address-level2" placeholder="e.g. Karachi" /><span id="city-error" class="error-message" aria-live="polite"></span></div>',
      '<div class="form-group"><label for="state">State</label><select id="state" name="state" required><option value="">Select state...</option>' + stateOpts + '</select><span id="state-error" class="error-message" aria-live="polite"></span></div>',
      '<div class="form-group"><div class="checkbox-row"><input type="checkbox" id="agreement" name="agreement" required /><label for="agreement">I agree to the terms and conditions.</label></div><span id="agreement-error" class="error-message" aria-live="polite"></span></div>',
      '<div id="step2-submit-error" class="error-message form-submit-error" aria-live="polite" role="alert"></div>',
      '<button type="submit" class="btn btn-primary" id="step2-submit">Submit</button></form>',
    ].join('');
  }

  private clearSubmitError(section: HTMLElement): void {
    const el = section.querySelector('#step2-submit-error');
    if (el) (el as HTMLElement).textContent = '';
  }

  private showSubmitError(section: HTMLElement, message: string): void {
    const el = section.querySelector('#step2-submit-error');
    if (el) (el as HTMLElement).textContent = message;
  }

  private showErrors(section: HTMLElement, errors: Partial<Record<keyof Step2Payload, string>>): void {
    this.clearSubmitError(section);
    const keys: (keyof Step2Payload)[] = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'state', 'agreement'];
    keys.forEach((key) => {
      const el = section.querySelector('#' + key + '-error');
      const field = section.querySelector('[name="' + key + '"]');
      if (el) (el as HTMLElement).textContent = errors[key] || '';
      (field as HTMLElement)?.closest?.('.form-group')?.classList.toggle('field-error', !!errors[key]);
    });
  }

  private focusFirstInvalid(section: HTMLElement, errors: Partial<Record<keyof Step2Payload, string>>): void {
    const keys: (keyof Step2Payload)[] = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'state', 'agreement'];
    const firstInvalid = keys.find((k) => errors[k]);
    if (!firstInvalid) return;
    const field = section.querySelector<HTMLInputElement | HTMLSelectElement>('[name="' + firstInvalid + '"]');
    field?.focus();
  }
}

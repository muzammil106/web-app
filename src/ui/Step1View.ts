import type { Step1Payload, EducationLevel } from '../domain/types';
import { validateStep1 } from '../validation/step1Validator';

const STEP1_STORAGE_KEY = 'offers_app_step1';

export class Step1View {
  constructor(private readonly container: HTMLElement) {}

  render(): void {
    this.container.innerHTML = '';
    const section = document.createElement('div');
    section.className = 'form-section';
    section.innerHTML = this.getTemplate();
    this.container.appendChild(section);
    const form = section.querySelector<HTMLFormElement>('#step1-form');
    if (!form) return;
    this.preFillFromStorage(section, form);
    form.addEventListener('submit', (e) => this.onSubmit(e, section, form));
  }

  private preFillFromStorage(_section: HTMLElement, form: HTMLFormElement): void {
    try {
      const raw = sessionStorage.getItem(STEP1_STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw) as Step1Payload;
      const education = form.querySelector<HTMLSelectElement>('[name="educationLevel"]');
      if (education && data.educationLevel) education.value = data.educationLevel;
      const internet = form.querySelector<HTMLInputElement>('[name="hasInternetAccess"][value="' + String(data.hasInternetAccess) + '"]');
      if (internet) internet.checked = true;
      const certs = form.querySelector<HTMLInputElement>('[name="hasCertifications"][value="' + String(data.hasCertifications) + '"]');
      if (certs) certs.checked = true;
    } catch {
      // ignore
    }
  }

  private getTemplate(): string {
    return `
      <div class="step-indicator">
        <span class="step-dot active"></span>
        <span class="step-dot"></span>
      </div>
      <h1>Step 1 – Your background</h1>
      <p>All fields are required.</p>
      <form id="step1-form" novalidate>
        <div class="form-group">
          <label for="education">Level of Education</label>
          <select id="education" name="educationLevel" required>
            <option value="">Select...</option>
            <option value="high_school">High School</option>
            <option value="associate">Associate</option>
            <option value="bachelor">Bachelor</option>
            <option value="graduate">Graduate</option>
          </select>
          <span id="education-error" class="error-message" aria-live="polite"></span>
        </div>
        <fieldset class="form-group fieldset-options">
          <legend>Have Internet Access?</legend>
          <div class="option-row">
            <input type="radio" id="internet-yes" name="hasInternetAccess" value="true" required />
            <label for="internet-yes">Yes</label>
          </div>
          <div class="option-row">
            <input type="radio" id="internet-no" name="hasInternetAccess" value="false" />
            <label for="internet-no">No</label>
          </div>
          <span id="internet-error" class="error-message" aria-live="polite"></span>
        </fieldset>
        <fieldset class="form-group fieldset-options">
          <legend>Any Certifications?</legend>
          <div class="option-row">
            <input type="radio" id="certs-yes" name="hasCertifications" value="true" required />
            <label for="certs-yes">Yes</label>
          </div>
          <div class="option-row">
            <input type="radio" id="certs-no" name="hasCertifications" value="false" />
            <label for="certs-no">No</label>
          </div>
          <span id="certs-error" class="error-message" aria-live="polite"></span>
        </fieldset>
        <button type="submit" class="btn btn-primary" id="step1-submit">Continue</button>
      </form>
    `;
  }

  private onSubmit(e: SubmitEvent, section: HTMLElement, form: HTMLFormElement): void {
    e.preventDefault();
    const internetChecked = form.querySelector<HTMLInputElement>('[name="hasInternetAccess"]:checked');
    const certsChecked = form.querySelector<HTMLInputElement>('[name="hasCertifications"]:checked');
    const payload: Partial<Step1Payload> = {
      educationLevel: (form.querySelector<HTMLSelectElement>('[name="educationLevel"]')?.value || '') as EducationLevel,
      hasInternetAccess: internetChecked === null ? undefined : internetChecked.value === 'true',
      hasCertifications: certsChecked === null ? undefined : certsChecked.value === 'true',
    };
    const result = validateStep1(payload);
    this.showErrors(section, result.errors);
    if (!result.valid) {
      this.focusFirstInvalid(section, result.errors);
      return;
    }
    const fullPayload: Step1Payload = {
      educationLevel: payload.educationLevel!,
      hasInternetAccess: payload.hasInternetAccess!,
      hasCertifications: payload.hasCertifications!,
    };
    try {
      sessionStorage.setItem(STEP1_STORAGE_KEY, JSON.stringify(fullPayload));
    } catch {
      // ignore
    }
    window.location.href = '/step2';
  }

  private showErrors(section: HTMLElement, errors: Partial<Record<keyof Step1Payload, string>>): void {
    const nameMap: Record<string, string> = {
      educationLevel: 'education',
      hasInternetAccess: 'internet',
      hasCertifications: 'certs',
    };
    (['educationLevel', 'hasInternetAccess', 'hasCertifications'] as const).forEach((key) => {
      const el = section.querySelector('#' + nameMap[key] + '-error');
      if (el) el.textContent = errors[key] || '';
      const field = section.querySelector('[name="' + key + '"], #' + nameMap[key]);
      (field as HTMLElement)?.closest?.('.form-group')?.classList.toggle('field-error', !!errors[key]);
    });
  }

  private focusFirstInvalid(section: HTMLElement, errors: Partial<Record<keyof Step1Payload, string>>): void {
    const keyOrder: (keyof Step1Payload)[] = ['educationLevel', 'hasInternetAccess', 'hasCertifications'];
    const firstInvalid = keyOrder.find((k) => errors[k]);
    if (!firstInvalid) return;
    const idMap: Record<string, string> = {
      educationLevel: 'education',
      hasInternetAccess: 'internet-yes',
      hasCertifications: 'certs-yes',
    };
    const focusable = section.querySelector<HTMLSelectElement | HTMLInputElement>('#' + idMap[firstInvalid]);
    focusable?.focus();
  }
}

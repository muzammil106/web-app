import type { ApiService } from '../services/api';
import type { Offer } from '../domain/types';
import { validateOffersSelection } from '../validation/offersValidator';

const USER_ID_KEY = 'offers_app_user_id';
const STATE_KEY = 'offers_app_state';

function escapeHtml(s: string): string {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export class ResultsView {
  constructor(
    private readonly container: HTMLElement,
    private readonly api: ApiService
  ) {}

  async render(): Promise<void> {
    const userId = sessionStorage.getItem(USER_ID_KEY);
    const stateCode = sessionStorage.getItem(STATE_KEY);
    if (!userId || !stateCode) {
      window.location.href = '/';
      return;
    }

    this.container.innerHTML = '<p class="form-section">Loading offers…</p>';
    let offers: Offer[] = [];
    try {
      const res = await this.api.getOffers(stateCode);
      offers = res.offers ?? [];
    } catch {
      this.container.innerHTML = '<p class="form-section">Failed to load offers. <a href="/results">Retry</a>.</p>';
      return;
    }

    this.container.innerHTML = '';
    const section = document.createElement('div');
    section.className = 'form-section';
    const listHtml =
      offers.length === 0
        ? '<p>No offers available for your state.</p>'
        : '<form id="offers-form" novalidate><p>Select at least one offer.</p><ul class="offers-list" id="offers-list"></ul><div class="form-submit-error"><span id="offers-error" class="error-message" aria-live="polite" role="alert"></span></div><button type="submit" class="btn btn-primary" id="offers-submit">Confirm selections</button></form>';
    section.innerHTML = '<h1>Available offers</h1>' + listHtml;
    this.container.appendChild(section);

    const list = section.querySelector('#offers-list');
    if (list && offers.length > 0) {
      offers.forEach((offer) => {
        const li = document.createElement('li');
        li.className = 'offer-card';
        const img = offer.imageUrl ? '<img src="' + escapeAttr(offer.imageUrl) + '" alt="" width="64" height="64" />' : '';
        li.innerHTML =
          '<input type="checkbox" name="offerId" value="' +
          escapeAttr(offer.id) +
          '" id="offer-' +
          escapeAttr(offer.id) +
          '" /><label for="offer-' +
          escapeAttr(offer.id) +
          '" class="sr-only">Select ' +
          escapeHtml(offer.name) +
          '</label>' +
          img +
          '<div class="offer-card-content"><h3>' +
          escapeHtml(offer.name) +
          '</h3><p>' +
          escapeHtml(offer.description) +
          '</p></div>';
        list.appendChild(li);
      });
    }

    const form = section.querySelector<HTMLFormElement>('#offers-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const checked = Array.from(section.querySelectorAll<HTMLInputElement>('input[name="offerId"]:checked'));
      const selectedIds = checked.map((c) => c.value).filter(Boolean);
      const result = validateOffersSelection(selectedIds);
      const errEl = section.querySelector('#offers-error');
      if (errEl) (errEl as HTMLElement).textContent = result.error || '';
      if (!result.valid) return;
      const btn = form.querySelector<HTMLButtonElement>('#offers-submit');
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Submitting…';
      }
      try {
        await this.api.submitOffers(userId, selectedIds);
        window.location.href = '/thank-you';
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Submission failed.';
        if (errEl) (errEl as HTMLElement).textContent = msg;
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'Confirm selections';
        }
      }
    });
  }
}

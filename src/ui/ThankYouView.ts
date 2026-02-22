import type { ApiService } from '../services/api';
import type { UserSummary, Offer } from '../domain/types';

const USER_ID_KEY = 'offers_app_user_id';
const STEP1_STORAGE_KEY = 'offers_app_step1';
const STEP2_DRAFT_KEY = 'offers_app_step2_draft';
const STATE_KEY = 'offers_app_state';

export class ThankYouView {
  constructor(
    private readonly container: HTMLElement,
    private readonly api: ApiService
  ) {}

  async render(): Promise<void> {
    const userId = sessionStorage.getItem(USER_ID_KEY);
    if (!userId) {
      window.location.href = '/';
      return;
    }

    this.container.innerHTML = '<p class="form-section">Loading…</p>';
    let user: UserSummary | null = null;
    let offers: Offer[] = [];
    try {
      const data = await this.api.getThankYouData(userId);
      user = data.user;
      offers = data.offers ?? [];
    } catch {
      this.container.innerHTML = '<p class="form-section">Failed to load summary. <a href="/thank-you">Retry</a>.</p>';
      return;
    }

    if (!user) {
      this.container.innerHTML = '<p class="form-section">User not found.</p>';
      return;
    }

    this.container.innerHTML = '';
    const section = document.createElement('div');
    section.className = 'form-section';
    section.innerHTML = `
      <h1>Thank you</h1>
      <p>Here is a summary of your registration and selected offers.</p>
      <div class="summary-block">
        <h2>Your information</h2>
        <div class="summary-row"><span class="summary-label">Name: </span><span class="summary-value">${escapeHtml(user.firstName)} ${escapeHtml(user.lastName)}</span></div>
        <div class="summary-row"><span class="summary-label">Email: </span><span class="summary-value">${escapeHtml(user.email)}</span></div>
        <div class="summary-row"><span class="summary-label">Phone: </span><span class="summary-value">${escapeHtml(user.phone)}</span></div>
        <div class="summary-row"><span class="summary-label">Address: </span><span class="summary-value">${escapeHtml(user.address)}, ${escapeHtml(user.city)}, ${escapeHtml(user.stateCode)}</span></div>
        <div class="summary-row"><span class="summary-label">Education: </span><span class="summary-value">${escapeHtml(formatEducation(user.educationLevel))}</span></div>
        <div class="summary-row"><span class="summary-label">Internet access: </span><span class="summary-value">${user.hasInternetAccess ? 'Yes' : 'No'}</span></div>
        <div class="summary-row"><span class="summary-label">Certifications: </span><span class="summary-value">${user.hasCertifications ? 'Yes' : 'No'}</span></div>
      </div>
      <div class="summary-block">
        <h2>Selected offers</h2>
        <ul class="offers-list" id="thank-you-offers"></ul>
      </div>
      <p class="thank-you-actions">
        <a href="/" class="btn btn-primary btn-start-over" id="start-over-btn">Start over</a>
      </p>
    `;
    this.container.appendChild(section);

    const startOverBtn = section.querySelector<HTMLAnchorElement>('#start-over-btn');
    if (startOverBtn) {
      startOverBtn.addEventListener('click', (e) => {
        e.preventDefault();
        try {
          sessionStorage.removeItem(STEP1_STORAGE_KEY);
          sessionStorage.removeItem(STEP2_DRAFT_KEY);
          sessionStorage.removeItem(USER_ID_KEY);
          sessionStorage.removeItem(STATE_KEY);
        } catch {
          // ignore
        }
        window.location.href = '/';
      });
    }

    const list = section.querySelector('#thank-you-offers');
    if (list) {
      if (offers.length === 0) {
        list.innerHTML = '<li><p>No offers selected.</p></li>';
      } else {
        offers.forEach((offer) => {
          const li = document.createElement('li');
          li.className = 'offer-card';
          const img = offer.imageUrl
            ? `<img src="${escapeAttr(offer.imageUrl)}" alt="" width="64" height="64" />`
            : '';
          li.innerHTML = `
            ${img}
            <div class="offer-card-content">
              <h3>${escapeHtml(offer.name)}</h3>
              <p>${escapeHtml(offer.description)}</p>
            </div>
          `;
          list.appendChild(li);
        });
      }
    }
  }
}

function escapeHtml(s: string): string {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

function escapeAttr(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatEducation(level: string): string {
  const map: Record<string, string> = {
    high_school: 'High School',
    associate: 'Associate',
    bachelor: 'Bachelor',
    graduate: 'Graduate',
  };
  return map[level] ?? level;
}

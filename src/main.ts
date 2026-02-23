import { loadConfig } from './config/env';
import { ApiService } from './services/api';
import { Step1View } from './ui/Step1View';
import { Step2View } from './ui/Step2View';
import { ResultsView } from './ui/ResultsView';
import { ThankYouView } from './ui/ThankYouView';

const ROUTES = {
  step1: '/',
  step2: '/step2',
  results: '/results',
  thankYou: '/thank-you',
} as const;

function getPath(): string {
  return window.location.pathname.replace(/\/$/, '') || '/';
}

async function main(): Promise<void> {
  const app = document.getElementById('app');
  if (!app) return;

  let config: ReturnType<typeof loadConfig>;
  try {
    config = loadConfig();
  } catch {
    app.innerHTML = '<p class="form-section">Missing config. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.</p>';
    return;
  }

  const api = new ApiService(config);
  const path = getPath();

  if (path === ROUTES.step1) {
    new Step1View(app).render();
  } else if (path === ROUTES.step2) {
    new Step2View(app, api).render();
  } else if (path === ROUTES.results) {
    await new ResultsView(app, api).render();
  } else if (path === ROUTES.thankYou) {
    await new ThankYouView(app, api).render();
  } else {
    window.location.href = ROUTES.step1;
  }
}

void main();

import type { AppConfig } from '../config/env';
import type { RegistrationDTO, Offer, UserSummary } from '../domain/types';

export class ApiService {
  constructor(private readonly config: AppConfig) {}

  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.config.supabaseAnonKey}`,
    };
  }

  private async invoke<T>(name: string, body: unknown): Promise<T> {
    const url = `${this.config.supabaseUrl}/functions/v1/${name}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      let message: string | null = null;
      try {
        const json = JSON.parse(text) as { error?: string };
        if (typeof json.error === 'string' && json.error.trim()) message = json.error.trim();
      } catch {
        // ignore parse error
      }
      throw new Error(message ?? 'Request failed. Please try again.');
    }
    return res.json() as Promise<T>;
  }

  async register(data: RegistrationDTO): Promise<{ userId: string }> {
    return this.invoke<{ userId: string }>('register-user', data);
  }

  async getOffers(stateCode: string): Promise<{ offers: Offer[] }> {
    return this.invoke<{ offers: Offer[] }>('get-offers', { stateCode });
  }

  async submitOffers(userId: string, offerIds: string[]): Promise<{ ok: boolean }> {
    return this.invoke<{ ok: boolean }>('submit-offers', { userId, offerIds });
  }

  async getThankYouData(userId: string): Promise<{ user: UserSummary; offers: Offer[] }> {
    return this.invoke<{ user: UserSummary; offers: Offer[] }>('thank-you-data', { userId });
  }
}

import { saveApiKey, deleteApiKey } from '../lib/auth.js';
import { outputJSON } from '../lib/output.js';

export async function authLogin(apiKey: string): Promise<void> {
  await saveApiKey(apiKey);
  outputJSON({ ok: true });
}

export async function authLogout(): Promise<void> {
  await deleteApiKey();
  outputJSON({ ok: true });
}

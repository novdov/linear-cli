import { readFileSync } from 'node:fs';
import { mkdir, unlink } from 'node:fs/promises';
import { join } from 'node:path';

const CREDENTIALS_DIR = join(Bun.env.HOME!, '.linear-cli');
const CREDENTIALS_FILE = join(CREDENTIALS_DIR, 'credentials.json');

export function getApiKey(): string | null {
  if (Bun.env.LINEAR_API_KEY) {
    return Bun.env.LINEAR_API_KEY;
  }

  try {
    const content = readFileSync(CREDENTIALS_FILE, 'utf-8');
    const parsed = JSON.parse(content) as { apiKey?: string };
    return parsed.apiKey ?? null;
  } catch {
    return null;
  }
}

export async function saveApiKey(apiKey: string): Promise<void> {
  await mkdir(CREDENTIALS_DIR, { recursive: true });
  await Bun.write(CREDENTIALS_FILE, JSON.stringify({ apiKey }));
}

export async function deleteApiKey(): Promise<void> {
  try {
    await unlink(CREDENTIALS_FILE);
  } catch {
    // File doesn't exist, treat as success
  }
}

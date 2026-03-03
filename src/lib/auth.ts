import { readFileSync } from 'fs';
import { mkdir, writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';

const CREDENTIALS_DIR = join(homedir(), '.linear-cli');
const CREDENTIALS_FILE = join(CREDENTIALS_DIR, 'credentials.json');

export function getApiKey(): string | null {
  if (process.env.LINEAR_API_KEY) {
    return process.env.LINEAR_API_KEY;
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
  await writeFile(CREDENTIALS_FILE, JSON.stringify({ apiKey }));
}

export async function deleteApiKey(): Promise<void> {
  try {
    await unlink(CREDENTIALS_FILE);
  } catch {
    // File doesn't exist, treat as success
  }
}

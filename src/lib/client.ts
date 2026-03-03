import { LinearClient } from '@linear/sdk';
import { getApiKey } from './auth.js';
import { outputError } from './output.js';

export function getClient(): LinearClient {
  const apiKey = getApiKey();
  if (!apiKey) {
    outputError('Not authenticated. Run: linear auth login <api-key>');
  }
  return new LinearClient({ apiKey });
}

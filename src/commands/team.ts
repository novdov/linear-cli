import { getClient } from '../lib/client.js';
import { outputJSON } from '../lib/output.js';

export async function teamList(): Promise<void> {
  const client = getClient();
  const teams = await client.teams();
  outputJSON(
    teams.nodes.map((t) => ({
      id: t.id,
      name: t.name,
      key: t.key,
    }))
  );
}

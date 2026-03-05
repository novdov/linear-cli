import { getClient } from '../lib/client';
import { outputJSON } from '../lib/output';
import { resolveTeamId } from '../lib/resolver';

interface ListOptions {
  team?: string;
}

export async function labelList(opts: ListOptions): Promise<void> {
  const client = getClient();

  const filter: Record<string, unknown> = {};
  if (opts.team) {
    const teamId = await resolveTeamId(client, opts.team);
    filter.team = { id: { eq: teamId } };
  }

  const labels = await client.issueLabels({
    filter: Object.keys(filter).length > 0 ? filter : undefined,
  });

  outputJSON(labels.nodes.map((l) => ({ id: l.id, name: l.name })));
}

import { getClient } from '../lib/client';
import { outputJSON } from '../lib/output';
import { resolveTeamId } from '../lib/resolver';

interface ListOptions {
  team?: string;
}

export async function labelList(opts: ListOptions): Promise<void> {
  const client = getClient();

  const filter: Record<string, unknown> = opts.team
    ? {
        or: [
          { team: { null: true } },
          { team: { id: { eq: await resolveTeamId(client, opts.team) } } },
        ],
      }
    : { team: { null: true } };

  const labels = await client.issueLabels({ filter });

  outputJSON(labels.nodes.map((l) => ({ id: l.id, name: l.name })));
}

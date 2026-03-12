import { getClient } from '../lib/client';
import { outputJSON } from '../lib/output';

const ACTIVE_STATES = ['planned', 'started', 'paused'];

export async function projectList(): Promise<void> {
  const client = getClient();
  const projects = await client.projects();
  outputJSON(
    projects.nodes
      .filter((p) => ACTIVE_STATES.includes(p.state))
      .map((p) => ({
        id: p.id,
        name: p.name,
        state: p.state,
        url: p.url,
      }))
  );
}

import type { LinearClient } from '@linear/sdk';
import { outputError } from './output.js';

export async function resolveTeamId(client: LinearClient, nameOrKey: string): Promise<string> {
  const teams = await client.teams();
  const team = teams.nodes.find((t) => t.name === nameOrKey || t.key === nameOrKey);
  if (!team) {
    outputError(`Team not found: ${nameOrKey}`);
  }
  return team.id;
}

export async function resolveAssigneeId(client: LinearClient, name: string): Promise<string> {
  if (name === 'me') {
    const me = await client.viewer;
    return me.id;
  }
  const users = await client.users();
  const user = users.nodes.find((u) => u.name === name);
  if (!user) {
    outputError(`User not found: ${name}`);
  }
  return user.id;
}

export async function resolveStateId(
  client: LinearClient,
  teamId: string,
  stateName: string
): Promise<string> {
  const team = await client.team(teamId);
  const states = await team.states();
  const state = states.nodes.find((s) => s.name === stateName);
  if (!state) {
    outputError(`State not found: ${stateName}`);
  }
  return state.id;
}

export async function resolveLabelIds(client: LinearClient, labelsStr: string): Promise<string[]> {
  const names = labelsStr.split(',').map((s) => s.trim());
  const labels = await client.issueLabels();
  const ids: string[] = [];
  for (const name of names) {
    const label = labels.nodes.find((l) => l.name === name);
    if (!label) {
      outputError(`Label not found: ${name}`);
    }
    ids.push(label.id);
  }
  return ids;
}

export async function resolveProjectId(client: LinearClient, name: string): Promise<string> {
  const projects = await client.projects();
  const project = projects.nodes.find((p) => p.name === name);
  if (!project) {
    outputError(`Project not found: ${name}`);
  }
  return project.id;
}

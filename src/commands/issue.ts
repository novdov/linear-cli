import type { Issue, LinearClient } from '@linear/sdk';
import { getClient } from '../lib/client';
import { outputJSON, outputError } from '../lib/output';
import {
  resolveTeamId,
  resolveAssigneeId,
  resolveStateId,
  resolveLabelIds,
  resolveProjectId,
} from '../lib/resolver';

async function formatIssue(issue: Issue, includeComments: boolean) {
  const [state, assignee, labels] = await Promise.all([
    issue.state,
    issue.assignee,
    issue.labels(),
  ]);

  const base: Record<string, unknown> = {
    id: issue.id,
    identifier: issue.identifier,
    title: issue.title,
    description: issue.description ?? null,
    url: issue.url,
    state: state ? { name: state.name, type: state.type } : null,
    assignee: assignee ? { id: assignee.id, name: assignee.name } : null,
    priority: issue.priority,
    labels: labels.nodes.map((l) => ({ id: l.id, name: l.name })),
    branchName: issue.branchName,
  };

  if (includeComments) {
    const comments = await issue.comments();
    base.comments = await Promise.all(
      comments.nodes.map(async (c) => {
        const author = await c.user;
        return {
          id: c.id,
          body: c.body,
          author: author ? { name: author.name } : null,
          createdAt: c.createdAt,
        };
      })
    );
  }

  return base;
}

export async function issueGet(id: string): Promise<void> {
  const client = getClient();
  const issue = await client.issue(id);
  outputJSON(await formatIssue(issue, true));
}

interface ListOptions {
  team?: string;
  assignee?: string;
  state?: string;
  limit?: string;
}

export async function issueList(opts: ListOptions): Promise<void> {
  const client = getClient();

  const filter: Record<string, unknown> = {};

  if (opts.team) {
    const teamId = await resolveTeamId(client, opts.team);
    filter.team = { id: { eq: teamId } };
  }

  if (opts.assignee) {
    const assigneeId = await resolveAssigneeId(client, opts.assignee);
    filter.assignee = { id: { eq: assigneeId } };
  }

  if (opts.state) {
    if (!opts.team) {
      outputError(
        'Missing required option: --team. --state requires --team context. Run "linear issue --help" for usage.'
      );
    }
    const teamId = await resolveTeamId(client, opts.team);
    const stateId = await resolveStateId(client, teamId, opts.state);
    filter.state = { id: { eq: stateId } };
  }

  const first = opts.limit ? Number(opts.limit) : 10;

  const issues = await client.issues({
    first,
    filter: Object.keys(filter).length > 0 ? filter : undefined,
  });

  const result = await Promise.all(
    issues.nodes.map(async (issue) => {
      const [state, assignee] = await Promise.all([issue.state, issue.assignee]);
      return {
        id: issue.id,
        identifier: issue.identifier,
        title: issue.title,
        state: state ? { name: state.name, type: state.type } : null,
        assignee: assignee ? { id: assignee.id, name: assignee.name } : null,
        priority: issue.priority,
        url: issue.url,
      };
    })
  );

  outputJSON(result);
}

interface CreateOptions {
  team: string;
  title: string;
  description?: string;
  assignee?: string;
  state?: string;
  priority?: string;
  labels?: string;
  project?: string;
}

export async function issueCreate(opts: CreateOptions): Promise<void> {
  const client = getClient();

  const teamId = await resolveTeamId(client, opts.team);
  const input: Record<string, unknown> = {
    teamId,
    title: opts.title,
  };

  if (opts.description) input.description = opts.description;
  if (opts.priority) input.priority = Number(opts.priority);

  const resolvers: Promise<void>[] = [];

  if (opts.assignee) {
    resolvers.push(
      resolveAssigneeId(client, opts.assignee).then((id) => {
        input.assigneeId = id;
      })
    );
  }

  if (opts.state) {
    resolvers.push(
      resolveStateId(client, teamId, opts.state).then((id) => {
        input.stateId = id;
      })
    );
  }

  if (opts.labels) {
    resolvers.push(
      resolveLabelIds(client, opts.labels).then((ids) => {
        input.labelIds = ids;
      })
    );
  }

  if (opts.project) {
    resolvers.push(
      resolveProjectId(client, opts.project).then((id) => {
        input.projectId = id;
      })
    );
  }

  await Promise.all(resolvers);

  const payload = await client.createIssue(input as Parameters<typeof client.createIssue>[0]);
  const issue = await payload.issue;
  if (!issue) {
    throw new Error('Failed to create issue');
  }
  outputJSON(await formatIssue(issue, false));
}

interface UpdateOptions {
  title?: string;
  description?: string;
  state?: string;
  assignee?: string;
  priority?: string;
  labels?: string;
  project?: string;
}

export async function issueUpdate(id: string, opts: UpdateOptions): Promise<void> {
  const hasAnyOption = Object.values(opts).some((v) => v !== undefined);
  if (!hasAnyOption) {
    outputError('No update options provided. Run "linear issue update --help" for usage.');
  }

  const client = getClient();
  const input: Record<string, unknown> = {};

  if (opts.title) input.title = opts.title;
  if (opts.description) input.description = opts.description;
  if (opts.priority) input.priority = Number(opts.priority);

  const resolvers: Promise<void>[] = [];

  if (opts.assignee) {
    resolvers.push(
      resolveAssigneeId(client, opts.assignee).then((aid) => {
        input.assigneeId = aid;
      })
    );
  }

  if (opts.state) {
    resolvers.push(
      resolveStateForUpdate(client, id, opts.state).then((sid) => {
        input.stateId = sid;
      })
    );
  }

  if (opts.labels) {
    resolvers.push(
      resolveLabelIds(client, opts.labels).then((ids) => {
        input.labelIds = ids;
      })
    );
  }

  if (opts.project) {
    resolvers.push(
      resolveProjectId(client, opts.project).then((pid) => {
        input.projectId = pid;
      })
    );
  }

  await Promise.all(resolvers);

  const payload = await client.updateIssue(id, input);
  const issue = await payload.issue;
  if (!issue) {
    throw new Error('Failed to update issue');
  }
  outputJSON(await formatIssue(issue, false));
}

async function resolveStateForUpdate(
  client: LinearClient,
  issueId: string,
  stateName: string
): Promise<string> {
  const issue = await client.issue(issueId);
  const team = await issue.team;
  if (!team) {
    throw new Error('Issue has no team');
  }
  return resolveStateId(client, team.id, stateName);
}

import { getClient } from '../lib/client.js';
import { outputJSON } from '../lib/output.js';

export async function commentCreate(issueId: string, opts: { body: string }): Promise<void> {
  const client = getClient();
  const payload = await client.createComment({ issueId, body: opts.body });
  const comment = await payload.comment;
  if (!comment) {
    throw new Error('Failed to create comment');
  }
  const author = await comment.user;
  outputJSON({
    id: comment.id,
    body: comment.body,
    author: author ? { name: author.name } : null,
    createdAt: comment.createdAt,
  });
}

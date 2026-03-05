import { Command } from 'commander';
import { printHelp } from './lib/help';
import { outputError } from './lib/output';
import { authLogin, authLogout } from './commands/auth';
import { teamList } from './commands/team';
import { commentCreate } from './commands/comment';
import { issueGet, issueList, issueCreate, issueUpdate } from './commands/issue';
import { labelList } from './commands/label';

const KNOWN_SCOPES = ['auth', 'issue', 'comment', 'team', 'label'];

function hasHelp(args: string[]): boolean {
  return args.includes('--help') || args.includes('-h');
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || hasHelp(args)) {
    const scope = args[0];
    if (scope && KNOWN_SCOPES.includes(scope)) {
      printHelp(scope);
    }
    printHelp('main');
  }

  const scope = args[0]!;
  if (!KNOWN_SCOPES.includes(scope)) {
    outputError(`Unknown command: ${scope}. Run "linear --help" for usage.`);
  }

  const program = new Command();
  program.name('linear');
  program.helpOption(false);
  program.helpCommand(false);
  program.exitOverride();
  program.configureOutput({
    writeOut: () => {},
    writeErr: () => {},
  });

  const auth = program.command('auth');
  auth.command('login').argument('<api-key>').action(authLogin);
  auth.command('logout').action(authLogout);

  const issue = program.command('issue');
  issue.command('get').argument('<id>').action(issueGet);
  issue
    .command('list')
    .option('--team <name>')
    .option('--assignee <name>')
    .option('--state <name>')
    .option('--limit <number>')
    .action(issueList);
  issue
    .command('create')
    .requiredOption('--team <name>')
    .requiredOption('--title <text>')
    .option('--description <text>')
    .option('--assignee <name>')
    .option('--state <name>')
    .option('--priority <number>')
    .option('--labels <names>')
    .option('--project <name>')
    .action(issueCreate);
  issue
    .command('update')
    .argument('<id>')
    .option('--title <text>')
    .option('--description <text>')
    .option('--state <name>')
    .option('--assignee <name>')
    .option('--priority <number>')
    .option('--labels <names>')
    .option('--project <name>')
    .action(issueUpdate);

  const comment = program.command('comment');
  comment
    .command('create')
    .argument('<issue-id>')
    .requiredOption('--body <text>')
    .action(commentCreate);

  const team = program.command('team');
  team.command('list').action(teamList);

  const label = program.command('label');
  label.command('list').option('--team <name>').action(labelList);

  try {
    await program.parseAsync(process.argv);
  } catch (err) {
    if (err instanceof Error && 'code' in err) {
      const code = (err as { code: string }).code;
      if (
        code === 'commander.missingMandatoryOptionValue' ||
        code === 'commander.missingOptionValue'
      ) {
        const match = err.message.match(/required option '(--\S+)/);
        const optName = match?.[1] ?? 'unknown';
        outputError(`Missing required option: ${optName}. Run "linear ${scope} --help" for usage.`);
      }
      if (code === 'commander.missingArgument') {
        outputError(`Missing required argument. Run "linear ${scope} --help" for usage.`);
      }
    }
    throw err;
  }
}

main().catch((err: Error) => {
  outputError(err.message);
});

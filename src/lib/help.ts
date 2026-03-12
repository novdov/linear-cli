const HELP_MAIN = `Usage: linear <command> [options]

Commands:
  auth     Manage authentication
  issue    Manage issues
  comment  Manage comments
  team     Manage teams
  label    Manage labels
  project  Manage projects

Run "linear <command> --help" for more information.`;

const HELP_AUTH = `Usage: linear auth <command>

Commands:
  login <api-key>   Save API key
  logout            Remove saved credentials`;

const HELP_ISSUE = `Usage: linear issue <command> [options]

Commands:
  get <id>            Get issue details
  list [options]      List issues
  create [options]    Create an issue
  update <id> [options]  Update an issue

Issue Get:
  linear issue get <id>

Issue List:
  linear issue list [--team <name>] [--assignee <name>] [--state <name>] [--limit <number>]

Issue Create (required: --team, --title):
  linear issue create --team <name> --title <text> [--description <text>]
    [--assignee <name>] [--state <name>] [--priority <0-4>]
    [--labels <a,b>] [--project <name>]

Issue Update:
  linear issue update <id> [--title <text>] [--description <text>]
    [--state <name>] [--assignee <name>] [--priority <0-4>]
    [--labels <a,b>] [--project <name>]

Options:
  --team <name>        Team name or key
  --assignee <name>    "me" or user name
  --state <name>       State name (e.g., "Done", "In Progress")
  --priority <0-4>     0=None, 1=Urgent, 2=High, 3=Normal, 4=Low
  --labels <a,b>       Comma-separated label names
  --project <name>     Project name
  --limit <number>     Max issues to return (default: 10)`;

const HELP_COMMENT = `Usage: linear comment <command>

Commands:
  create <issue-id> --body <text>   Add a comment to an issue`;

const HELP_TEAM = `Usage: linear team <command>

Commands:
  list   List all teams`;

const HELP_LABEL = `Usage: linear label <command> [options]

Commands:
  list [options]   List labels

Label List:
  linear label list [--team <name>]

Without --team, only workspace labels are shown.
With --team, workspace labels and the team's labels are shown.

Options:
  --team <name>   Include team labels along with workspace labels`;

const HELP_PROJECT = `Usage: linear project <command>

Commands:
  list   List active projects`;

const helpMessages: Record<string, string> = {
  main: HELP_MAIN,
  auth: HELP_AUTH,
  issue: HELP_ISSUE,
  comment: HELP_COMMENT,
  team: HELP_TEAM,
  label: HELP_LABEL,
  project: HELP_PROJECT,
};

export function printHelp(scope: string): void {
  const message = helpMessages[scope];
  if (message) {
    console.log(message);
    process.exit(0);
  }
}

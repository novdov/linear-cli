# linear-cli

A lightweight CLI for Linear, built as a local replacement for Linear MCP to reduce context usage in Claude Code.

All output is JSON. Designed for both human and agent consumption.

## Setup

Requires [Bun](https://bun.sh).

```bash
bun run build
./install.sh          # installs to /usr/local/bin/linear
```

## Authentication

```bash
linear auth login <api-key>
```

API key is stored at `~/.linear-cli/credentials.json`. Alternatively, set `LINEAR_API_KEY` env var.

## Usage

```bash
linear --help
linear <command> --help
```

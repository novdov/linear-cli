export function outputJSON(data: unknown): void {
  console.log(JSON.stringify(data));
}

export function outputError(message: string): never {
  console.log(JSON.stringify({ error: message }));
  process.exit(1);
}

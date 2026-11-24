export default async function globalTeardown(): Promise<void> {
  const server = globalThis.__INT_SERVER__;
  if (!server || server.exitCode !== null) return;

  await new Promise<void>((resolve) => {
    server.once('exit', () => resolve());
    server.kill();
  });
}

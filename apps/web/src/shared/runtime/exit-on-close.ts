import process from 'node:process';
import { definePlugin } from 'nitro';

// On SIGTERM, the server waits for the requests in flight and then leaves the
// exit to an empty event loop. The runtime's Postgres pool keeps the loop
// busy, so the process would wait for Podman's SIGKILL (exit 137, which fails
// the slot's systemd unit). Nitro calls `close` once the server has closed.
// The dev server calls it too, inside a process that must keep running, so
// only the production server exits.
export default definePlugin((nitroApp) => {
  if (import.meta.preset !== 'bun') {
    return;
  }
  nitroApp.hooks.hook('close', () => {
    process.exit(0);
  });
});

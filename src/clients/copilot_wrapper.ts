import { execFile } from 'child_process';

export async function sendToCopilot(envelope: any) {
  if (process.env.SKIP_MODEL) {
    return { ok: true, reply: `MOCK Copilot reply to: ${envelope.text.slice(0, 240)}` };
  }
  // If a Copilot CLI / local wrapper exists, call it here. This is a placeholder.
  // Example: execFile('copilot-cli', ['--prompt', envelope.text], ...)
  return { ok: false, error: 'Copilot CLI not configured — set COPILOT_CLI or implement wrapper' };
}

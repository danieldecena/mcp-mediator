import fetch from 'node-fetch';

export async function sendToClaude(envelope: any) {
  // If SKIP_MODEL set, return deterministic mock
  if (process.env.SKIP_MODEL) {
    return { ok: true, reply: `MOCK Claude reply to: ${envelope.text.slice(0, 240)}` };
  }
  try {
    const apiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return { ok: false, error: 'No CLAUDE_API_KEY set' };
    // Merge system prompt if provided
    const userContent = envelope.system ? `${envelope.system}\n\n${envelope.text}` : envelope.text;
    const res = await fetch(process.env.CLAUDE_API_URL || 'https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
      body: JSON.stringify({ model: process.env.CLAUDE_MODEL || 'claude-1', messages: [{ role: 'user', content: userContent }] })
    });
    const json = await res.json();
    const text = json?.content?.[0]?.text || JSON.stringify(json);
    return { ok: true, reply: text };
  } catch (err: any) {
    return { ok: false, error: String(err) };
  }
}

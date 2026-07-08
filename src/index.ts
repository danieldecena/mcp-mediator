import express from 'express';
import bodyParser from 'body-parser';
import { sendToClaude } from './clients/claude_wrapper';
import { sendToCopilot } from './clients/copilot_wrapper';
import { appendMessage, getConversation } from './storage';
import { runGit } from './git_control';

const app = express();
app.use(bodyParser.json());

// Tools endpoint for MCP inspector + role/trigger descriptions
app.get('/tools', (req, res) => {
  res.json({
    tools: [
      {
        name: 'send_message',
        description:
          'Send a message envelope to either Claude or Copilot and record the exchange. Use trigger to influence role behavior: trigger=build (Claude acts as builder), trigger=support (Copilot provides guidance).',
        inputSchema: {
          type: 'object',
          properties: {
            convoId: { type: 'string' },
            from: { type: 'string', enum: ['user','copilot','claude'] },
            to: { type: 'string', enum: ['copilot','claude'] },
            text: { type: 'string' },
            trigger: { type: 'string', description: 'Optional trigger: build|support|debug|review' }
          },
          required: ['convoId','from','to','text']
        }
      },
      {
        name: 'git_control',
        description: 'Perform git actions in the repository. Requires MEDIATOR_API_KEY to be set and provided via x-mediator-key header. Actions are: create_branch, commit, push, pr. Use with caution.',
        inputSchema: {
          type: 'object',
          properties: {
            action: { type: 'string', enum: ['create_branch','commit','push','pr'] },
            params: { type: 'object' }
          },
          required: ['action']
        }
      }
    ],
    roles: {
      claude: 'Builder — produces runnable code, implementation plans, and concrete artifacts. When triggered with build, focus on code correctness and minimal reproducible outputs.',
      copilot: 'Support/Director — suggests high-level direction, debugging steps, and review comments. When triggered with support or debug, provide alternatives and testing guidance.'
    }
  });
});

// Relay endpoint with trigger-aware system prompts
app.post('/send', async (req, res) => {
  const envelope = req.body;
  if (!envelope || !envelope.convoId || !envelope.to || !envelope.text) {
    return res.status(400).json({ ok: false, error: 'missing fields' });
  }

  const trigger = (envelope.trigger || '').toLowerCase();

  // Determine system instruction based on target and trigger/role
  let systemPrompt = '';
  if (envelope.to === 'claude') {
    // Claude is the builder by default
    systemPrompt = 'You are CLAUDE, the Builder. Produce concise, runnable implementation artifacts. Prefer code snippets, tests, and step-by-step plans. If asked for design, include trade-offs and minimal examples.';
    if (trigger === 'build') {
      systemPrompt += ' Trigger: BUILD — focus on shipping minimal correct code, include examples and tests.';
    } else if (trigger === 'review') {
      systemPrompt += ' Trigger: REVIEW — look for correctness, edge cases, and propose fixes.';
    } else if (trigger === 'debug') {
      systemPrompt += ' Trigger: DEBUG — propose debugging steps, likely root causes, and small reproductions.';
    }
  } else if (envelope.to === 'copilot') {
    systemPrompt = 'You are COPILOT, the Support Agent. Provide high-level direction, review suggestions, and debugging guidance. Do not execute code; propose steps and rationale.';
    if (trigger === 'support') {
      systemPrompt += ' Trigger: SUPPORT — provide options, trade-offs, and a recommended next action.';
    } else if (trigger === 'debug') {
      systemPrompt += ' Trigger: DEBUG — analyze symptoms, suggest checks, and prioritize fixes.';
    }
  }

  // store incoming with metadata
  appendMessage(envelope.convoId, { role: envelope.from || 'user', to: envelope.to, text: envelope.text, trigger: trigger, ts: Date.now() });

  // attach system prompt to envelope for clients
  envelope.system = systemPrompt;

  let result: any;
  if (envelope.to === 'claude') {
    result = await sendToClaude(envelope);
  } else if (envelope.to === 'copilot') {
    result = await sendToCopilot(envelope);
  } else {
    return res.status(400).json({ ok: false, error: 'unknown target' });
  }

  if (result.ok) {
    appendMessage(envelope.convoId, { role: envelope.to, text: result.reply, trigger: trigger, ts: Date.now() });
    return res.json({ ok: true, reply: result.reply });
  }
  return res.status(500).json({ ok: false, error: result.error });
});

// Git control route — gated by MEDIATOR_API_KEY (required) and supports dry-run via MEDIATOR_DRY_RUN
app.post('/git', async (req, res) => {
  const key = req.header('x-mediator-key') || '';
  const expected = process.env.MEDIATOR_API_KEY || '';
  if (!expected) return res.status(503).json({ ok: false, error: 'Git control not configured on server' });
  if (!key || key !== expected) return res.status(403).json({ ok: false, error: 'Forbidden — invalid mediator key' });

  const { action, params } = req.body || {};
  if (!action) return res.status(400).json({ ok: false, error: 'missing action' });

  try {
    const r = await runGit(action, params);
    if (r.ok) return res.json({ ok: true, result: r });
    return res.status(500).json({ ok: false, error: r.err || r });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: String(e) });
  }
});

app.get('/conversations/:id', (req, res) => {
  const conv = getConversation(req.params.id);
  res.json({ ok: true, convo: conv });
});

const PORT = process.env.MEDIATOR_PORT ? Number(process.env.MEDIATOR_PORT) : 4302;
app.listen(PORT, () => console.log(`MCP Mediator listening on ${PORT}`));

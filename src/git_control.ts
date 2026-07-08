import { execFile } from 'child_process';
import path from 'path';

const REPO_ROOT = path.resolve(__dirname, '..', '..');

function runCmd(cmd: string, args: string[], opts: any = {}): Promise<{ ok: boolean; out: string; err: string }> {
  return new Promise((resolve) => {
    execFile(cmd, args, { cwd: REPO_ROOT, ...opts }, (error, stdout, stderr) => {
      if (error) return resolve({ ok: false, out: stdout.toString(), err: stderr.toString() || String(error) });
      return resolve({ ok: true, out: stdout.toString(), err: stderr.toString() });
    });
  });
}

export async function runGit(action: string, params: any = {}) {
  // Safety: require MEDIATOR_API_KEY to be set and provided by caller (index.ts will check)
  if (process.env.MEDIATOR_DRY_RUN) {
    return { ok: true, dry: true, cmd: `${action} ${JSON.stringify(params)}` };
  }

  switch (action) {
    case 'create_branch': {
      const branch = params.branch || `feature/${Date.now()}`;
      return await runCmd('git', ['checkout', '-b', branch]);
    }
    case 'commit': {
      const message = params.message || 'Automated commit from mediator';
      // Stage specified files or all
      const files = params.files && Array.isArray(params.files) && params.files.length ? params.files : ['.'];
      const addRes = await runCmd('git', ['add', ...files]);
      if (!addRes.ok) return addRes;
      return await runCmd('git', ['commit', '-m', message]);
    }
    case 'push': {
      const branch = params.branch || 'main';
      return await runCmd('git', ['push', 'origin', branch]);
    }
    case 'pr': {
      // Use gh CLI if available
      const title = params.title || 'Automated PR';
      const body = params.body || '';
      const base = params.base || 'main';
      const head = params.head; // required
      if (!head) return { ok: false, out: '', err: 'head branch required for pr' };
      // gh pr create --title title --body body --base base --head head
      return await runCmd('gh', ['pr', 'create', '--title', title, '--body', body, '--base', base, '--head', head]);
    }
    default:
      return { ok: false, out: '', err: 'unknown git action' };
  }
}

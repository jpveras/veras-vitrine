// Liga o site (localhost:3000) e o leitor do canal juntos.
import { spawn } from 'node:child_process';

const win = process.platform === 'win32';
const run = (cmd, args) => spawn(cmd, args, { stdio: 'inherit', shell: win });
const site = run(win ? 'npx.cmd' : 'npx', ['next', 'dev']);
const poller = run('node', ['scripts/local-poller.mjs']);

const stop = () => {
  site.kill();
  poller.kill();
  process.exit(0);
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
site.on('exit', stop);

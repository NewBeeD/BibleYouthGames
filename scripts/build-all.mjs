import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const runCommand = (command, args, options = {}) => {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd || rootDir,
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, ...(options.env || {}) }
    });

    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(' ')} failed with exit code ${code}`));
    });
  });
};

const bibleFrontendDir = path.join(rootDir, 'apps', 'bibletimeline', 'frontend');
const bibleServerDir = path.join(rootDir, 'apps', 'bibletimeline', 'server');
const npatDir = path.join(rootDir, 'apps', 'nameplaceanimalthing');

await runCommand('npm', ['install'], { cwd: bibleFrontendDir });
await runCommand('npm', ['install'], { cwd: bibleServerDir });
await runCommand('npm', ['install'], { cwd: npatDir });

await runCommand('npm', ['run', 'build'], {
  cwd: bibleFrontendDir,
  env: { PUBLIC_URL: '/bibletimeline' }
});

await runCommand('npm', ['run', 'build'], { cwd: npatDir });

console.log('Build complete for both games.');

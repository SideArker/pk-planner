import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { toQR } from 'toqr';

const root = fileURLToPath(new URL('../', import.meta.url));
const port = 8081;
const origin = `http://127.0.0.1:${port}`;
const detached = process.platform !== 'win32';
let tunnel;
let expo;
let stopping = false;

function kill(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  try {
    if (detached) process.kill(-child.pid, 'SIGTERM');
    else child.kill('SIGTERM');
  } catch (error) {
    if (error.code !== 'ESRCH') console.error(error);
  }
}

function stop(code) {
  if (stopping) return;
  stopping = true;
  process.exitCode = code;
  kill(expo);
  kill(tunnel);
}

function printQR(url) {
  const data = toQR(url);
  const size = Math.sqrt(data.length);
  const lines = ['▄'.repeat(size + 2)];
  for (let row = 0; row < size; row += 2) {
    let line = '█';
    for (let col = 0; col < size; col++) {
      const upper = data[row * size + col] ?? 1;
      const lower = data[(row + 1) * size + col] ?? 1;
      line += upper === 0 ? (lower === 0 ? '█' : '▀') : (lower === 0 ? '▄' : ' ');
    }
    lines.push(`${line}█`);
  }
  if (size % 2 === 0) lines.push('▀'.repeat(size + 2));
  console.log(lines.join('\n'));
}

async function showQRWhenReady(url) {
  for (let attempt = 0; attempt < 60 && !stopping; attempt++) {
    try {
      const response = await fetch(`${origin}/status`, { signal: AbortSignal.timeout(2_000) });
      if (response.ok && (await response.text()) === 'packager-status:running') {
        console.log(`\nScan this QR code in Expo Go (${url}):`);
        printQR(url);
        return;
      }
    } catch {
      // Metro has not started yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  if (!stopping) {
    console.error('Metro did not start on port 8081.');
    stop(1);
  }
}

process.on('SIGINT', () => stop(130));
process.on('SIGTERM', () => stop(143));

try {
  tunnel = spawn('pnpm', [
    '--filter', 'worker', 'exec', 'wrangler', 'tunnel', 'quick-start', origin,
  ], { cwd: root, detached, stdio: ['ignore', 'pipe', 'pipe'] });

  const tunnelUrl = await new Promise((resolve, reject) => {
    let output = '';
    const timeout = setTimeout(() => reject(new Error('Cloudflare tunnel did not provide a URL within 45 seconds.')), 45_000);
    const onOutput = (chunk) => {
      output = (output + chunk.toString()).slice(-8_000);
      const match = output.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
      if (match) {
        clearTimeout(timeout);
        resolve(match[0]);
      }
    };
    tunnel.stdout.on('data', onOutput);
    tunnel.stderr.on('data', onOutput);
    tunnel.once('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    tunnel.once('close', (code) => {
      clearTimeout(timeout);
      reject(new Error(`Cloudflare tunnel exited (${code}): ${output.slice(-1_000)}`));
    });
  });

  const launchUrl = `exps://${new URL(tunnelUrl).host}`;
  expo = spawn('pnpm', [
    '--filter', 'mobile', 'exec', 'expo', 'start', '--localhost', '--go', '--port', String(port),
  ], {
    cwd: root,
    detached,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, EXPO_PACKAGER_PROXY_URL: tunnelUrl },
  });
  expo.stdout.pipe(process.stdout);
  expo.stderr.pipe(process.stderr);
  void showQRWhenReady(launchUrl);

  tunnel.on('close', (code) => {
    if (!stopping) {
      console.error(`Cloudflare tunnel closed (${code}).`);
      stop(1);
    }
  });
  expo.on('error', (error) => {
    console.error(error);
    stop(1);
  });
  expo.on('close', (code) => stop(code ?? 1));
} catch (error) {
  console.error(error.message);
  stop(1);
}

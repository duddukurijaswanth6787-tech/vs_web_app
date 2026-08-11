// Frees a TCP port before dev-server startup.
//
// Why this exists: `nest start --watch` respawns the app as a child process
// on every file change. On Windows, Node's SIGTERM emulation does not
// reliably terminate that child (especially once it holds open Redis/BullMQ
// connections), so the old process can keep the port bound after a restart,
// causing the new instance to fail with EADDRINUSE while silently leaving
// the stale process serving old code. Killing whatever holds the port
// before every start makes this self-healing instead of requiring a manual
// taskkill + restart each time.
const { execSync } = require('child_process');

const port = process.argv[2] || process.env.PORT || '4000';

if (process.platform === 'win32') {
  try {
    const out = execSync(`netstat -ano -p tcp`, { encoding: 'utf8' });
    const pids = new Set();
    for (const line of out.split('\n')) {
      const match = line.match(/^\s*TCP\s+\S*:(\d+)\s+\S+\s+LISTENING\s+(\d+)/i);
      if (match && match[1] === String(port)) {
        pids.add(match[2]);
      }
    }
    for (const pid of pids) {
      try {
        execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
        console.log(`[free-port] Killed stale process ${pid} on port ${port}`);
      } catch {
        // already gone, ignore
      }
    }
  } catch {
    // netstat/taskkill unavailable or nothing to kill — safe to continue
  }
} else {
  try {
    const out = execSync(`lsof -ti tcp:${port}`, { encoding: 'utf8' }).trim();
    if (out) {
      out.split('\n').forEach((pid) => {
        try {
          execSync(`kill -9 ${pid}`);
          console.log(`[free-port] Killed stale process ${pid} on port ${port}`);
        } catch {
          // ignore
        }
      });
    }
  } catch {
    // lsof unavailable or nothing to kill
  }
}

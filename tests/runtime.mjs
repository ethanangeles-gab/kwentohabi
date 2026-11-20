import { spawn } from "node:child_process";
import { mkdtemp, realpath, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import net from "node:net";
export async function createTestDirectory(label = "server") {
  return mkdtemp(path.join(os.tmpdir(), `kwentohabi-${label}-`));
}
export async function removeTestDirectory(dir) {
  const absolute = path.resolve(dir),
    root = await realpath(os.tmpdir());
  const actual = await realpath(absolute).catch(() => null);
  if (!actual) return;
  if (
    path.dirname(actual).toLowerCase() !== root.toLowerCase() ||
    !path.basename(actual).startsWith("kwentohabi-")
  )
    throw Error("Refused cleanup outside the generated test directory.");
  await rm(actual, {
    recursive: true,
    force: true,
    maxRetries: 5,
    retryDelay: 100,
  });
}
export async function stopChild(child) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  await new Promise((resolve) => {
    child.once("exit", resolve);
    child.kill();
  });
}
export async function fixture(extra = {}) {
  const dir = await createTestDirectory(),
    probe = net.createServer();
  await new Promise((resolve) => probe.listen(0, "127.0.0.1", resolve));
  const port = probe.address().port;
  await new Promise((resolve) => probe.close(resolve));
  let child,
    output = "";
  const start = async () => {
    child = spawn(process.execPath, ["--import", "tsx", "server.ts"], {
      windowsHide: true,
      env: {
        ...process.env,
        DATA_DIR: dir,
        PORT: String(port),
        NODE_ENV: "production",
        GEMINI_API_KEY: "",
        GEMINI_BASE_URL: "",
        APP_ORIGIN: "",
        TRUST_PROXY: "",
        COOKIE_SECURE: "false",
        MONTHLY_CHECK_LIMIT: "20",
        ...extra,
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    child.stdout.on("data", (data) => (output += data));
    child.stderr.on("data", (data) => (output += data));
    for (let i = 0; i < 240; i++) {
      if (child.exitCode !== null) throw Error(output);
      try {
        if ((await fetch(`http://127.0.0.1:${port}/api/health`)).ok) return;
      } catch {}
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    await stopChild(child);
    throw Error("Server failed to start: " + output);
  };
  const stop = () => stopChild(child);
  await start();
  return {
    dir,
    url: `http://127.0.0.1:${port}`,
    start,
    stop,
    cleanup: async () => {
      await stop();
      await removeTestDirectory(dir);
    },
  };
}
export function client(url) {
  let cookie = "";
  const request = async (endpoint, body, options = {}) => {
    const res = await fetch(url + endpoint, {
      method: body === undefined ? "GET" : options.method || "POST",
      headers: {
        "Content-Type": "application/json",
        Connection: "close",
        Cookie: cookie,
        ...options.headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (res.headers.get("set-cookie"))
      cookie = res.headers.get("set-cookie").split(";")[0];
    const raw = await res.text();
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      data = raw;
    }
    return { status: res.status, data, headers: res.headers };
  };
  return request;
}

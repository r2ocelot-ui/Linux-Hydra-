import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const AUDIT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "audit");

async function ensureDir() {
  await fs.mkdir(AUDIT_DIR, { recursive: true });
}

function dayFile(date = new Date()) {
  const d = date.toISOString().slice(0, 10);
  return path.join(AUDIT_DIR, `audit-${d}.jsonl`);
}

export async function appendAudit(entry) {
  try {
    await ensureDir();
    const line = JSON.stringify({ ts: new Date().toISOString(), ...entry }) + "\n";
    await fs.appendFile(dayFile(), line, "utf8");
  } catch (e) {
    console.warn("[audit] append failed:", e.message);
  }
}

export async function readRecent(limit = 100) {
  try {
    await ensureDir();
    const today = await fs.readFile(dayFile(), "utf8").catch(() => "");
    const yesterday = new Date(Date.now() - 86400000);
    const yest = await fs.readFile(dayFile(yesterday), "utf8").catch(() => "");
    const lines = (yest + today).trim().split("\n").filter(Boolean);
    return lines
      .slice(-limit)
      .reverse()
      .map((line) => {
        try { return JSON.parse(line); } catch (e) { return null; }
      })
      .filter(Boolean);
  } catch (e) {
    return [];
  }
}

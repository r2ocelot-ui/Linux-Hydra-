import { defineConfig } from "vite";
import { execSync } from "node:child_process";

function safeGitCommand(cmd) {
  try {
    return execSync(cmd, { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    return "";
  }
}

const buildHash = safeGitCommand("git rev-parse --short HEAD") || "dev";
const buildDate = new Date().toISOString();

export default defineConfig({
  define: {
    __BUILD_HASH__: JSON.stringify(buildHash),
    __BUILD_DATE__: JSON.stringify(buildDate),
  },
});

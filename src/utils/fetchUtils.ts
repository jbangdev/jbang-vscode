import { version } from "../extension";

export const createFetchOptions = () => ({
  headers: {
    "User-Agent": "jbang-vscode v" + version,
  },
  signal: AbortSignal.timeout(5000), // 5 second timeout
});

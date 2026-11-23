const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

// True only for a database on this machine (docker compose). Tests that write data use it
// so they never run against the shared database configured in .env.
export function isLocalDatabase(url: string | undefined) {
  if (!url || !URL.canParse(url)) return false;
  return LOCAL_HOSTS.has(new URL(url).hostname);
}

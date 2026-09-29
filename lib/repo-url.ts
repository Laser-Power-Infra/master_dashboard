// GitHub repository URL normalization.
// Kept dependency-free so both server routes and "use client" components can import it.
// (lib/service-mapper.ts pulls in the generated Prisma client and must stay server-only.)

const GITHUB_HOST = "github.com";

/**
 * Normalizes user input into a canonical https://github.com/owner/repo URL.
 * Returns null when the value is empty or not a github.com repository.
 *
 * Accepts: "github.com/org/repo", "org/repo", "http://github.com/org/repo.git",
 *          "https://github.com/org/repo/", "git@github.com:org/repo.git",
 *          "https://github.com/org/repo/tree/main" (extra path trimmed).
 */
export function normalizeRepoUrl(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  let value = String(raw).trim();
  if (!value || value.toLowerCase() === "null") return null;

  // Strip a leading "@" and any git@github.com: SSH form for convenience.
  if (value.startsWith("@")) value = value.slice(1);
  value = value.replace(/^git@github\.com:/i, "");

  if (!value) return null;

  const hasScheme = /^https?:\/\//i.test(value);

  // Bare "owner/repo" shorthand — expand onto github.com before parsing.
  if (!hasScheme) {
    const firstSegment = value.split("/")[0];
    if (!firstSegment.includes(".")) value = `https://${GITHUB_HOST}/${value}`;
    else value = `https://${value}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return null;
  }

  if (parsed.hostname.toLowerCase() !== GITHUB_HOST) return null;

  const segments = parsed.pathname
    .split("/")
    .map((s) => s.trim())
    .filter(Boolean);

  // GitHub supports extra path segments (/tree/main, /issues, ...) — use the first two.
  if (segments.length < 2) return null;

  const owner = segments[0].replace(/\.git$/i, "");
  const repo = segments[1].replace(/\.git$/i, "");
  if (!owner || !repo) return null;

  return `https://${GITHUB_HOST}/${owner}/${repo}`;
}

/** "owner/repo" for tooltips, or null when unset/invalid. */
export function repoSlug(raw: string | null | undefined): string | null {
  const url = normalizeRepoUrl(raw);
  if (!url) return null;
  return url.replace(`https://${GITHUB_HOST}/`, "");
}

export const CANONICAL_URL = "https://mindwink.cognixhub.com";

export function isCanonicalDeploy(url = process.env.NEXTAUTH_URL): boolean {
  return (url ?? "").replace(/\/$/, "") === CANONICAL_URL;
}

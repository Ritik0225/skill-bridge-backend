import { badGateway, badRequest, notFound } from "../../../utils/errors.js";

interface GithubRepo {
  name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  fork: boolean;
  topics?: string[];
  updated_at: string;
}

export interface GithubData {
  login: string;
  name: string | null;
  bio: string | null;
  publicRepos: number;
  followers: number;
  languages: string[];
  topRepos: Array<{
    name: string;
    description: string | null;
    language: string | null;
    stars: number;
    topics: string[];
  }>;
}

const GITHUB_API = "https://api.github.com";

function headers(token?: string): Record<string, string> {
  return {
    Accept: "application/vnd.github+json",
    "User-Agent": "SkillBridge",
    "X-GitHub-Api-Version": "2022-11-28",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/**
 * Fetch a public GitHub profile + repos via the official REST API.
 * Returns structured data plus a text blob for the AI extractor.
 */
export async function fetchGithub(
  username: string,
  token?: string,
): Promise<{ data: GithubData; text: string }> {
  const h = headers(token);

  const userRes = await fetch(`${GITHUB_API}/users/${encodeURIComponent(username)}`, { headers: h });
  if (userRes.status === 404) throw notFound(`GitHub user "${username}" not found`);
  if (userRes.status === 403) {
    throw badRequest("GitHub rate limit reached. Add a personal access token or try again later.");
  }
  if (!userRes.ok) throw badGateway(`GitHub request failed (${userRes.status})`);
  const user = (await userRes.json()) as {
    login: string;
    name: string | null;
    bio: string | null;
    public_repos: number;
    followers: number;
  };

  const reposRes = await fetch(
    `${GITHUB_API}/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated`,
    { headers: h },
  );
  if (!reposRes.ok) throw badGateway(`GitHub repos request failed (${reposRes.status})`);
  const repos = (await reposRes.json()) as GithubRepo[];

  const ownRepos = repos.filter((r) => !r.fork);
  const languages = [...new Set(ownRepos.map((r) => r.language).filter((l): l is string => !!l))];
  const topRepos = ownRepos
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 15)
    .map((r) => ({
      name: r.name,
      description: r.description,
      language: r.language,
      stars: r.stargazers_count,
      topics: r.topics ?? [],
    }));

  const data: GithubData = {
    login: user.login,
    name: user.name,
    bio: user.bio,
    publicRepos: user.public_repos,
    followers: user.followers,
    languages,
    topRepos,
  };

  // A compact text summary the AI can reason over.
  const text = [
    `GitHub user: ${data.login}${data.name ? ` (${data.name})` : ""}`,
    data.bio ? `Bio: ${data.bio}` : "",
    `Public repos: ${data.publicRepos} | Followers: ${data.followers}`,
    `Languages used: ${data.languages.join(", ") || "none detected"}`,
    "",
    "Top repositories:",
    ...topRepos.map(
      (r) =>
        `- ${r.name} [${r.language ?? "n/a"}, ★${r.stars}]${r.topics.length ? ` {${r.topics.join(", ")}}` : ""}: ${r.description ?? "no description"}`,
    ),
  ]
    .filter(Boolean)
    .join("\n");

  return { data, text };
}

const BASE = "https://api.github.com";

function getToken(repo: string): string {
  const org = repo.split("/")[0];
  const envKey = `${org.toUpperCase()}_GITHUB_TOKEN`;
  return process.env[envKey] ?? process.env.GITHUB_TOKEN ?? "";
}

function headers(repo: string) {
  return {
    Authorization: `Bearer ${getToken(repo)}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  };
}

export async function getFileSha(
  repo: string,
  path: string,
  branch: string
): Promise<string | null> {
  const res = await fetch(
    `${BASE}/repos/${repo}/contents/${path}?ref=${branch}`,
    { headers: headers(repo) }
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub API error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.sha ?? null;
}

export async function putFile(
  repo: string,
  path: string,
  content: string,
  branch: string,
  message: string,
  sha?: string | null
): Promise<{ commitUrl: string; commitSha: string } | null> {
  const body: Record<string, string> = {
    message,
    content: Buffer.from(content, "utf-8").toString("base64"),
    branch,
  };
  if (sha) body.sha = sha;

  const res = await fetch(`${BASE}/repos/${repo}/contents/${path}`, {
    method: "PUT",
    headers: headers(repo),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`GitHub put failed ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  return {
    commitSha: data.commit?.sha ?? "",
    commitUrl: data.commit?.html_url ?? `https://github.com/${repo}/commits/${branch}`,
  };
}

/** Like putFile but accepts an already-base64-encoded string (for binary files). */
export async function putFileBase64(
  repo: string,
  path: string,
  base64Content: string,
  branch: string,
  message: string,
  sha?: string | null
): Promise<void> {
  const body: Record<string, string> = {
    message,
    content: base64Content,
    branch,
  };
  if (sha) body.sha = sha;

  const res = await fetch(`${BASE}/repos/${repo}/contents/${path}`, {
    method: "PUT",
    headers: headers(repo),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`GitHub put failed ${res.status}: ${await res.text()}`);
  }
}

export async function listDirectory(
  repo: string,
  path: string,
  branch: string
): Promise<{ name: string; path: string; type: string }[]> {
  const res = await fetch(
    `${BASE}/repos/${repo}/contents/${path}?ref=${branch}`,
    { headers: headers(repo) }
  );
  if (res.status === 404) return [];
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function getFileContent(
  repo: string,
  path: string,
  branch: string
): Promise<string | null> {
  const res = await fetch(
    `${BASE}/repos/${repo}/contents/${path}?ref=${branch}`,
    { headers: headers(repo) }
  );
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.content) return null;
  return Buffer.from(data.content, "base64").toString("utf-8");
}

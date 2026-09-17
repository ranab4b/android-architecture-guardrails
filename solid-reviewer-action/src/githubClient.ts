import type { getOctokit } from "@actions/github";
import type { SolidFinding } from "./llmClient";

type Octokit = ReturnType<typeof getOctokit>;

const COMMENT_MARKER = "<!-- solid-reviewer-action -->";

export function formatAdvisoryComment(findings: SolidFinding[]): string {
  const rows = findings
    .map(
      (f) =>
        `| \`${f.file}:${f.line}\` | **${f.principle}** | ${f.reason} | ${f.suggestion} |`
    )
    .join("\n");

  return [
    COMMENT_MARKER,
    "### 🔎 SOLID principle review (advisory only — does not block merge)",
    "",
    "These are judgment calls from an LLM pass, not deterministic checks. Nothing here can fail this PR's checks.",
    "",
    "| Location | Principle | Why it's flagged | Suggestion |",
    "|---|---|---|---|",
    rows,
  ].join("\n");
}

export async function postAdvisoryComment(
  octokit: Octokit,
  owner: string,
  repo: string,
  prNumber: number,
  findings: SolidFinding[]
): Promise<void> {
  const body = formatAdvisoryComment(findings);

  const existing = await octokit.rest.issues.listComments({
    owner,
    repo,
    issue_number: prNumber,
  });

  const previous = existing.data.find((comment) => comment.body?.includes(COMMENT_MARKER));

  if (previous) {
    await octokit.rest.issues.updateComment({
      owner,
      repo,
      comment_id: previous.id,
      body,
    });
    return;
  }

  await octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number: prNumber,
    body,
  });
}

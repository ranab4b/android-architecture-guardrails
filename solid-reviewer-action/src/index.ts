import * as core from "@actions/core";
import * as github from "@actions/github";
import { parseDiff } from "./diffParser";
import { reviewDiffForSolidSmells } from "./llmClient";
import { postAdvisoryComment } from "./githubClient";

async function run(): Promise<void> {
  const githubToken = core.getInput("github-token", { required: true });
  const apiKey = core.getInput("anthropic-api-key");

  const context = github.context;
  const pullRequest = context.payload.pull_request;

  if (!pullRequest) {
    core.info("Not a pull_request event; skipping SOLID advisory review.");
    return;
  }

  if (!apiKey) {
    core.notice(
      "ANTHROPIC_API_KEY secret is not configured — skipping the LLM SOLID review. " +
        "Add it under Settings > Secrets and variables > Actions to enable advisory comments. " +
        "This is expected on forks/first-run and never fails the build."
    );
    return;
  }

  const octokit = github.getOctokit(githubToken);
  const { owner, repo } = context.repo;
  const prNumber = pullRequest.number;

  const diffResponse = await octokit.request(
    "GET /repos/{owner}/{repo}/pulls/{pull_number}",
    { owner, repo, pull_number: prNumber, mediaType: { format: "diff" } }
  );

  const diffText = diffResponse.data as unknown as string;
  const files = parseDiff(diffText);

  if (files.length === 0) {
    core.info("No Kotlin changes in this diff; skipping SOLID review.");
    return;
  }

  const findings = await reviewDiffForSolidSmells(files, apiKey);

  if (findings.length === 0) {
    core.info("LLM pass found no SOLID smells worth flagging.");
    return;
  }

  await postAdvisoryComment(octokit, owner, repo, prNumber, findings);
  core.info(`Posted advisory SOLID review with ${findings.length} finding(s).`);
}

run().catch((error) => {
  // Advisory-only: never fail the workflow, just surface a warning.
  core.warning(`SOLID advisory review did not complete: ${error instanceof Error ? error.message : String(error)}`);
});

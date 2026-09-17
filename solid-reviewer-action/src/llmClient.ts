import Anthropic from "@anthropic-ai/sdk";
import type { ParsedFile } from "./diffParser";

export type SolidPrinciple = "SRP" | "OCP" | "LSP" | "ISP" | "DIP";

export interface SolidFinding {
  file: string;
  line: number;
  principle: SolidPrinciple;
  reason: string;
  suggestion: string;
}

const SYSTEM_PROMPT = `You are an advisory code reviewer that ONLY flags violations of the five SOLID principles:
- SRP (Single Responsibility Principle): a class/function has more than one reason to change.
- OCP (Open/Closed Principle): behavior can't be extended without modifying existing code (e.g. type-switch chains that should be polymorphism).
- LSP (Liskov Substitution Principle): a subtype breaks a contract established by its supertype.
- ISP (Interface Segregation Principle): a client is forced to depend on methods it doesn't use.
- DIP (Dependency Inversion Principle): high-level code depends on a concrete/low-level implementation instead of an abstraction.

Rules:
1. Only flag genuine smells you can justify with a specific principle. Do not give generic "this could be cleaner" feedback.
2. Every finding MUST name exactly one of SRP, OCP, LSP, ISP, or DIP and explain WHY that specific principle is violated by this code.
3. Only comment on lines that were actually added in the diff you're given.
4. If you find nothing genuine, return an empty findings array. Do not invent smells to have something to say.
5. Respond with ONLY a JSON object matching this shape, no prose, no markdown fences:
{"findings": [{"file": string, "line": number, "principle": "SRP"|"OCP"|"LSP"|"ISP"|"DIP", "reason": string, "suggestion": string}]}`;

export async function reviewDiffForSolidSmells(
  files: ParsedFile[],
  apiKey: string
): Promise<SolidFinding[]> {
  if (files.length === 0) return [];

  const client = new Anthropic({ apiKey });

  const diffSummary = files
    .map((file) => {
      const lines = file.addedLines.map((l) => `${l.lineNumber}: ${l.content}`).join("\n");
      return `--- ${file.path} ---\n${lines}`;
    })
    .join("\n\n");

  const response = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Review these added lines from a pull request diff for SOLID principle smells:\n\n${diffSummary}`,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") return [];

  return parseFindings(textBlock.text);
}

function parseFindings(raw: string): SolidFinding[] {
  try {
    const cleaned = raw.trim().replace(/^```(?:json)?/, "").replace(/```$/, "");
    const parsed = JSON.parse(cleaned) as { findings?: unknown };
    if (!Array.isArray(parsed.findings)) return [];

    return parsed.findings.filter(isSolidFinding);
  } catch {
    return [];
  }
}

function isSolidFinding(value: unknown): value is SolidFinding {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  const validPrinciples: SolidPrinciple[] = ["SRP", "OCP", "LSP", "ISP", "DIP"];
  return (
    typeof candidate.file === "string" &&
    typeof candidate.line === "number" &&
    typeof candidate.reason === "string" &&
    typeof candidate.suggestion === "string" &&
    validPrinciples.includes(candidate.principle as SolidPrinciple)
  );
}

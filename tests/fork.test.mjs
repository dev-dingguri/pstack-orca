// The pstack-orca layer over the port's model policy: providers, modes, the
// one-entry-per-provider panel, pools, and the rendering of every role entry
// as model@provider.

import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { fanOutSkills, overrideSheetBlock, poolRoles, roleEntries, rolesSection } from "../tools/fork.mjs";
import { loadModels, parseModels, strayModelSlugs } from "../tools/generate.mjs";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const raw = JSON.parse(readFileSync(join(repoRoot, "plugins/pstack/models.json"), "utf8"));
const models = loadModels();
const role = (label) => models.roles.find((r) => r.role === label);

describe("provider panel", () => {
  test("candidates and adversaries run the first panel entry of each provider", () => {
    const panelLine = `${raw.tiers.panel[0]}@claude, ${raw.codex.panel[0]}@codex`;
    const assignments = overrideSheetBlock(models).split("\n").filter((line) => /^[a-z][^:]*: /.test(line));
    for (const label of ["interrogate reviewers", "arena runners"]) {
      expect(assignments).toContain(`${label}: ${panelLine}`);
      expect(rolesSection(models)).toMatch(new RegExp(`\\| ${label} \\| \\w+ \\| \\w+ \\| panel \\|`));
    }
    expect(fanOutSkills(models).sort()).toEqual(["arena", "interrogate"]);
    expect(poolRoles(models).map((r) => r.role)).toEqual(["arena cross-judge pool", "trail reviewer pool"]);
  });

  test("single-model roles default to the claude host on their tier", () => {
    for (const label of ["feature, refactoring", "bug-fix", "perf-issue", "hillclimb"]) {
      expect(roleEntries(models, role(label))).toEqual([`${raw.tiers[role(label).tier]}@claude`]);
    }
    expect(roleEntries(models, role("strongest judgment"))).toEqual([`${raw.tiers.strongest}@claude`]);
  });

  test("the Providers table names each host's model per single-model tier", () => {
    const section = rolesSection(models);
    const row = (id, host, tiers) =>
      `| \`${id}\` | ${host} | ${["default", "strongest", "worker"].map((t) => `\`${tiers[t]}@${id}\``).join(" | ")} |`;
    expect(section).toContain(row("claude", "Claude Code", raw.tiers));
    expect(section).toContain(row("codex", "Codex", raw.codex));
  });

  test("no rule swaps a role to the strongest model or sets effort by task difficulty", () => {
    const runRole = readFileSync(join(repoRoot, "plugins/pstack/skills/run-role/SKILL.md"), "utf8");
    expect(raw).not.toHaveProperty("taskEffort");
    expect(runRole).not.toMatch(/`strongest` (task|review)|task difficulty|Task tier/);
  });
});

describe("override sheet", () => {
  test("writes the port's default effort line and session hook line", () => {
    const sheet = overrideSheetBlock(models);
    expect(sheet).toContain(`\ndefault effort: ${raw.defaultEffort}\n`);
    expect(sheet).toContain("opus@claude @xhigh");
    expect(sheet).toMatch(/\nsession hook: on$/);
  });
});

describe("effort dispatch", () => {
  test("no effort agent ships, since run-role passes effort on the Agent call", () => {
    const agents = readdirSync(join(repoRoot, "plugins/pstack/agents"));
    expect(agents.filter((f) => f.startsWith("effort-"))).toEqual([]);
    expect(existsSync(join(repoRoot, "plugins/pstack/effort-agents"))).toBe(false);
    const runRole = readFileSync(join(repoRoot, "plugins/pstack/skills/run-role/SKILL.md"), "utf8");
    expect(runRole).toContain("`effort` set to the resolved effort");
    expect(runRole).not.toContain("pstack:effort-");
  });
});

describe("checkFork", () => {
  const parse = (mutate) => {
    const policy = structuredClone(raw);
    mutate(policy);
    return () => parseModels(policy, () => true);
  };

  test("accepts the committed policy", () => {
    expect(parse(() => {})).not.toThrow();
  });

  test("rejects a role without a mode", () => {
    expect(parse((p) => delete p.roles[0].mode)).toThrow(`role "${raw.roles[0].role}" needs a mode`);
  });

  test("rejects a role that lists models instead of naming a tier", () => {
    expect(parse((p) => (p.roles[0].models = ["haiku"]))).toThrow("must name a tier");
  });

  test("rejects a provider block model the provider does not list", () => {
    expect(parse((p) => (p.codex.default = "gpt-0-missing"))).toThrow('names "gpt-0-missing", which provider "codex" does not list');
  });

  test("rejects a provider list that is not exactly claude and codex", () => {
    const exactly = '"providers" must list exactly "claude" and "codex"';
    expect(parse((p) => (p.providers[0].id = "anthropic"))).toThrow(exactly);
    expect(parse((p) => (p.providers[1].id = "openai"))).toThrow(exactly);
    expect(parse((p) => p.providers.pop())).toThrow(exactly);
  });

  test("rejects a codex provider that would fall back to the claude tiers", () => {
    expect(parse((p) => delete p.providers[1].block)).toThrow('provider "codex" needs a block that models.json defines');
    expect(parse((p) => (p.providers[0].block = "codex"))).toThrow('provider "claude" reads the top-level tiers and takes no block');
  });

  test("rejects an empty panel tier, which would drop that provider from every panel", () => {
    expect(parse((p) => (p.codex.panel = []))).toThrow('provider "codex" has an empty panel tier');
    expect(parse((p) => (p.tiers.panel = []))).toThrow('provider "claude" has an empty panel tier');
  });
});

describe("stray Codex model IDs", () => {
  const file = "plugins/pstack/skills/other/SKILL.md";
  const [a, b] = [raw.codex.default, raw.codex.strongest];

  test("a listed Codex model outside an owned region is a stray, an unlisted one is not", () => {
    expect(strayModelSlugs(file, `# o\n\nPrefer ${a} here.\n`, models)).toHaveLength(1);
    expect(strayModelSlugs(file, "# o\n\nwe renamed `gpt-4` to `gpt-4o`\n", models)).toEqual([]);
  });

  test("a listed Codex model followed by sentence punctuation or a provider tag is a stray", () => {
    for (const text of [`Prefer ${a}.`, `Prefer ${b}. Then review.`, `Use ${a}@codex.`]) {
      expect(strayModelSlugs(file, text, models)).toEqual([`${file}:1: ${text}`]);
    }
  });

  test("a listed Codex model inside a longer model name is not a stray", () => {
    for (const text of [`${a}-mini`, `${a}.preview`, `${a}.1`, `custom-${a}`]) {
      expect(strayModelSlugs(file, text, models)).toEqual([]);
    }
  });
});

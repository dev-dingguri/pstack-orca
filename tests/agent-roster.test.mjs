// The Codex mapping names the plugin's subagent types by hand. Claude Code
// registers plugins/pstack/agents/ by default, so that copy is the one that
// can drift.
import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";

const pluginRoot = fileURLToPath(new URL("../plugins/pstack", import.meta.url));
const agents = readdirSync(join(pluginRoot, "agents"))
  .filter((file) => file.endsWith(".md"))
  .map((file) => basename(file, ".md"));

// The Codex mapping lists the bare names that have no spawn_agent type.
const rosters = [
  ["skills/poteto-mode/references/codex-tools.md", (name) => new RegExp(`\`${name}\``)],
];

describe("subagent roster", () => {
  test("agents/ holds the base poteto-agent", () => {
    expect(agents).toContain("poteto-agent");
  });

  for (const [file, mention] of rosters) {
    test(`${file} names every agent under agents/`, () => {
      const text = readFileSync(join(pluginRoot, file), "utf8");
      expect(agents.filter((name) => !mention(name).test(text))).toEqual([]);
    });
  }
});

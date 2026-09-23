// models.json is the model policy every stamped Models section, the override
// sheet, and the Codex mapping derive from. Nothing else validates its shape,
// and a role label is the runtime join key between the override sheet the
// user writes and the prose that tells the agent which role to look up.
import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { loadModels, providerOf, resolveModels, section } from "../tools/generate.mjs";
import { markdownFiles } from "../tools/validate-skills.mjs";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const skillsDir = join(repoRoot, "plugins/pstack/skills");
const raw = JSON.parse(readFileSync(join(repoRoot, "plugins/pstack/models.json"), "utf8"));
const models = loadModels();
const available = new Set(models.available.map((m) => m.slug));

describe("models.json shape", () => {
  test("available slugs are unique and the defaults are among them", () => {
    expect(available.size).toBe(models.available.length);
    expect(available.has(models.singleRoleDefault)).toBe(true);
    for (const slug of models.panel) expect(available.has(slug)).toBe(true);
    expect(new Set(models.panel).size).toBe(models.panel.length);
  });

  test("every role names an available model or the panel, and a skill directory that exists", () => {
    const labels = new Set();
    for (const role of raw.roles) {
      expect(typeof role.role).toBe("string");
      expect(labels.has(role.role)).toBe(false);
      labels.add(role.role);
      expect(existsSync(join(skillsDir, role.skill, "SKILL.md"))).toBe(true);
      if (role.models === "panel") continue;
      expect(Array.isArray(role.models) && role.models.length > 0).toBe(true);
      for (const slug of role.models) expect(available.has(slug)).toBe(true);
    }
  });

  test("the panel is written once and resolved by reference", () => {
    const literal = raw.roles.filter((r) => Array.isArray(r.models) && r.models.join() === raw.panel.join());
    expect(literal).toEqual([]);
    const resolved = resolveModels(raw).roles.filter((r) => raw.roles.find((x) => x.role === r.role).models === "panel");
    expect(resolved.length).toBeGreaterThan(0);
    for (const role of resolved) expect(role.models).toEqual(raw.panel);
  });

  test("every available model names a listed provider, every role a mode, and the panel spans providers", () => {
    const providers = new Set(raw.providers.map((p) => p.id));
    expect(providers.size).toBe(raw.providers.length);
    for (const m of raw.available) expect(providers.has(m.provider)).toBe(true);
    for (const role of raw.roles) expect(["consult", "execute"]).toContain(role.mode);
    const panelProviders = new Set(raw.panel.map((slug) => providerOf(raw, slug)));
    expect(panelProviders.size).toBeGreaterThan(1);
    for (const p of raw.providers) {
      expect(providerOf(raw, p.singleRoleDefault)).toBe(p.id);
      expect(providerOf(raw, p.strongestRoleDefault)).toBe(p.id);
      expect(p.singleRoleDefault).not.toBe(p.strongestRoleDefault);
    }
    const claude = raw.providers.find((p) => p.id === "claude");
    expect(claude.singleRoleDefault).toBe(raw.singleRoleDefault);
    for (const role of raw.roles) {
      if (role.models === "panel") continue;
      for (const slug of role.models) expect(providerOf(raw, slug)).toBe("claude");
    }
  });

  test("the file stays one row per entry so a role change is a one-line diff", () => {
    const text = readFileSync(join(repoRoot, "plugins/pstack/models.json"), "utf8");
    const rows = raw.providers.length + raw.available.length + raw.roles.length;
    expect(text.split("\n").length).toBeLessThan(rows * 2);
    expect(text.match(/^\s*\{ "/gm)).toHaveLength(rows);
  });

  test("the codex examples name distinct models", () => {
    expect(typeof models.codex.singleRoleExample).toBe("string");
    expect(typeof models.codex.strongestRoleExample).toBe("string");
    expect(new Set(models.codex.panelQuad).size).toBe(models.codex.panelQuad.length);
  });
});

describe("role labels reach the prose", () => {
  // The prose may hyphenate a label ("how-explorer" for the sheet's
  // "how explorer") and names only the first segment of a comma-joined label.
  const normalize = (text) => text.toLowerCase().replace(/[-\s]+/g, " ");

  function skillProse(skill) {
    return markdownFiles(join(skillsDir, skill))
      .map((file) => {
        const lines = readFileSync(file, "utf8").split("\n");
        const owned = section("Models")(lines);
        if (owned) lines.splice(owned[0] - 1, owned[1] - owned[0] + 1);
        return lines.join("\n");
      })
      .join("\n");
  }

  for (const role of models.roles) {
    test(`"${role.role}" is named by the ${role.skill} skill outside its stamped section`, () => {
      const needle = normalize(role.role.split(",")[0]);
      expect(normalize(skillProse(role.skill))).toContain(needle);
    });
  }
});

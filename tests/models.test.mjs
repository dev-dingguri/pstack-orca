// models.json is the model policy every stamped Models section, the override
// sheet, and the Codex mapping derive from. parseModels checks its shape when
// the generator loads it, and a role label is the runtime join key between the
// override sheet the user writes and the prose that tells the agent which role
// to look up.
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { loadModels, parseModels, regions } from "../tools/generate.mjs";
import { code } from "../tools/plugin.mjs";
import { RUNTIMES } from "../tools/runtimes.mjs";
import { markdownFiles } from "../tools/validate-skills.mjs";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const skillsDir = join(repoRoot, "plugins/pstack/skills");
const raw = JSON.parse(readFileSync(join(repoRoot, "plugins/pstack/models.json"), "utf8"));
const models = loadModels();

describe("committed models.json", () => {

  test("available models are the names the Claude Code Agent tool accepts", () => {
    // The Agent tool's `model` parameter is an enum of family names; a full ID
    // such as claude-opus-5-5 is rejected before the subagent starts.
    expect([...models.available].sort()).toEqual(["fable", "haiku", "opus", "sonnet"]);
  });

  test("the file stays one row per entry so a role change is a one-line diff", () => {
    const text = readFileSync(join(repoRoot, "plugins/pstack/models.json"), "utf8");
    expect(text.match(/^\s*\{ "/gm)).toHaveLength(raw.roles.length + raw.providers.length);
  });
});

describe("parseModels", () => {
  const anySkill = () => true;
  const parse = (mutate, skillExists = anySkill) => {
    const policy = structuredClone(raw);
    mutate(policy);
    return () => parseModels(policy, skillExists);
  };
  const role = (policy, label) => policy.roles.find((r) => r.role === label);

  test("resolves a tier by reference and keeps its name on the role", () => {
    const resolved = parseModels(structuredClone(raw), anySkill);
    const arena = role(resolved, "arena runners");
    expect(arena.tier).toBe("panel");
    expect(arena.models).toEqual(raw.tiers.panel);
    expect(role(resolved, "feature, refactoring").models).toEqual([raw.tiers.default]);
    expect(role(resolved, "strongest judgment").models).toEqual([raw.tiers.strongest]);
  });

  test("a null or non-object root fails naming models.json instead of a bare TypeError", () => {
    expect(() => parseModels(null, anySkill)).toThrow("models.json: must be an object");
    expect(() => parseModels(undefined, anySkill)).toThrow("models.json: must be an object");
    expect(() => parseModels([], anySkill)).toThrow("models.json: must be an object");
    expect(() => parseModels("x", anySkill)).toThrow("models.json: must be an object");
  });

  test("a null or non-object role fails naming the entry instead of a bare TypeError", () => {
    expect(parse((p) => (p.roles = [null]))).toThrow("models.json: roles[0] must be an object");
    expect(parse((p) => (p.roles = [undefined]))).toThrow("models.json: roles[0] must be an object");
    expect(parse((p) => (p.roles = ["x"]))).toThrow("models.json: roles[0] must be an object");
    expect(parse((p) => (p.roles = [[]]))).toThrow("models.json: roles[0] must be an object");
    expect(parse((p) => p.roles.splice(1, 0, null))).toThrow("models.json: roles[1] must be an object");
  });

  test("a missing top-level key throws naming it", () => {
    expect(parse((p) => delete p.efforts)).toThrow('models.json: "efforts" must be a list');
    expect(parse((p) => delete p.codex)).toThrow('models.json: "codex" must be an object');
  });

  test.each(["default", "strongest", "worker", "panel"])("a missing %s tier throws naming it, since a stamped region renders from it", (tier) => {
    expect(
      parse((p) => {
        delete p.tiers[tier];
        delete p.codex[tier];
        p.roles = p.roles.filter((r) => r.models !== tier);
      }),
    ).toThrow(`models.json: tiers has no "${tier}"`);
  });

  test("a role naming an undefined tier throws naming the role and the tier", () => {
    expect(parse((p) => (role(p, "bug-fix").models = "strongset"))).toThrow(
      'models.json: role "bug-fix" names tier "strongset", which tiers does not define',
    );
  });

  test("a slug outside available throws naming it, in a role or a tier", () => {
    expect(parse((p) => (role(p, "swarm workers").models = ["opsu"]))).toThrow(
      'models.json: role "swarm workers" names "opsu", which is not in available',
    );
    expect(parse((p) => (p.tiers.panel = ["opus", "gpt"]))).toThrow(
      'models.json: tier "panel" names "gpt", which is not in available',
    );
  });

  test("a role with no models throws naming the role", () => {
    expect(parse((p) => (role(p, "swarm workers").models = []))).toThrow(
      'models.json: role "swarm workers" needs a tier name or a non-empty list of models',
    );
  });

  test("a role list that repeats a tier throws, so the tier is written once", () => {
    expect(parse((p) => (role(p, "arena runners").models = [...raw.tiers.panel]))).toThrow(
      'models.json: role "arena runners" lists tier "panel" literally; name the tier',
    );
  });

  test("a duplicate role label throws naming it", () => {
    expect(parse((p) => p.roles.push({ ...role(p, "swarm workers") }))).toThrow(
      'models.json: role "swarm workers" appears twice',
    );
  });

  test("a role whose skill directory does not exist throws naming both", () => {
    expect(parse(() => {}, (skill) => skill !== "swarm")).toThrow(
      'models.json: role "swarm workers" names skill "swarm", which has no SKILL.md',
    );
  });

  test("a duplicate slug in available or in a panel throws naming it", () => {
    expect(parse((p) => p.available.push("opus"))).toThrow('models.json: available lists "opus" twice');
    expect(parse((p) => (p.tiers.panel = ["opus", "opus"]))).toThrow('models.json: tier "panel" lists "opus" twice');
    expect(parse((p) => (p.codex.panel = ["a", "a"]))).toThrow('models.json: codex "panel" lists "a" twice');
  });

  test("an effort level Claude Code does not accept, or a repeated one, throws naming it", () => {
    expect(parse((p) => p.efforts.push("extreme"))).toThrow(
      'models.json: effort "extreme" is not one of low, medium, high, xhigh, max',
    );
    expect(parse((p) => p.efforts.push("low"))).toThrow('models.json: efforts lists "low" twice');
  });

  test("a defaultEffort that is neither a level nor session throws naming it", () => {
    expect(parse((p) => (p.defaultEffort = "hgih"))).toThrow(
      'models.json: defaultEffort "hgih" is not an effort level or "session"',
    );
  });


  test("a codex block that misses or adds a tier throws naming the tier", () => {
    expect(parse((p) => delete p.codex.strongest)).toThrow('models.json: codex has no example for tier "strongest"');
    expect(parse((p) => (p.codex.fastest = "gpt"))).toThrow('models.json: codex names "fastest", which is not a tier');
  });

});

describe("role labels reach the prose", () => {
  // The prose may hyphenate a label ("swarm-workers" for the sheet's
  // "swarm workers") and names only the first segment of a comma-joined label.
  const normalize = (text) => text.toLowerCase().replace(/[-\s]+/g, " ");

  function skillProse(skill) {
    return markdownFiles(join(skillsDir, skill))
      .map((file) => {
        const lines = readFileSync(file, "utf8").split("\n");
        const owned = regions(models)
          .filter((r) => r.file === relative(repoRoot, file))
          .map((r) => r.locate(lines))
          .filter(Boolean);
        return lines.filter((_, i) => !owned.some(([s, e]) => i >= s && i < e)).join("\n");
      })
      .join("\n");
  }

  for (const role of models.roles) {
    test(`"${role.role}" is named by the ${role.skill} skill outside its stamped regions`, () => {
      const needle = normalize(role.role.split(",")[0]);
      expect(normalize(skillProse(role.skill))).toContain(needle);
    });
  }
});

// A role labelled "... pool" is a candidate list its skill picks one entry
// from, so a skill whose only panel role is a pool runs no panel.
test("each runtime mapping names exactly the skills with a non-pool panel role as its mixed-provider panels", () => {
  const panelSkills = [...new Set(models.roles.filter((r) => r.tier === "panel" && !r.role.endsWith(" pool")).map((r) => r.skill))].sort();
  const lists = markdownFiles(join(skillsDir, "poteto-mode/references")).flatMap((file) =>
    [...readFileSync(file, "utf8").matchAll(/Mixed-provider panels \(([^)]*)\)/g)].map((m) => ({
      file: relative(repoRoot, file),
      skills: [...m[1].matchAll(/`([^`]+)`/g)].map((s) => s[1]).sort(),
    })),
  );
  expect(lists.length).toBeGreaterThan(0);
  for (const list of lists) expect(list).toEqual({ ...list, skills: panelSkills });
});

test("moving a skill's roles off the panel tier drops it from every runtime's panel list", () => {
  const skill = models.roles.find((r) => r.tier === "panel").skill;
  const moved = { ...models, roles: models.roles.map((r) => (r.skill === skill ? { ...r, tier: "default" } : r)) };
  const panelLists = (m) => RUNTIMES.map((runtime) => runtime.modelNames(m).match(/Mixed-provider panels \(([^)]*)\)/)?.[1]).filter(Boolean);
  const before = panelLists(models);
  expect(before.length).toBeGreaterThan(0);
  for (const list of before) expect(list).toContain(code(skill));
  for (const list of panelLists(moved)) expect(list).not.toContain(code(skill));
});

// The runtimes other than Claude Code that pstack ships to: the table the
// generator iterates, with each runtime's Model names renderer, models.json
// check, versioned manifest, packaging validator, and hooks files. pstack-orca
// ships Claude Code and Codex only; it drops the port's other runtime builds,
// whose sheet readers reject the fork's model@provider entries.

import { codexModelNamesSection } from "./fork.mjs";
import { PLUGIN, SKILLS } from "./plugin.mjs";

export { codexModelNamesSection };

// Every runtime other than Claude Code that reads the skills through a mapping
// file under poteto-mode/references/. A row gives the runtime the generated
// Model names section in its mapping file, a pointer in poteto-mode's
// Platform Adaptation sentence, and a row with a `key` its
// models.json block, checked by `checkModels`. A `skillPreambles` runtime also gets a preamble under
// the first heading of each skill its Per-skill notes table lists.
// `manifest` is the file the generator stamps VERSION
// into, `validate` checks the runtime's packaging against the tree once that
// manifest parses, and `hooks` lists the hooks files the manifest names,
// relative to the plugin root.
export const RUNTIMES = [
  {
    name: "Codex",
    key: "codex",
    mapping: "codex-tools.md",
    modelNames: codexModelNamesSection,
    checkModels: tierExamples("codex"),
    skillPreambles: true,
    manifest: `${PLUGIN}/.codex-plugin/plugin.json`,
    validate: ({ manifest, read, pathExists }) =>
      validateCodexMarketplace(read(".agents/plugins/marketplace.json"), { expectedName: manifest.name, pathExists }),
    hooks: (manifest) => [manifest.hooks],
  },
].map((runtime) => ({
  ...runtime,
  tools: `${SKILLS}/poteto-mode/references/${runtime.mapping}`,
  notesHeader: `| Skill | On ${runtime.name} |`,
  preamble: runtime.skillPreambles
    ? `On ${runtime.name}, read the [platform mapping](../poteto-mode/references/${runtime.mapping}), ` +
      "including its per-skill notes, before following this skill."
    : null,
}));

// poteto-mode's Platform Adaptation sentence points at each mapping in row
// order, so the order of RUNTIMES is the order a reader meets the runtimes.
export const PLATFORM_ADAPTATION_OPEN = "These skills use Claude Code tool names";

export function platformAdaptation() {
  const pointer = (runtime) => `On ${runtime.name}, read [\`references/${runtime.mapping}\`](references/${runtime.mapping})`;
  const [first, ...rest] = RUNTIMES;
  return [
    `${PLATFORM_ADAPTATION_OPEN} (the \`Skill\` tool, the \`Agent\` tool, \`AskUserQuestion\`) and the Claude model names ` +
      "the `Agent` tool accepts, as each Models section lists them. On Claude Code they work as written.",
    `${pointer(first)} for the ${first.name} equivalent of a Claude tool, model, or skill named by these workflows.`,
    ...rest.map((runtime) => `${pointer(runtime)} instead.`),
    "Other runtimes can discover the same Agent Skills tree, but they must use their own tool, model, and " +
      "configuration equivalents. No one of these mappings is a cross-runtime map.",
  ].join(" ");
}

// Codex has no Claude aliases, so its block gives a model per tier.
// A declaration, so the RUNTIMES rows above can call it at module load.
function tierExamples(label) {
  return (block, { raw, fail, unique }) => {
    for (const tier of Object.keys(raw.tiers)) {
      if (!Object.hasOwn(block, tier)) fail(`${label} has no example for tier "${tier}"`);
    }
    for (const [tier, value] of Object.entries(block)) {
      if (!Object.hasOwn(raw.tiers, tier)) fail(`${label} names "${tier}", which is not a tier`);
      unique([value].flat(), `${label} "${tier}"`);
    }
  };
}

export function validateCodexMarketplace(text, { expectedName, pathExists }) {
  const manifest = JSON.parse(text);
  const plugins = manifest.plugins ?? [];
  if (plugins.length !== 1) {
    throw new Error(`.agents/plugins/marketplace.json: expected 1 plugin entry, found ${plugins.length}`);
  }
  const [plugin] = plugins;
  if (plugin.name !== expectedName) {
    throw new Error(
      `.agents/plugins/marketplace.json: plugin name "${plugin.name}" != Codex manifest name "${expectedName}"`,
    );
  }
  const path = plugin.source?.path;
  if (!path || !pathExists(path)) {
    throw new Error(`.agents/plugins/marketplace.json: source.path "${path}" does not resolve to a directory`);
  }
}

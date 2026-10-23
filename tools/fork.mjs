// The pstack-orca fork's layer over the port's model policy: the providers
// that run a model natively, the Orca mode of each role, and the default
// effort per task tier. Every stamped region that names a role entry renders
// it as `model@provider` from here, so run-role can tell a native dispatch
// from an Orca worker without looking anything up.

import { code } from "./plugin.mjs";

const MODES = ["consult", "execute"];
const TASK_TIERS = ["single", "strongest"];

// The claude provider reads the top-level tiers and available aliases; any
// other provider reads the runtime block its `block` names.
export const providerTiers = (models, provider) => (provider.block ? models[provider.block] : models.tiers);
export const providerModels = (models, provider) => (provider.block ? provider.available : models.available);

const tag = (model, provider) => `${model}@${provider.id}`;
const tagList = (entries) => entries.map(code).join(", ");

// A role's default entries on the claude host. A panel role takes one entry
// per provider from that provider's panel tier, so it mixes providers on every host.
export function roleEntries(models, role) {
  if (role.tier === "panel") {
    return models.providers.flatMap((p) => [providerTiers(models, p).panel].flat().map((m) => tag(m, p)));
  }
  const claude = models.providers.find((p) => p.id === "claude");
  return role.models.map((m) => tag(m, claude));
}

export const taskTier = (role) => (role.tier === "panel" ? "panel" : role.tier === "strongest" ? "strongest" : "single");

// Panel roles that are candidate lists: the calling skill picks one entry per
// dispatch instead of running one agent per entry. The label suffix is the
// convention run-role's prose documents.
export const poolRoles = (models) => models.roles.filter((r) => r.role.endsWith(" pool"));

export const panelSkills = (models) => [...new Set(models.roles.filter((r) => r.tier === "panel").map((r) => r.skill))];

// The panel skills that fan out one agent per entry, leaving out a skill
// whose only panel role is a pool.
export function fanOutSkills(models) {
  const pools = new Set(poolRoles(models));
  return [...new Set(models.roles.filter((r) => r.tier === "panel" && !pools.has(r)).map((r) => r.skill))];
}

// Every model ID a provider block lists, for the stray-slug scan. The claude
// aliases are already covered by the port's own scan.
export const providerSlugs = (models) =>
  models.providers.filter((p) => p.block).flatMap((p) => providerModels(models, p));

export function checkFork(raw, fail) {
  if (!Array.isArray(raw.providers) || raw.providers.length < 2) fail('"providers" must list at least two providers');
  const ids = new Set();
  for (const p of raw.providers) {
    if (ids.has(p.id)) fail(`provider "${p.id}" appears twice`);
    ids.add(p.id);
    if (!p.label || !p.host) fail(`provider "${p.id}" needs a label and a host`);
    if (!p.block) continue;
    if (!Array.isArray(p.available) || !p.available.length) fail(`provider "${p.id}" needs an available list`);
    const block = raw[p.block];
    if (!block) fail(`provider "${p.id}" names block "${p.block}", which models.json lacks`);
    for (const [tier, value] of Object.entries(block)) {
      for (const slug of [value].flat()) {
        if (!p.available.includes(slug)) fail(`${p.block} "${tier}" names "${slug}", which provider "${p.id}" does not list`);
      }
    }
  }
  if (!ids.has("claude")) fail('"providers" has no "claude" provider');
  for (const role of raw.roles) {
    if (!MODES.includes(role.mode)) fail(`role "${role.role}" needs a mode, one of ${MODES.join(", ")}`);
    if (typeof role.models !== "string") fail(`role "${role.role}" must name a tier so each host can resolve it`);
  }
  for (const tier of TASK_TIERS) {
    if (!raw.efforts.includes(raw.taskEffort?.[tier])) fail(`taskEffort "${tier}" is not an effort level`);
  }
}

export function modelsSection(roles, models) {
  const bullets = roles.map((r) => `- ${r.role}: ${tagList(roleEntries(models, r))} (${r.mode})`).join("\n");
  return (
    "Role defaults, stamped from `plugins/pstack/models.json` (edit there, rerun `tools/generate.mjs`). " +
    "A matching role line in the `pstack-models.md` override sheet overrides each at runtime; `/setup-pstack` writes it and lists its path per runtime. " +
    "Each entry is `model@provider`; the **run-role** skill runs an entry natively when its provider is the host " +
    "and as an Orca worker otherwise, in the mode shown.\n\n" +
    bullets
  );
}

export const reviewerRows = (models, role) =>
  roleEntries(models, role).map((entry, i) => `| Reviewer ${String.fromCharCode(65 + i)} | ${code(entry)} |`);

// The run-role skill's dispatch table: every role, the skill that owns it,
// the Orca mode a cross-provider entry runs in, and the default entries.
export function rolesSection(models) {
  const rows = models.roles.map(
    (r) => `| ${r.role} | ${r.skill} | ${r.mode} | ${taskTier(r)} | ${tagList(roleEntries(models, r))} |`,
  );
  const providers = models.providers.map((p) => {
    const tiers = providerTiers(models, p);
    return `| ${code(p.id)} | ${p.host} | ${code(tag(tiers.default, p))} | ${code(tag(tiers.strongest, p))} |`;
  });
  return (
    "Stamped from `plugins/pstack/models.json` (edit there, rerun `tools/generate.mjs`). " +
    "A matching role line in the override sheet replaces the default entries; the mode is fixed per role. " +
    "The default entries of a `single` or `strongest` role are the `claude` host's. Without a sheet line, " +
    "substitute the host provider's single-role or strongest-role default only when that provider has a row in the Providers table. " +
    "If no native provider is known or no row exists, keep the Roles table entries and route them through Orca. " +
    "A `panel` role keeps its mixed default on every host and runs one agent per entry, except a pool " +
    `(${poolRoles(models).map((r) => code(r.role)).join(", ")}), from which the calling skill selects one entry per dispatch ` +
    "under the pool rule in step 1; " +
    "a `strongest` task swaps each entry for its provider's strongest-role default without adding agents.\n\n" +
    "| Task tier | Default effort |\n| --- | --- |\n" +
    TASK_TIERS.map((t) => `| ${t} | ${code(models.taskEffort[t])} |`).join("\n") +
    "\n\n| Role | Skill | Mode | Tier | Default entries |\n| --- | --- | --- | --- | --- |\n" +
    rows.join("\n") +
    "\n\n### Providers\n\n" +
    "| Provider | Native host | Single-role default | Strongest-role default |\n| --- | --- | --- | --- |\n" +
    providers.join("\n")
  );
}

// An override value may name a reasoning effort after its entry, as the port
// allows. The fork keeps the port's syntax and adds the task-tier default
// for a value with neither a level nor a sheet line.
export function effortSection(levels) {
  return (
    "A role value in the override sheet may name a reasoning effort after its model, as in `opus@claude @xhigh`. " +
    "Levels on Claude Code: " + levels.map(code).join(", ") + ". Which ones apply depends on the model. " +
    "A value without ` @` takes the sheet's `default effort` line, a level or `session`; with no such line, " +
    "it takes the task tier's default effort from the **run-role** skill's Roles section. `session` sets no effort, " +
    "so the dispatch is the usual one. Strip the effort suffix before reading the model, and leave the provider tag " +
    "(`@claude`, `@codex`, written without a space) to run-role. `inherit-parent` or `auto` still omits `model` " +
    "at every level. run-role passes the level as the dispatch's effort field and keeps the `subagent_type` the " +
    "calling skill prescribes. That is `effort` on the Claude Code `Agent` call, `reasoning_effort` on Codex's " +
    "`spawn_agent`, and `--effort` on an Orca worker. On Muse it is `effort` on a Workflow child; a `subagent_spawn` " +
    "dispatch keeps the session's effort."
  );
}

export function setupModelsSection(models) {
  const byProvider = models.providers.map(
    (p) => `- Available ${p.label} models (provider ${code(p.id)}, native on ${p.host}): ${providerModels(models, p).map(code).join(", ")}`,
  );
  const panel = models.roles.find((r) => r.tier === "panel");
  const claude = models.providers.find((p) => p.id === "claude");
  return (
    "Stamped from `plugins/pstack/models.json` (edit there, rerun `tools/generate.mjs`).\n\n" +
    `${byProvider.join("\n")}\n` +
    `- Default panel: ${tagList(roleEntries(models, panel))}\n` +
    `- Reasoning effort levels: ${models.efforts.map(code).join(", ")}\n` +
    `- Default reasoning effort: ${code(models.taskEffort.single)} for ordinary work, ${code(models.taskEffort.strongest)} for difficult work\n` +
    `- Single-role default: ${code(tag(models.tiers.default, claude))}`
  );
}

// The override sheet the setup skill writes for users. The preamble is fixed;
// the role rows come from models.json. It carries no `default effort` line,
// so a value without a level keeps run-role's task-tier default.
export function overrideSheetBlock(models) {
  const rows = models.roles.map((r) => `${r.role}: ${roleEntries(models, r).join(", ")}`).join("\n");
  return (
    "# pstack model configuration\n\n" +
    "Per-role model overrides for pstack skills. Each pstack SKILL.md names its defaults in a Models section; " +
    "the values here override those defaults. Delete a line to fall back to the skill default. " +
    "Write each entry as `model@provider`; an entry whose provider is not the host runs as an Orca worker " +
    "through the run-role skill, and a bare model must be one the setup skill lists. " +
    "A value of `inherit-parent` or `auto` runs that role on the parent session's model (the `Agent` call omits `model`); " +
    "an alias entry in a panel list still counts toward that panel's fan-out. " +
    `A pool line (${poolRoles(models).map((r) => code(r.role)).join(", ")}) is a candidate list from which its skill selects one entry; its length sets no count. ` +
    "An entry may carry a reasoning effort after a space, as in `opus@claude @xhigh` (levels: " + models.efforts.join(", ") + "); " +
    "the role's subagent then runs at that level, each entry of a panel list on its own. " +
    "A `default effort` line sets the level for a value without one, and `session` keeps the parent session's effort; " +
    `without that line, ordinary work runs at ${code(models.taskEffort.single)} and difficult work at ${code(models.taskEffort.strongest)}. ` +
    "`session hook: off` stops the Claude Code, Codex, or Muse SessionStart hook, or the pstack Pi extension, from injecting the poteto-mode mandate; " +
    "any other value, or no line, leaves it on.\n\n" +
    rows +
    "\n\nsession hook: on"
  );
}

export function codexModelNamesSection(models) {
  const codex = models.providers.find((p) => p.id === "codex");
  const tiers = providerTiers(models, codex);
  const strongest = models.roles.filter((r) => r.tier === "strongest");
  const panel = models.roles.find((r) => r.tier === "panel");
  return (
    "Skills name defaults as `model@provider` entries (a single-role default for code/prose/judgment plus a " +
    "mixed-provider panel; each model-consuming skill lists its own in a Models section). On Codex the host " +
    "provider is `codex`: a `codex` entry runs natively through `spawn_agent`, and a `claude` entry runs as an " +
    "Orca worker running Claude Code, dispatched by the `run-role` skill through the bundled `orca-delegate` " +
    "skill. Single-model roles stay on the host so the caller is not blocked on a worker; run-role applies " +
    "these defaults to any single-model role with no sheet line:\n\n" +
    `- Single-model roles: the Codex single-role default ${code(tag(tiers.default, codex))}.\n` +
    `- Roles that default to the strongest Claude model (${strongest.map((r) => code(r.role)).join(", ")}): ` +
    `the Codex strongest-role default ${code(tag(tiers.strongest, codex))}.\n` +
    `- Mixed-provider panels (${fanOutSkills(models).map(code).join(", ")}): the adversarial signal comes from model diversity, so keep entries ` +
    `from both providers. The default panel is ${tagList(roleEntries(models, panel))}, one agent per entry: ` +
    "arena candidates, architect design candidates, and interrogate reviewers. " +
    `A pool (${poolRoles(models).map((r) => code(r.role)).join(", ")}) shares the panel defaults but is a candidate list: ` +
    "its skill selects one entry whose provider differs from the target it names, and the list length sets no count. " +
    `Ordinary work uses ${code(models.taskEffort.single)} effort; difficult work uses ${code(models.taskEffort.strongest)} and each provider's strongest-role default. ` +
    "If Orca is not installed, the Claude entries cannot start; " +
    "run-role reports each failed start and asks how to replace that entry.\n\n" +
    "`/setup-pstack` writes the configured model list. On Codex, write single-model roles as Codex entries."
  );
}

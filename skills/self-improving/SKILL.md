---
name: self-improving
description: >-
  Turn verified task experience into durable agent improvement by creating or
  refining reusable skills, while avoiding noisy or speculative updates. Use
  after substantial tasks, repeated workflows, user corrections, unexpected
  failures, tool or environment discoveries, and whenever an agent needed
  material steering or found a better repeatable procedure. Also use when the
  user asks the agent to learn, improve itself, capture lessons, prevent a
  repeated mistake, create a skill from the work, or update an existing skill.
  Run a brief improvement check near task completion even when not explicitly
  requested. Prefer global skills; modify application-repository skills only
  when the learning is inherently repository-specific or the user requires it.
license: MIT
compatibility: Requires filesystem access to an Agent Skills directory.
metadata:
  version: "1.1.0"
  provenance: authored
  maturity: proven
  category: workflow
  scope: global
---

# Self Improving

Improve the agent layer from real, verified experience. This is self-improving
AI in a basic operational sense: improve future context and procedures rather
than claiming to retrain or modify the underlying model. The goal is not to
record everything, but to reduce future steering, repeated errors, and
reinvention.

## Completion Check

Near the end of a task, perform this check without delaying the requested
deliverable:

1. Identify whether the task produced a durable lesson.
2. Decide whether it belongs in a skill, memory system, repository guidance,
   or nowhere.
3. If a skill change is justified and low-risk, make and validate it now.
4. Otherwise finish silently. Do not add ritual commentary when there is no
   useful improvement.

A lesson is durable when it is likely to help a future task and is supported by
one or more of:

- explicit user correction or preference;
- a verified failure and root cause;
- a repeatable multi-step workflow;
- a non-obvious tool, API, or environment constraint;
- repeated steering across tasks;
- a validation step that caught a plausible mistake;
- an existing skill that materially caused confusion, omission, or wasted work.

Do not create or update a skill for transient task state, generic advice, an
unverified guess, a one-off command, raw logs, credentials, customer data, or a
fact likely to become stale quickly.

## Choose The Durable Form

Use a skill for reusable procedures, decision rules, checklists, tool usage, and
verification methods. Use the environment's memory mechanism for stable facts,
preferences, decisions, and corrections that are not procedures. Use
repository guidance only for conventions that must travel with that repository.
Discard observations that are temporary or already represented accurately.

Do not invent a parallel memory system inside this skill. Use the host agent's
existing memory tools or files when available. When GBrain is available, use it
for durable facts, decisions, preferences, corrections, and ongoing context;
keep reusable procedures and verification workflows in Agent Skills.

## Select The Target

Prefer this order:

1. Update an existing global skill when its purpose already covers the lesson.
2. Create a new skill in the canonical self-improving skills collection when
   its source repository is available and the workflow is reusable across
   projects.
3. Otherwise create a new global skill under
   `~/.agents/skills/<skill-name>` when no existing skill owns it.
4. Update or create an application-repository skill only when the procedure
   depends on that repository's architecture, commands, policies, or team
   workflow, or when the user explicitly requests repository-local scope.
5. Update repository instruction files only when the lesson is a broad project
   invariant rather than an executable workflow.

Before writing, search global and relevant local skill metadata and read the
full candidate skill. Prefer improving one clear owner over duplicating or
fragmenting guidance across several skills. Never copy repository-specific
names, paths, secrets, or policies into a global skill unless generalized.

If the canonical self-improving collection is installed through a package manager,
edit its source checkout rather than an installed symlink, cache, or copy. Do
not commit or publish the source unless the user explicitly requests it.

If global and repository-local instructions conflict, preserve the narrower
repository rule for that repository. Do not weaken security, approval, safety,
or validation requirements while "improving" a skill.

## Generated Skill Identity

Make skills created from task experience easy to recognize, query, and export:

- Give every newly created skill a clear capability-based name, for example
  `api-error-triage`. Do not encode the task, incident, or repository that
  exposed it in the name.
- Add the metadata below to its frontmatter. Metadata is the durable identifier
  that distinguishes skills produced by this loop.
- Keep each skill as an immediate child of a standard skills directory so
  clients can discover it.
- Do not use a separate registry as the source of truth.

```yaml
metadata:
  provenance: self-improving
  maturity: candidate
  category: workflow
  scope: global
```

Use these dimensions independently:

- `provenance`: `self-improving`, `authored`, `imported`, or `derived`;
- `maturity`: `candidate`, `validated`, `proven`, or `deprecated`;
- `category`: `workflow`, `diagnostic`, `guardrail`, `integration`,
  `evaluation`, or `communication`;
- `scope`: `global` or `repository`.

Newly extracted skills start as `candidate`. Change them to `validated` after a
focused evaluation or successful reuse, and to `proven` after repeated use.
These string metadata fields comply with the Agent Skills specification and
make GitHub publication and discovery possible without polluting skill names.

When improving an existing skill, preserve its name and ownership. Add
`derived-improvement: self-improving` only when that attribution is useful; the
skill remains part of its original collection.

## Improvement Workflow

### 1. Extract Evidence

State the lesson internally as:

- situation: what class of task exposed it;
- evidence: correction, error, test result, or repeated steps;
- reusable rule: what should happen next time;
- scope: global or repository-specific;
- expected benefit: fewer errors, less steering, or faster execution.

If the reusable rule cannot be stated without task-specific details, do not
promote it to a skill yet.

### 2. Inspect Existing Skills

Search by names and descriptions first, then inspect likely owners. Check for:

- duplicate or contradictory guidance;
- an existing section where the lesson naturally belongs;
- whether the skill is vendored, generated, mirrored, or otherwise has a
  canonical source elsewhere;
- local instructions governing how that skill must be edited.

Edit the canonical source. Do not edit generated mirrors or vendored copies
unless they are explicitly the source of truth.

### 3. Decide Create Versus Update

Update when the lesson strengthens an existing skill's trigger, workflow, edge
case handling, or validation. Create only when the capability has a distinct,
coherent purpose and realistic future triggers.

One successful substantial workflow can justify a focused skill when the user
explicitly asks for reuse or recurrence is clearly likely. Otherwise prefer an
update, memory entry, or no action over speculative skill proliferation.

For a new skill, choose the capability portion of the name by purpose rather
than by the task, repository, ticket, date, person, or incident that exposed it.
For example, prefer `provider-rollout` over `project-1234-fix`.

### 4. Make The Smallest Durable Change

Follow the Agent Skills specification:

- directory name and frontmatter `name` must match;
- names use lowercase letters, numbers, and single hyphens, up to 64 characters;
- include a non-empty `description` of what the skill does and when to use it;
- keep `SKILL.md` focused and preferably below 500 lines;
- place detailed material in `references/`, deterministic helpers in
  `scripts/`, and templates in `assets/` only when they add real value;
- use relative links one level deep for bundled resources.

Write imperative, generalized guidance. Explain why constraints matter. Remove
stale or contradicted instructions instead of appending historical commentary.
Do not add confidence scores, episode logs, timestamps, or "evolution markers"
to operational guidance unless the host system explicitly requires them.

For a new skill, use this minimum shape:

```markdown
---
name: example-skill
description: What the skill does. Use when these concrete tasks or signals occur.
license: MIT
metadata:
  provenance: self-improving
  maturity: candidate
  category: workflow
  scope: global
---

# Example Skill

## Workflow

1. Inspect the real inputs.
2. Perform the procedure.
3. Verify the result.
```

Descriptions drive activation. Include concrete task signals and near-synonyms,
but do not claim unrelated work merely to trigger often. Put all trigger
guidance in the description rather than relying on non-standard hook metadata.

### 5. Validate

Validate every changed skill before claiming improvement:

1. Run `skills-ref validate <skill-directory>` when available.
2. Otherwise verify frontmatter, name constraints, directory/name equality,
   description length, relative resource links, and Markdown readability.
3. Re-read the changed guidance against the triggering experience.
4. Check that it would not cause harmful over-triggering, repository leakage,
   unsafe autonomy, or weaker verification.
5. For meaningful behavioral changes, exercise one representative prompt or
   use the installed skill-creation/evaluation workflow when available.

Do not let optional skill evaluation block the user's completed task. Use
proportionate validation for a small documentation-only refinement.

## Mutation Boundaries

Global skill files and the dedicated hard-won collection are the default
targets and may be edited when evidence is clear. Ask before a broad rewrite,
deletion, or semantic change that could affect many workflows. Follow any
stronger host policy requiring approval.

Application-repository skills and instruction files are project code. Do not
modify them merely because the task happened inside that repository. Modify
them only when the learning is inherently project-specific, the repository
declares them canonical, or the user requests the change. Preserve unrelated
work and follow the repository's edit, test, and version-control rules.

Never commit, push, publish, install dependencies, or transmit project content
as part of self-improvement unless the user explicitly requested that action.

## Reporting

If a skill changed, mention it briefly in the task's final response:

- skill path;
- durable lesson captured;
- validation performed.

Keep the task result primary. If no durable improvement was warranted, say
nothing about this check unless the user explicitly asked for a retrospective.

## Quality Test

A good improvement answers yes to all of these:

- Will it plausibly apply again?
- Is it supported by observed evidence rather than speculation?
- Is a skill the correct durable form?
- Is the scope global unless project specificity requires otherwise?
- Does it update the clear owner instead of creating duplication?
- Is the guidance concise, actionable, safe, and verifiable?
- Would a future agent need less steering because of it?

If any answer is no, capture it elsewhere or leave the skills unchanged.

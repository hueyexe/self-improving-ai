# Self-Improving AI

A single starting skill that helps an AI agent get better through use. It turns
verified work, user corrections, failures, and repeatable workflows into new or
improved Agent Skills instead of making the user repeat the same steering.

This is self-improving AI in a deliberately basic, practical sense. It does not
retrain the model. It improves the context and procedures the model receives on
future tasks.

## Memory and skills

The loop has two durable outputs:

- Memory stores facts, decisions, preferences, corrections, and ongoing context.
- Skills store reusable procedures, decision rules, tool usage, and verification.

It pairs naturally with GBrain: GBrain provides the memory layer, while this
starting skill grows and refines the procedural skill layer. GBrain is optional;
agents without it can use their existing memory mechanism.

## Install

Install the skill globally for every agent supported by the Skills CLI:

```bash
npx skills add https://github.com/hueyexe/self-improving-ai --all --global
```

The command installs `self-improving` at `~/.agents/skills/self-improving`
and links it into each supported agent's skill directory. Running it again is
safe and updates the existing installation.

To target specific agents instead of every supported agent:

```bash
npx skills add https://github.com/hueyexe/self-improving-ai \
  --skill self-improving \
  --agent claude-code codex kiro-cli opencode \
  --global --yes
```

List the installed skill and its source:

```bash
npx skills list --global
```

Update it later from GitHub:

```bash
npx skills update self-improving --global --yes
```

Remove it:

```bash
npx skills remove self-improving --global --yes
```

The all-agents install currently reports failures for Eve and PromptScript
because those clients do not support global skill installation. This does not
affect installation for the other supported agents. An `overwrites` line is
also expected when updating an existing installation.

## Skill conventions

- `skills/self-improving` is the only starting skill.
- Skills created by the loop use clear capability-based names.
- Generated skills carry independent provenance, maturity, category, and scope
  metadata so they remain easy to organize and export.
- New workflows start as `candidate`, become `validated` after focused testing
  or successful reuse, and become `proven` after repeated use.
- Repository-specific procedures remain with their repository rather than being
  generalized into this collection.

The repository is the collection boundary. Skill metadata describes where each
skill came from, what kind of skill it is, how mature it is, and where it
belongs without forcing those details into its public name.

```yaml
metadata:
  provenance: self-improving
  maturity: candidate
  category: workflow
  scope: global
```

Each directory under `skills/` follows the [Agent Skills
specification](https://agentskills.io/specification).

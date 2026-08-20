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

Install all skills globally:

```bash
npx skills add hueyexe/self-improving-ai --all --global
```

Install only the self-improvement skill:

```bash
npx skills add hueyexe/self-improving-ai \
  --skill self-improving --agent '*' --global --yes
```

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

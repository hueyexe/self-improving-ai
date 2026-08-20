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

It pairs naturally with [GBrain](https://github.com/garrytan/gbrain): GBrain
provides the memory layer, while this starting skill grows and refines the
procedural skill layer. GBrain is optional; agents without it can use their
existing memory mechanism.

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

## Completion adapters

The skill defines what to learn, but a lifecycle adapter makes the completion
check deterministic. Install the skill first, then enable the adapter for your
client. Each adapter triggers at most once per session and skips short sessions.

Defaults:

- Claude Code and Codex require a transcript of at least 12,000 bytes.
- OpenCode requires at least 8 messages.
- GBrain wording is disabled.

### OpenCode

Add the GitHub package to the `plugin` array in
`~/.config/opencode/opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": [
    [
      "github:hueyexe/self-improving-ai",
      { "minMessages": 8, "gbrain": false }
    ]
  ]
}
```

OpenCode loads configuration once. Restart it after changing the file. The
adapter listens for `session.idle`, checks the session message count, and uses
`session.promptAsync` to run one final review without blocking the event loop.

### Claude Code

Add this repository as a plugin marketplace and install the plugin:

```text
/plugin marketplace add hueyexe/self-improving-ai
/plugin install self-improving@self-improving-ai
```

The plugin uses a `Stop` hook. On the first stop after a substantial session it
blocks once and supplies the completion prompt; Claude Code's
`stop_hook_active` input and the plugin's session marker prevent recursion.

### Codex

Codex plugin hooks require a current Codex release with plugins and hooks
enabled. Add the GitHub marketplace and install the plugin:

```bash
codex plugin marketplace add hueyexe/self-improving-ai
codex plugin add self-improving@self-improving-ai
```

Open `/hooks` once after installation and trust the plugin's hook definition.
Codex intentionally does not trust newly installed plugin hooks automatically.
Open a new thread after installation so the plugin and skill are loaded.

### Optional [GBrain](https://github.com/garrytan/gbrain) context

GBrain is off by default. Set this environment variable before launching the
agent to include the optional memory guidance in the completion prompt:

```bash
export SELF_IMPROVING_GBRAIN=1
```

This does not install or configure GBrain. Follow the
[GBrain repository](https://github.com/garrytan/gbrain) for setup. The flag only
tells the review to use GBrain, when available, for durable non-procedural
memory while keeping procedures in Agent Skills.

Threshold overrides:

```bash
export SELF_IMPROVING_MIN_TRANSCRIPT_BYTES=12000 # Claude Code and Codex
export SELF_IMPROVING_MIN_MESSAGES=8             # OpenCode env fallback
```

Set a threshold to `0` to review every session. Lower thresholds increase cost
and make low-value skill churn more likely.

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

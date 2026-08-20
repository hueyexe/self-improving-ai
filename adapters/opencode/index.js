const DEFAULT_MIN_MESSAGES = 8
const COMPLETION_PROMPT = "Load the `self-improving` skill and perform its completion check for the work just completed. Only create or update a skill when this session produced verified, reusable procedural knowledge and the skill's evidence, scope, mutation, and validation rules are satisfied. Prefer the canonical self-improving skill collection when available. Do not create noise from transient task details, do not commit or publish unless explicitly requested, and finish silently when no durable improvement is warranted."
const GBRAIN_PROMPT = "\n\nGBrain is enabled for this review. Use it only for durable non-procedural facts, decisions, preferences, corrections, and ongoing context. Keep reusable procedures and verification workflows in Agent Skills. Do not save secrets, customer data, raw production data, transient task state, or unverified guesses."

function enabled(value) {
  return ["1", "true", "yes", "on"].includes(String(value ?? "").toLowerCase())
}

function completionPrompt(gbrain) {
  if (!gbrain && !enabled(process.env.SELF_IMPROVING_GBRAIN)) return COMPLETION_PROMPT
  return COMPLETION_PROMPT + GBRAIN_PROMPT
}

function minimumMessages(options) {
  const configured = options?.minMessages ?? process.env.SELF_IMPROVING_MIN_MESSAGES
  const parsed = Number.parseInt(String(configured ?? DEFAULT_MIN_MESSAGES), 10)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_MIN_MESSAGES
}

export const SelfImprovingPlugin = async ({ client, directory }, options = {}) => {
  const reviewed = new Set()

  return {
    event: async ({ event }) => {
      if (event.type !== "session.idle") return
      const sessionID = event.properties.sessionID
      if (reviewed.has(sessionID)) return

      const response = await client.session.messages({
        path: { id: sessionID },
        query: { directory },
      })
      const messages = response.data ?? []
      if (messages.length < minimumMessages(options)) return

      reviewed.add(sessionID)
      await client.session.promptAsync({
        path: { id: sessionID },
        query: { directory },
        body: { parts: [{ type: "text", text: completionPrompt(options.gbrain === true) }] },
      })
    },
  }
}

export default SelfImprovingPlugin

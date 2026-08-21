const DEFAULT_MIN_MESSAGES = 8
const COMPLETION_PROMPT = "Load the `self-improving` skill and perform its completion check for the work just completed. Only create or update a skill when this session produced verified, reusable procedural knowledge and the skill's evidence, scope, mutation, and validation rules are satisfied. Prefer the canonical self-improving skill collection when available. Do not create noise from transient task details, do not commit or publish unless explicitly requested, and finish silently when no durable improvement is warranted."
const GBRAIN_PROMPT = "\n\nGBrain is enabled for this review. Use it only for durable non-procedural facts, decisions, preferences, corrections, and ongoing context. Keep reusable procedures and verification workflows in Agent Skills. Do not save secrets, customer data, raw production data, transient task state, or unverified guesses."

function enabled(value) {
  return ["1", "true", "yes", "on"].includes(String(value ?? "").toLowerCase())
}

export function completionPrompt(gbrain) {
  if (!gbrain && !enabled(process.env.SELF_IMPROVING_GBRAIN)) return COMPLETION_PROMPT
  return COMPLETION_PROMPT + GBRAIN_PROMPT
}

export function minimumMessages(options) {
  const configured = options?.minMessages ?? process.env.SELF_IMPROVING_MIN_MESSAGES
  const parsed = Number.parseInt(String(configured ?? DEFAULT_MIN_MESSAGES), 10)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_MIN_MESSAGES
}

export function debugEnabled(options) {
  return options?.debug === true || enabled(process.env.SELF_IMPROVING_DEBUG)
}

async function debugLog(client, message, extra = {}) {
  try {
    await client.app?.log({
      body: {
        service: "self-improving",
        level: "debug",
        message,
        extra,
      },
    })
  } catch {
    // Diagnostics must not interfere with the session lifecycle.
  }
}

export const SelfImprovingPlugin = async ({ client, directory }, options = {}) => {
  const reviewed = new Set()
  const reviewing = new Set()
  const debug = debugEnabled(options)

  const log = async (message, extra) => {
    if (debug) await debugLog(client, message, extra)
  }

  return {
    event: async ({ event }) => {
      if (event.type !== "session.idle") return
      const sessionID = event.properties.sessionID
      if (reviewed.has(sessionID) || reviewing.has(sessionID)) {
        await log("completion review already handled", { sessionID })
        return
      }

      reviewing.add(sessionID)
      try {
        const response = await client.session.messages({
          path: { id: sessionID },
          query: { directory },
        })
        if (response.error) {
          await log("failed to read session messages", { sessionID })
          return
        }

        const messages = response.data ?? []
        const threshold = minimumMessages(options)
        if (messages.length < threshold) {
          await log("session below completion threshold", {
            sessionID,
            messageCount: messages.length,
            threshold,
          })
          return
        }

        const promptResponse = await client.session.promptAsync({
          path: { id: sessionID },
          query: { directory },
          body: { parts: [{ type: "text", text: completionPrompt(options.gbrain === true) }] },
        })
        if (promptResponse?.error) {
          await log("failed to queue completion review", { sessionID })
          return
        }

        reviewed.add(sessionID)
        await log("completion review queued", { sessionID, messageCount: messages.length })
      } catch (error) {
        await log("completion review failed", {
          sessionID,
          error: error instanceof Error ? error.message : String(error),
        })
      } finally {
        reviewing.delete(sessionID)
      }
    },
  }
}

export default SelfImprovingPlugin

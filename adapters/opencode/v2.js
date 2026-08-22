import { SelfImprovingPlugin, completionPrompt, debugEnabled, minimumMessages } from "./index.js"
export { SelfImprovingPlugin } from "./index.js"

const storageKey = (sessionID) => `sessions/${sessionID}/message-count`

function debugLog(ctx, message, extra = {}) {
  if (debugEnabled(ctx.options)) console.error(`self-improving: ${message}`, extra)
}

async function updateMessageCount(ctx, state, sessionID) {
  const current = state.messageCounts.get(sessionID)
    ?? (Number(await ctx.storage.get(storageKey(sessionID))) || 0)
  const next = current + 2
  state.messageCounts.set(sessionID, next)
  await ctx.storage.set(storageKey(sessionID), next)
}

async function reviewSession(ctx, state, sessionID) {
  if (state.reviewed.has(sessionID) || state.reviewing.has(sessionID)) return

  state.reviewing.add(sessionID)
  try {
    const messageCount = state.messageCounts.get(sessionID)
      ?? (Number(await ctx.storage.get(storageKey(sessionID))) || 0)
    const threshold = minimumMessages(ctx.options)
    if (messageCount < threshold) {
      debugLog(ctx, "session below completion threshold", { sessionID, messageCount, threshold })
      return
    }

    await ctx.session.prompt({
      sessionID,
      text: completionPrompt(ctx.options.gbrain === true),
    })
    state.reviewed.add(sessionID)
    await ctx.storage.remove(storageKey(sessionID))
    debugLog(ctx, "completion review queued", { sessionID, messageCount })
  } catch (error) {
    debugLog(ctx, "completion review failed", {
      sessionID,
      error: error instanceof Error ? error.message : String(error),
    })
  } finally {
    state.reviewing.delete(sessionID)
  }
}

export const SelfImprovingPluginV2 = {
  id: "self-improving",
  server: SelfImprovingPlugin,
  setup: (ctx) => {
    const controller = new AbortController()
    const state = { reviewed: new Set(), reviewing: new Set(), messageCounts: new Map() }
    const listen = async () => {
      for await (const event of ctx.event.subscribe({ signal: controller.signal })) {
        if (event.type === "session.execution.succeeded") {
          await updateMessageCount(ctx, state, event.data.sessionID)
        } else if (event.type === "session.idle") {
          await reviewSession(ctx, state, event.data.sessionID)
        }
      }
    }
    const task = listen().catch((error) => {
      if (error?.name !== "AbortError") debugLog(ctx, "event subscription failed", { error: String(error) })
    })

    return async () => {
      controller.abort()
      await task
    }
  },
}

export default SelfImprovingPluginV2

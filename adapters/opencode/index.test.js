import assert from "node:assert/strict"
import test from "node:test"

import SelfImprovingPlugin from "./index.js"
import SelfImprovingPluginV2 from "./v2.js"

test("prompts once after the configured message threshold", async () => {
  const prompts = []
  const client = {
    session: {
      messages: async () => ({ data: Array.from({ length: 4 }, () => ({})) }),
      promptAsync: async (request) => prompts.push(request),
    },
  }
  const plugin = await SelfImprovingPlugin({ client, directory: "/tmp" }, { minMessages: 4 })
  const event = { type: "session.idle", properties: { sessionID: "session-1" } }

  await plugin.event({ event })
  await plugin.event({ event })

  assert.equal(prompts.length, 1)
  assert.match(prompts[0].body.parts[0].text, /self-improving/)
  assert.doesNotMatch(prompts[0].body.parts[0].text, /GBrain is enabled/)
})

test("does not mark a session reviewed before it is substantial", async () => {
  let count = 1
  const prompts = []
  const client = {
    session: {
      messages: async () => ({ data: Array.from({ length: count }, () => ({})) }),
      promptAsync: async (request) => prompts.push(request),
    },
  }
  const plugin = await SelfImprovingPlugin({ client, directory: "/tmp" }, { minMessages: 2 })
  const event = { type: "session.idle", properties: { sessionID: "session-1" } }

  await plugin.event({ event })
  count = 2
  await plugin.event({ event })

  assert.equal(prompts.length, 1)
})

test("logs completion decisions when debug mode is enabled", async () => {
  const logs = []
  const client = {
    app: { log: async (entry) => logs.push(entry) },
    session: {
      messages: async () => ({ data: [{}] }),
      promptAsync: async () => ({}),
    },
  }
  const plugin = await SelfImprovingPlugin({ client, directory: "/tmp" }, { debug: true, minMessages: 2 })

  await plugin.event({ event: { type: "session.idle", properties: { sessionID: "session-1" } } })

  assert.equal(logs.length, 1)
  assert.equal(logs[0].body.service, "self-improving")
  assert.equal(logs[0].body.message, "session below completion threshold")
  assert.deepEqual(logs[0].body.extra, { sessionID: "session-1", messageCount: 1, threshold: 2 })
})

test("retries after promptAsync returns an error", async () => {
  let attempts = 0
  const client = {
    session: {
      messages: async () => ({ data: [{}, {}] }),
      promptAsync: async () => {
        attempts += 1
        return attempts === 1 ? { error: { message: "unavailable" } } : {}
      },
    },
  }
  const plugin = await SelfImprovingPlugin({ client, directory: "/tmp" }, { minMessages: 2 })
  const event = { type: "session.idle", properties: { sessionID: "session-1" } }

  await plugin.event({ event })
  await plugin.event({ event })

  assert.equal(attempts, 2)
})

test("does not queue duplicate concurrent reviews", async () => {
  let release
  let attempts = 0
  const pending = new Promise((resolve) => {
    release = resolve
  })
  const client = {
    session: {
      messages: async () => ({ data: [{}, {}] }),
      promptAsync: async () => {
        attempts += 1
        await pending
        return {}
      },
    },
  }
  const plugin = await SelfImprovingPlugin({ client, directory: "/tmp" }, { minMessages: 2 })
  const event = { type: "session.idle", properties: { sessionID: "session-1" } }

  const first = plugin.event({ event })
  await Promise.resolve()
  await plugin.event({ event })
  release()
  await first

  assert.equal(attempts, 1)
})

test("exposes the OpenCode v2 plugin definition", async () => {
  const prompts = []
  const storage = new Map()
  const controller = new AbortController()
  const events = async function* () {
    yield { type: "session.execution.succeeded", data: { sessionID: "session-1" } }
    yield { type: "session.execution.succeeded", data: { sessionID: "session-1" } }
    yield { type: "session.idle", data: { sessionID: "session-1" } }
    await new Promise((resolve) => controller.signal.addEventListener("abort", resolve, { once: true }))
  }
  const cleanup = SelfImprovingPluginV2.setup({
    options: { minMessages: 2 },
    event: { subscribe: events },
    storage: {
      get: async (key) => storage.get(key),
      set: async (key, value) => storage.set(key, value),
      remove: async (key) => storage.delete(key),
    },
    session: {
      prompt: async (request) => prompts.push(request),
    },
  })

  await new Promise((resolve) => setTimeout(resolve, 0))
  controller.abort()
  await cleanup()

  assert.equal(SelfImprovingPluginV2.id, "self-improving")
  assert.equal(prompts.length, 1)
  assert.equal(prompts[0].sessionID, "session-1")
  assert.match(prompts[0].text, /self-improving/)
})

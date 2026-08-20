import assert from "node:assert/strict"
import test from "node:test"

import SelfImprovingPlugin from "./index.js"

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

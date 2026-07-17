import { describe, it, expect, vi } from "vitest";
import { z } from "zod";
import { callStructured } from "../src/ai/callStructured.js";
import { aiCache } from "../src/ai/cache.js";
import type { AIProvider } from "../src/ai/types.js";

const schema = z.object({ skills: z.array(z.string()) });
const schemaName = "TestSkills";

function fakeProvider(name: string, impl: () => Promise<string>): AIProvider {
  return { name, isConfigured: () => true, generateJSON: impl };
}

describe("callStructured", () => {
  it("returns schema-validated, typed data from a provider", async () => {
    const p = fakeProvider("fake", async () => JSON.stringify({ skills: ["react"] }));
    const res = await callStructured({ schema, schemaName, system: "s", user: "u1", providers: [p] });
    expect(res.skills).toEqual(["react"]);
  });

  it("tolerates markdown-fenced JSON", async () => {
    const p = fakeProvider("fake", async () => '```json\n{"skills":["node"]}\n```');
    const res = await callStructured({ schema, schemaName, system: "s", user: "u2", providers: [p] });
    expect(res.skills).toEqual(["node"]);
  });

  it("retries when the model returns invalid JSON, then succeeds", async () => {
    let n = 0;
    const impl = vi.fn(async () => {
      n += 1;
      return n === 1 ? "not json at all" : JSON.stringify({ skills: ["ts"] });
    });
    const res = await callStructured({
      schema,
      schemaName,
      system: "s",
      user: "u3",
      providers: [fakeProvider("fake", impl)],
      maxRetries: 2,
    });
    expect(res.skills).toEqual(["ts"]);
    expect(impl).toHaveBeenCalledTimes(2);
  });

  it("falls back to the next provider on a transient (429) error", async () => {
    const p1 = fakeProvider("p1", async () => {
      const err = new Error("rate limit exceeded") as Error & { status?: number };
      err.status = 429;
      throw err;
    });
    const p2 = fakeProvider("p2", async () => JSON.stringify({ skills: ["fallback"] }));
    const res = await callStructured({
      schema,
      schemaName,
      system: "s",
      user: "u4",
      providers: [p1, p2],
      maxRetries: 0,
    });
    expect(res.skills).toEqual(["fallback"]);
  });

  it("serves identical requests from cache without a second provider call", async () => {
    aiCache.clear();
    const impl = vi.fn(async () => JSON.stringify({ skills: ["cached"] }));
    const args = {
      schema,
      schemaName,
      system: "sys-cache",
      user: "user-cache",
      providers: [fakeProvider("fake", impl)],
      cache: true,
    };
    const a = await callStructured(args);
    const b = await callStructured(args);
    expect(a).toEqual(b);
    expect(impl).toHaveBeenCalledTimes(1);
  });

  it("throws a 503 when no provider is configured", async () => {
    const unconfigured: AIProvider = {
      name: "none",
      isConfigured: () => false,
      generateJSON: async () => "",
    };
    await expect(
      callStructured({ schema, schemaName, system: "s", user: "u5", providers: [unconfigured] }),
    ).rejects.toMatchObject({ statusCode: 503 });
  });
});

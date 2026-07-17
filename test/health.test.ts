import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

const app = createApp();

describe("GET /health", () => {
  it("returns ok with db + uptime fields", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body).toHaveProperty("db");
    expect(res.body).toHaveProperty("uptime");
  });
});

describe("GET /api/v1", () => {
  it("returns the API descriptor", async () => {
    const res = await request(app).get("/api/v1");
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("SkillBridge API");
    expect(res.body.version).toBe("v1");
  });
});

describe("unknown route", () => {
  it("returns the standard 404 error envelope", async () => {
    const res = await request(app).get("/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("not_found");
  });
});

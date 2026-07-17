import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

const app = createApp();

async function tokenFor(email: string): Promise<string> {
  const res = await request(app)
    .post("/api/v1/auth/register")
    .send({ name: "B", email, password: "secret123" });
  return res.body.token;
}

describe("benchmark routes", () => {
  it("requires auth", async () => {
    const res = await request(app).post("/api/v1/benchmark").send({ experienceYears: 2 });
    expect(res.status).toBe(401);
  });

  it("validates the request body (missing/invalid experienceYears)", async () => {
    const token = await tokenFor("bench-val@example.com");
    const res = await request(app)
      .post("/api/v1/benchmark")
      .set("Authorization", `Bearer ${token}`)
      .send({ experienceYears: -3 });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("validation_error");
  });

  it("400s when benchmarking with no profile", async () => {
    const token = await tokenFor("bench-noprofile@example.com");
    const res = await request(app)
      .post("/api/v1/benchmark")
      .set("Authorization", `Bearer ${token}`)
      .send({ experienceYears: 2 });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("bad_request");
  });

  it("404s when no benchmark exists yet", async () => {
    const token = await tokenFor("bench-empty@example.com");
    const res = await request(app).get("/api/v1/benchmark").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

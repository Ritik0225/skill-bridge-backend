import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

const app = createApp();

async function tokenFor(email: string): Promise<string> {
  const res = await request(app)
    .post("/api/v1/auth/register")
    .send({ name: "C", email, password: "secret123" });
  return res.body.token;
}

describe("career routes", () => {
  it("requires auth", async () => {
    const res = await request(app).post("/api/v1/career/plan").send({});
    expect(res.status).toBe(401);
  });

  it("rejects an empty targetRole (validation)", async () => {
    const token = await tokenFor("career-val@example.com");
    const res = await request(app)
      .post("/api/v1/career/plan")
      .set("Authorization", `Bearer ${token}`)
      .send({ targetRole: "" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("validation_error");
  });

  it("400s when planning with no profile", async () => {
    const token = await tokenFor("career-noprofile@example.com");
    const res = await request(app)
      .post("/api/v1/career/plan")
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("bad_request");
  });

  it("404s when no career plan exists yet", async () => {
    const token = await tokenFor("career-empty@example.com");
    const res = await request(app)
      .get("/api/v1/career/plan")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

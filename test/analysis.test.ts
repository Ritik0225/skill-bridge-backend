import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

const app = createApp();

async function tokenFor(email: string): Promise<string> {
  const res = await request(app)
    .post("/api/v1/auth/register")
    .send({ name: "A", email, password: "secret123" });
  return res.body.token;
}

describe("analysis routes", () => {
  it("requires auth", async () => {
    const res = await request(app).post("/api/v1/analysis").send({ targetRole: "Senior FE" });
    expect(res.status).toBe(401);
  });

  it("validates the request body (missing targetRole)", async () => {
    const token = await tokenFor("analysis-val@example.com");
    const res = await request(app)
      .post("/api/v1/analysis")
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("validation_error");
  });

  it("400s when analyzing with no profile", async () => {
    const token = await tokenFor("analysis-noprofile@example.com");
    const res = await request(app)
      .post("/api/v1/analysis")
      .set("Authorization", `Bearer ${token}`)
      .send({ targetRole: "Senior Full Stack Engineer" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("bad_request");
  });

  it("404s when no analysis exists yet", async () => {
    const token = await tokenFor("analysis-empty@example.com");
    const res = await request(app).get("/api/v1/analysis").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

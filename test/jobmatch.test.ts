import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

const app = createApp();

async function tokenFor(email: string): Promise<string> {
  const res = await request(app)
    .post("/api/v1/auth/register")
    .send({ name: "J", email, password: "secret123" });
  return res.body.token;
}

const JD = "We are hiring a Senior Backend Engineer with Node.js, TypeScript, MongoDB and AWS experience to build scalable APIs.";

describe("jobmatch routes", () => {
  it("requires auth", async () => {
    const res = await request(app).post("/api/v1/jobmatch").send({ jdText: JD });
    expect(res.status).toBe(401);
  });

  it("rejects a too-short job description (validation)", async () => {
    const token = await tokenFor("jobmatch-val@example.com");
    const res = await request(app)
      .post("/api/v1/jobmatch")
      .set("Authorization", `Bearer ${token}`)
      .send({ jdText: "hiring dev" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("validation_error");
  });

  it("400s when matching with no profile", async () => {
    const token = await tokenFor("jobmatch-noprofile@example.com");
    const res = await request(app)
      .post("/api/v1/jobmatch")
      .set("Authorization", `Bearer ${token}`)
      .send({ jdText: JD });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("bad_request");
  });

  it("404s when no job match exists yet", async () => {
    const token = await tokenFor("jobmatch-empty@example.com");
    const res = await request(app).get("/api/v1/jobmatch").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

const app = createApp();

async function tokenFor(email: string): Promise<string> {
  const res = await request(app)
    .post("/api/v1/auth/register")
    .send({ name: "I", email, password: "secret123" });
  return res.body.token;
}

describe("interview routes", () => {
  it("requires auth", async () => {
    const res = await request(app).post("/api/v1/interview/readiness").send({});
    expect(res.status).toBe(401);
  });

  it("rejects an empty targetRole (validation)", async () => {
    const token = await tokenFor("interview-val@example.com");
    const res = await request(app)
      .post("/api/v1/interview/readiness")
      .set("Authorization", `Bearer ${token}`)
      .send({ targetRole: "" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("validation_error");
  });

  it("400s when assessing with no profile", async () => {
    const token = await tokenFor("interview-noprofile@example.com");
    const res = await request(app)
      .post("/api/v1/interview/readiness")
      .set("Authorization", `Bearer ${token}`)
      .send({ targetRole: "Backend Engineer" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("bad_request");
  });

  it("404s when no assessment exists yet", async () => {
    const token = await tokenFor("interview-empty@example.com");
    const res = await request(app).get("/api/v1/interview").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

describe("interview answer assessment", () => {
  it("requires auth to assess", async () => {
    const res = await request(app)
      .post("/api/v1/interview/assess")
      .send({ question: "What is a closure?", answer: "A function with captured scope." });
    expect(res.status).toBe(401);
  });

  it("rejects an empty answer (validation)", async () => {
    const token = await tokenFor("assess-val@example.com");
    const res = await request(app)
      .post("/api/v1/interview/assess")
      .set("Authorization", `Bearer ${token}`)
      .send({ question: "What is a closure in JavaScript?", answer: "" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("validation_error");
  });

  it("returns an empty practice history (200) when nothing assessed yet", async () => {
    const token = await tokenFor("assess-empty@example.com");
    const res = await request(app)
      .get("/api/v1/interview/answers")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.answers).toEqual([]);
  });
});
